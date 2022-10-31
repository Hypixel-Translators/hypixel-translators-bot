import MessageFormat from "@messageformat/core"
import {
	type BufferResolvable,
	type Message,
	MessageComponentInteraction,
	EmbedBuilder,
	TextChannel,
	ComponentType,
	escapeMarkdown,
	ButtonStyle,
	ButtonBuilder,
	ActionRowBuilder,
	type GuildTextBasedChannel,
	ChannelType,
	MessageFlags,
} from "discord.js"

import { colors, ids } from "../config.json"
import { client } from "../index"
import { crowdinVerify } from "../lib/crowdinverify"
import { db, type DbUser, cancelledEvents } from "../lib/dbclient"
import { leveling } from "../lib/leveling"
import { checkVariables, parseToNumberString, type Stats } from "../lib/util"

import type { Stream } from "node:stream"

client.on("messageCreate", async message => {
	if (!db) return void cancelledEvents.push({ listener: "messageCreate", args: [message] })

	if (message.system) return

	// Delete messages that contain empty spoilers (Discord bug)
	if (message.content.includes("||||")) {
		await message.delete()
		await (client.channels.cache.get(ids.channels.staffGeneral) as TextChannel).send({
			content: `${message.author}'s message in ${message.channel} was deleted because it contained an empty spoiler. Here's what it said:`,
			embeds: [{ description: escapeMarkdown(message.content) }],
		})
		return
	}

	// Publish message if sent in bot-updates or in a project-updates channel or if it's a tweet
	if (
		message.channel.type === ChannelType.GuildAnnouncement &&
		!message.flags.has(MessageFlags.Ephemeral) &&
		!message.components.length &&
		(message.channel.id === ids.channels.botUpdates ||
			(message.channel.id === ids.channels.twitter && !message.embeds[0]?.description?.startsWith("@")) ||
			message.channel.name.endsWith("-project-updates"))
	)
		return void (await message.crosspost())

	// Delete non-stringURL messages in review-strings
	const stringURLRegex = /https:\/\/(?:[a-z]{2}\.)?crowdin\.com\/translate\/\w+\/(?:\d+|all)\/en(?:-\w+)?(?:\?[\w\d%&=$+!*'()-]*)?#\d+/gi

	if (message.channel instanceof TextChannel && message.channel.name.endsWith("-review-strings")) {
		// Make sure the link leads to the correct language
		const msgFix = message.content.replaceAll(/(\/en)(?:-\w+)?/g, `$1-${message.channel.name.split("-")[0]}`),
			urls = msgFix.match(stringURLRegex)
		if (!urls) {
			if (message.author.bot) return
			await message.delete().catch(() => null)
		} else if (urls.length === 1 && msgFix === message.content) {
			await message.react("vote_yes:839262196797669427").catch(() => null)
			await message.react("vote_maybe:839262179416211477").catch(() => null)
			await message.react("vote_no:839262184882044931").catch(() => null)
		} else {
			const rawText = msgFix.split(stringURLRegex)

			for (let i = 0; i < urls.length; i++) {
				let firstText: string | null = null
				if (urls.length !== rawText.length && i === 0) firstText = rawText.shift()!
				await message.channel.send({
					content: `<@${message.author.id}>: ${i === 0 && firstText ? firstText : ""}${urls[i]}${rawText[i]}`,
					allowedMentions: { users: [] },
				})
			}
			await message.delete().catch(() => null)
		}
	}

	// Stop if user is a bot
	if (message.author.bot) return

	// Define command and leveling system
	const noXpChannels = [
			ids.categories.important,
			ids.categories.archived,
			ids.categories.verification,
			ids.channels.suggestions,
			ids.channels.bots,
			ids.channels.staffAnnouncements,
		],
		noXpRoles = [ids.roles.bot]
	client.channels.cache.filter(c => (c as TextChannel).name?.endsWith("review-strings")).forEach(c => noXpChannels.push(c.id))
	if (
		message.guild?.id === ids.guilds.main &&
		!noXpChannels.includes((message.channel as GuildTextBasedChannel).parentId!) &&
		!noXpChannels.includes(message.channel.id!) &&
		!message.member?.roles.cache.some(r => noXpRoles.includes(r.id))
	)
		await leveling(message)

	// Get the author from the database
	const author = await client.getUser(message.author.id)

	// Link correction system
	if (
		!message.channel.isDMBased() &&
		message.content.toLowerCase().includes("/translate/hypixel/") &&
		message.content.includes("://") &&
		/(?:https:\/\/)?(?:[a-z]{2}\.)?(?:crowdin\.com|translate\.hypixel\.net)\/translate\/\w+\/(?:\d+|all)\/en(?:-\w+)?/gi.test(
			message.content
		)
	) {
		if (
			message.channel.parentId === ids.categories.hypixel ||
			message.channel.parentId === ids.categories.sba ||
			message.channel.parentId === ids.categories.bot ||
			message.channel.parentId === ids.categories.quickplay
		) {
			const langFix = message.content
				.replace("translate.hypixel.net", "crowdin.com")
				.replace(/\/en-(?!en#)[a-z]{2,4}/gi, "/en")
				.replace(/[a-z]{2}\.(crowdin\.com)/gi, "$1")
			// Link isn't a string URL
			if (!/(?:\?[\w\d%&=$+!*'()-]*)?#\d+/gi.test(message.content)) {
				await message.react("vote_no:839262184882044931")
				const embed = new EmbedBuilder({
					color: colors.error,
					author: { name: getGlobalString("errors.wrongLink") },
					title: getGlobalString("wrongStringURL"),
					description: getGlobalString("example", { variables: { url: "https://crowdin.com/translate/hypixel/286/en-en#106644" } }),
					image: { url: "https://i.imgur.com/eDZ8u9f.png" },
				})
				// If it's also not en-en
				if (message.content !== langFix && message.channel.parentId === ids.categories.hypixel) {
					embed.setDescription(
						`${getGlobalString("example", {
							variables: { url: "https://crowdin.com/translate/hypixel/286/en-en#106644" },
						})}\n${getGlobalString("reminderLang", {
							variables: {
								format: "`crowdin.com/translate/.../.../en-en#`",
							},
						})}`
					)
					await db.collection<Stats>("stats").insertOne({ type: "MESSAGE", name: "wrongBadLink", user: message.author.id })
				} else await db.collection<Stats>("stats").insertOne({ type: "MESSAGE", name: "wrongLink", user: message.author.id })
				await message.reply({ embeds: [embed] })
				return
				// Link isn't in en-en, is in translate.hypixel or another Crowdin language
			} else if (message.content !== langFix && message.channel.parentId === ids.categories.hypixel) {
				await message.reply({ content: `${message.author}: ${langFix}`, allowedMentions: { users: [...message.mentions.users.keys()] } })
				await message.delete()
				await db.collection<Stats>("stats").insertOne({ type: "MESSAGE", name: "badLink", user: message.author.id })
				return
			}
		}
	}

	// Crowdin verification system
	if (/(https:\/\/)?(?:[a-z]{2}\.)?crowdin\.com\/profile\/?\S*/gi.test(message.content) && message.channel.id === ids.channels.verify) {
		await message.react("loading:882267041627766816")
		await crowdinVerify(message.member!, message.content.match(/(https:\/\/)?(?:[a-z]{2}\.)?crowdin\.com\/profile\/\S+/gi)?.[0], true)
		await message.delete().catch(() => null)
		await (message.channel as TextChannel).bulkDelete(
			(await (message.channel as TextChannel).messages.fetch()).filter(msgs => msgs.author.id === message.author.id)
		)
	}

	// Staff messaging system
	if (message.author !== client.user && message.channel.isDMBased()) {
		if (!message.content && message.stickers.size >= 0 && message.attachments.size === 0) return // We don't need stickers being sent to us
		const staffBots = client.channels.cache.get(ids.channels.staffBots) as TextChannel,
			controlButtons = new ActionRowBuilder<ButtonBuilder>({
				components: [
					new ButtonBuilder({
						style: ButtonStyle.Success,
						customId: "confirm",
						emoji: "✅",
						label: getGlobalString("pagination.confirm"),
					}),
					new ButtonBuilder({
						style: ButtonStyle.Danger,
						customId: "cancel",
						emoji: "❎",
						label: getGlobalString("pagination.cancel"),
					}),
				],
			})
		if (!author.staffMsgTimestamp || author.staffMsgTimestamp + 48 * 60 * 60 * 1000 < message.createdTimestamp) {
			const embed = new EmbedBuilder({
				color: colors.neutral,
				title: getGlobalString("staffDm.confirmation"),
				description: message.content,
				footer: { text: getGlobalString("staffDm.confirmSend"), iconURL: message.author.displayAvatarURL({ extension: "png" }) },
			})
			if (message.attachments.size > 0)
				embed.setTitle(`${getGlobalString("staffDm.confirmation")} ${getGlobalString("staffDm.attachmentsWarn")}`)
			const msg = await message.channel.send({ embeds: [embed], components: [controlButtons] }),
				collector = msg.createMessageComponentCollector<ComponentType.Button>({ idle: 60_000 })

			collector.on("collect", async buttonInteraction => {
				collector.stop("responded")
				controlButtons.components.forEach(button => button.setDisabled(true))
				if (buttonInteraction.customId === "cancel") {
					embed
						.setColor(colors.error)
						.setTitle(getGlobalString("staffDm.dmCancelled"))
						.setFooter({
							text: getGlobalString("staffDm.resendInfo"),
							iconURL: message.author.displayAvatarURL({ extension: "png" }),
						})
					await buttonInteraction.update({ embeds: [embed], components: [controlButtons] })
				} else if (buttonInteraction.customId === "confirm") await staffDm(buttonInteraction)
			})

			collector.on("end", async (_, reason) => {
				if (reason === "responded") return
				controlButtons.components.forEach(button => button.setDisabled(true))
				const timeOutEmbed = new EmbedBuilder({
					color: colors.error,
					author: { name: getGlobalString("staffDm.dmCancelled") },
					description: message.content,
					footer: { text: getGlobalString("staffDm.resendInfo"), iconURL: message.author.displayAvatarURL({ extension: "png" }) },
				})
				await msg.edit({ embeds: [timeOutEmbed], components: [controlButtons] })
			})
		} else await staffDm(message)

		async function staffDm(interactionOrMsg: MessageComponentInteraction | Message) {
			const afterConfirm = interactionOrMsg instanceof MessageComponentInteraction
			await db
				.collection<DbUser>("users")
				.updateOne({ id: message.author.id }, { $set: { staffMsgTimestamp: afterConfirm ? Date.now() : message.createdTimestamp } })
			const staffMsg = new EmbedBuilder({
					color: colors.neutral,
					author: { name: `Incoming message from ${message.author.tag}` },
					description: message.content,
				}),
				dmEmbed = new EmbedBuilder({
					color: colors.success,
					author: { name: getGlobalString("staffDm.messageSent") },
					description: message.content,
					footer: { text: getGlobalString("staffDm.noConfirmWarn"), iconURL: message.author.displayAvatarURL({ extension: "png" }) },
				})
			if (message.attachments.size > 1 || !(message.attachments.first()?.contentType?.startsWith("image") ?? true)) {
				const images: (BufferResolvable | Stream)[] = []
				message.attachments.forEach(file => images.push(file.attachment))
				staffMsg.setTitle("View attachments")
				dmEmbed.setTitle(getGlobalString("staffDm.attachmentSent", { variables: { number: message.attachments.size } }))
				await staffBots.send({ content: `/dm user:@${message.author.tag} message:`, embeds: [staffMsg], files: images })
				await message.channel.send({ embeds: [dmEmbed] })
				return
			} else if (message.attachments.size > 0) {
				staffMsg.setTitle("View attachment").setImage(message.attachments.first()!.url)
				dmEmbed.setTitle(getGlobalString("staffDm.attachmentSent", { variables: { number: 1 } }))
				await staffBots.send({ content: `/dm user:@${message.author.tag} message:`, embeds: [staffMsg] })
			} else await staffBots.send({ content: `/dm user:@${message.author.tag} message:`, embeds: [staffMsg] })
			if (afterConfirm) await interactionOrMsg.update({ embeds: [dmEmbed], components: [controlButtons] })
			else await interactionOrMsg.channel.send({ embeds: [dmEmbed] })
		}
	}

	// Suggestions channel management
	if (message.channelId === ids.channels.suggestions) {
		await message.react("✅")
		await message.react("❌")
	}

	/**
	 * Gets a string or an object of strings for the correct language and replaces all variables if any
	 * @param path Path to the string. Use dots to access strings inside objects
	 * @param options Additional options for getting the string
	 * @param options.variables Object containing all the variables and their corresponding text to be replaced in the string.
	 * @param options.file The name of the file to get strings from. Defaults to the command being ran
	 * @param options.lang The language to get the string from. Defaults to the author's language preference or "en".
	 * @returns A clean string with all the variables replaced or an object of strings. Will return `null` if the path cannot be found.
	 */
	function getGlobalString(
		path: string,
		{
			variables,
			file = "global",
			lang = author.lang ?? "en",
		}: { variables?: Record<string, string | number>; file?: string; lang?: string } = {}
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	): any {
		const command = client.commands.get(file)
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let enStrings: Record<string, any> | undefined = require(`../../strings/en/${file}.json`)
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let strings: Record<string, any> | undefined
		try {
			strings = require(`../../strings/${lang}/${file}.json`)
		} catch {
			strings = Object.assign({}, enStrings)
		}
		const pathSplit = path.split(".")
		let string

		for (const [index, pathPart] of pathSplit.entries()) {
			if (pathPart) {
				string = strings?.[pathPart] ?? enStrings?.[pathPart]

				// Check if the string isn't an object nor the end of the path
				if (typeof string === "object" && index !== pathSplit.length - 1) {
					strings = strings?.[pathPart]
					enStrings = enStrings?.[pathPart]
				} else {
					// If the string hasn't been added yet or if the variables changed
					if (!string || (typeof string === "string" && !checkVariables(strings?.[pathPart], enStrings?.[pathPart]))) {
						string = enStrings?.[pathPart]
						if (!string) {
							string = null // In case of fire
							if (command?.category !== "Admin" && command?.category !== "Staff" && !path.includes(" "))
								console.error(`Couldn't get string ${path} in English for ${file}, please fix this`)
						}
					}
					if (typeof string === "string" && variables) {
						for (const [variable, value] of Object.entries(variables))
							string = string.replace(`%%${variable}%%`, typeof value === "number" ? parseToNumberString(value, getGlobalString)[0] : value)
						const locale = lang.replace("_", "-")
						string = new MessageFormat(
							{
								[locale]: (value: string | number, ord?: boolean) =>
									new Intl.PluralRules(locale, { type: ord ? "ordinal" : "cardinal" }).select(Number(value)),
							}[locale]
						).compile(string)(variables)
					}
				}
			} else if (strings) string = strings
			else string = enStrings
		}
		return string
	}
})
