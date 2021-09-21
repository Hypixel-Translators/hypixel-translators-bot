import { client } from "../index"
import Discord from "discord.js"
import fs from "fs"
import type { Stream } from "stream"
import { crowdinVerify } from "../lib/crowdinverify"
import { leveling } from "../lib/leveling"
import { errorColor, successColor, neutralColor } from "../config.json"
import { db, DbUser } from "../lib/dbclient"
import { arrayEqual } from "../lib/util"

client.on("messageCreate", async message => {
	
	//Delete pinned message and thread created messages
	if (
		(message.type === "CHANNEL_PINNED_MESSAGE" && message.channel.type !== "DM") ||
		(message.type === "THREAD_CREATED" && (message.channel as Discord.TextChannel).name.endsWith("-review-strings"))
	) {
		await message.delete()
		return
	}

	//Stop if user is a bot
	if (message.author.bot) return

	//Define command and leveling system
	const noXp = [
		"613015467984158742", //Important
		"619190456911134750", //Archived
		"748267955552518175", //Verification
		"549894938712866816", //bots
		"782267779008823326", //music
		"622814312615903233" //staff-announcements
	]
	const noXpRoles = ["549894155174674432", "645208834633367562"] //Bot and Muted
	client.channels.cache.filter(c => (c as Discord.TextChannel).name?.endsWith("review-strings")).forEach(c => noXp.push(c.id))
	if (
		message.guild?.id === "549503328472530974" &&
		!noXp.includes((message.channel as Discord.GuildChannel).parentId!) &&
		!noXp.includes(message.channel.id!) &&
		!message.member?.roles.cache.some(r => noXpRoles.includes(r.id))
	)
		await leveling(message)

	//Publish message if sent in bot-updates or if it's a tweet
	if (message.channel.id === "732587569744838777" || //bot-updates
		message.channel.id === "618909521741348874" && !message.embeds[0]?.description?.startsWith("@")) { //twitter
		await message.crosspost()
		return
	}

	// Delete non-stringURL messages in review-strings
	const stringURLRegex = /(https:\/\/)?crowdin\.com\/translate\/hypixel\/(?:\d+|all)\/en(?:-\w+)?(?:\?[\w\d%&=$+!*'()-]*)?#\d+/gi
	if (message.channel instanceof Discord.TextChannel && message.channel.name.endsWith("-review-strings")) {
		if (!/(https:\/\/)?crowdin\.com\/translate\/hypixel\/(?:\d+|all)\/en(?:-\w+)?(?:\?[\w\d%&=$+!*'()-]*)?#\d+/gi.test(message.content)) await message.delete()
		else {
			await message.react("vote_yes:839262196797669427")
			await message.react("vote_maybe:839262179416211477")
			await message.react("vote_no:839262184882044931")
		}
	}

	//Get the author from the database
	const author: DbUser = await client.getUser(message.author.id)

	//Link correction system
	if (
		message.channel.type !== "DM" &&
		message.content.toLowerCase().includes("/translate/hypixel/") &&
		message.content.includes("://") &&
		/(https:\/\/)?(crowdin\.com|translate\.hypixel\.net)\/translate\/\w+\/(?:\d+|all)\/en(?:-\w+)?/gi.test(message.content)
	) {
		if (
			message.channel.parentId === "549503328472530977" || //Hypixel Translations
			message.channel.parentId === "748585307825242322" || //SkyblockAddons Translations
			message.channel.parentId === "763131996163407902" || //Bot Translations
			message.channel.parentId === "646083561769926668"    //Quickplay translations
		) {
			const langFix = message.content.replace(/translate\.hypixel\.net/gi, "crowdin.com").replace(/\/en-(?!en#)[a-z]{2,4}/gi, "/en-en")
			if (!/(?:\?[\w\d%&=$+!*'()-]*)?#\d+/gi.test(message.content)) {
				await message.react("vote_no:839262184882044931")
				const embed = new Discord.MessageEmbed()
					.setColor(errorColor as Discord.HexColorString)
					.setAuthor(getGlobalString("errors.wrongLink"))
					.setTitle(getGlobalString("wrongStringURL"))
					.setDescription(getGlobalString("example", { url: "https://crowdin.com/translate/hypixel/286/en-en#106644" }))
					.setImage("https://i.imgur.com/eDZ8u9f.png")
				if (message.content !== langFix && message.channel.parentId === "549503328472530977")
					embed.setDescription(
						`${getGlobalString("example", { url: "https://crowdin.com/translate/hypixel/286/en-en#106644" })}\n${getGlobalString("reminderLang", {
							format: "`crowdin.com/translate/.../.../en-en#`"
						})}`
					)
				await message.reply({ embeds: [embed] })
				return
			} else if (message.content !== langFix && message.channel.parentId === "549503328472530977") {
				await message.react("vote_no:839262184882044931")
				const correctLink = langFix.match(stringURLRegex)![0],
					embed = new Discord.MessageEmbed()
						.setColor(errorColor as Discord.HexColorString)
						.setAuthor(getGlobalString("errors.wrongLink"))
						.setTitle(getGlobalString("linkCorrectionDesc", { format: "`crowdin.com/translate/hypixel/.../en-en#`" }))
						.setDescription(`**${getGlobalString("correctLink")}**\n${correctLink.startsWith("https://") ? correctLink : `https://${correctLink}`}`)
				await message.reply({ embeds: [embed] })
				return
			}
		}
	}

	//Crowdin verification system
	if (/(https:\/\/)?([a-z]{2,}\.)?crowdin\.com\/profile?\/?\S{1,}/gi.test(message.content) && message.channel.id === "569178590697095168") {
		//verify
		await message.react("loading:882267041627766816")
		await crowdinVerify(message.member!, message.content.match(/(https:\/\/)([a-z]{2,}\.)?crowdin\.com\/profile\/\S{1,}/gi)?.[0], true)
		if (!message.deleted) await message.delete()
		const fiMessages = (await message.channel.messages.fetch()).filter(msgs => msgs.author.id === message.author.id)
		await (message.channel as Discord.TextChannel).bulkDelete(fiMessages)
	}

	//Staff messaging system
	const member = await message.client.guilds.cache.get("549503328472530974")!.members.cache.get(message.author.id)
	if (message.author !== client.user && message.channel.type === "DM" && !member!.roles.cache.has("645208834633367562")) { // Muted
		if (!message.content && message.stickers.size >= 0 && message.attachments.size === 0) return //we don't need stickers being sent to us
		const staffBots = client.channels.cache.get("624881429834366986") as Discord.TextChannel,
			hourCooldown = 48, // Hours to wait before asking for confirmation
			confirmTime = 60, // 1 min
			controlButtons = new Discord.MessageActionRow()
				.addComponents(
					new Discord.MessageButton()
						.setStyle("SUCCESS")
						.setCustomId("confirm")
						.setEmoji("✅")
						.setLabel(getGlobalString("pagination.confirm")),
					new Discord.MessageButton()
						.setStyle("DANGER")
						.setCustomId("cancel")
						.setEmoji("❎")
						.setLabel(getGlobalString("pagination.cancel"))
				)
		if (!author.staffMsgTimestamp || author.staffMsgTimestamp + hourCooldown * 60 * 60 * 1000 < message.createdTimestamp) {
			const embed = new Discord.MessageEmbed()
				.setColor(neutralColor as Discord.HexColorString)
				.setTitle(getGlobalString("staffDm.confirmation"))
				.setDescription(message.content)
				.setFooter(getGlobalString("staffDm.confirmSend"), message.author.displayAvatarURL({ format: "png", dynamic: true }))
			if (message.attachments.size > 0) embed.setTitle(`${getGlobalString("staffDm.confirmation")} ${getGlobalString("staffDm.attachmentsWarn")}`)
			const msg = await message.channel.send({ embeds: [embed], components: [controlButtons] }),
				collector = msg.createMessageComponentCollector<"BUTTON">({ idle: confirmTime * 1000 })

			let replied = false
			collector.on("collect", async buttonInteraction => {
				replied = true
				controlButtons.components.forEach(button => button.setDisabled(true))
				if (buttonInteraction.customId === "cancel") {
					embed
						.setColor(errorColor as Discord.HexColorString)
						.setTitle(getGlobalString("staffDm.dmCancelled"))
						.setFooter(getGlobalString("staffDm.resendInfo"), message.author.displayAvatarURL({ format: "png", dynamic: true }))
					await buttonInteraction.update({ embeds: [embed], components: [controlButtons] })
				} else if (buttonInteraction.customId === "confirm") await staffDm(buttonInteraction)
			})

			collector.on("end", async () => {
				if (replied) return
				controlButtons.components.forEach(button => button.setDisabled(true))
				const timeOutEmbed = new Discord.MessageEmbed()
					.setColor(errorColor as Discord.HexColorString)
					.setAuthor(getGlobalString("staffDm.dmCancelled"))
					.setDescription(message.content)
					.setFooter(getGlobalString("staffDm.resendInfo"), message.author.displayAvatarURL({ format: "png", dynamic: true }))
				await msg.edit({ embeds: [timeOutEmbed], components: [controlButtons] })
			})
		} else await staffDm(message)

		async function staffDm(interactionOrMsg: Discord.MessageComponentInteraction | Discord.Message) {
			const afterConfirm = interactionOrMsg instanceof Discord.MessageComponentInteraction
			await db.collection<DbUser>("users").updateOne({ id: message.author.id }, { $set: { staffMsgTimestamp: afterConfirm ? Date.now() : message.createdTimestamp } })
			const staffMsg = new Discord.MessageEmbed()
				.setColor(neutralColor as Discord.HexColorString)
				.setAuthor(`Incoming message from ${message.author.tag}`)
				.setDescription(message.content)
			const dmEmbed = new Discord.MessageEmbed()
				.setColor(successColor as Discord.HexColorString)
				.setAuthor(getGlobalString("staffDm.messageSent"))
				.setDescription(message.content)
				.setFooter(getGlobalString("staffDm.noConfirmWarn"), message.author.displayAvatarURL({ format: "png", dynamic: true }))
			if (message.attachments.size > 1 || !(message.attachments.first()?.contentType?.startsWith("image") ?? true)) {
				const images: (Discord.BufferResolvable | Stream)[] = []
				message.attachments.forEach(file => images.push(file.attachment))
				staffMsg.setTitle("View attachments")
				dmEmbed.setTitle(getGlobalString("staffDm.attachmentsSent"))
				await staffBots.send({ content: `/dm user:@${message.author.tag} message:`, embeds: [staffMsg], files: images })
				await message.channel.send({ embeds: [dmEmbed] })
				return
			} else if (message.attachments.size > 0) {
				staffMsg
					.setTitle("View attachment")
					.setImage(message.attachments.first()!.url)
				dmEmbed.setTitle(getGlobalString("staffDm.attachmentSent"))
				await staffBots.send({ content: `/dm user:@${message.author.tag} message:`, embeds: [staffMsg] })
			} else await staffBots.send({ content: `/dm user:@${message.author.tag} message:`, embeds: [staffMsg] })
			if (afterConfirm) await interactionOrMsg.update({ embeds: [dmEmbed], components: [controlButtons] })
			else await interactionOrMsg.channel.send({ embeds: [dmEmbed] })
		}
	}

	//Event role system
	if (message.member?.roles.cache.has("764442984119795732") && message.mentions.roles.has("863430999122509824") && message.content.includes("\n\n")) { //Discord Administrator and Event
		await db.collection("config").updateOne({ name: "event" }, { $push: { ids: message.id } })
		await message.react("vote_yes:839262196797669427")
		await message.react("vote_no:839262184882044931")
	}

	//Function to get strings
	/**
	 * Gets a string or an object of strings for the correct language and replaces all variables if any
	 * @param {string} path Path to the string. Use dots to access strings inside objects
	 * @param {Object} [variables] Object containing all the variables and their corresponding text to be replaced in the string.
	 * @param {string} [file] The name of the file to get strings from. Defaults to global
	 * @param {string} [lang] The language to get the string from. Defaults to the author's language preference.
	 * @returns A clean string with all the variables replaced or an object of strings. Will return `null` if the path cannot be found.
	 */
	function getGlobalString(
		path: string,
		variables?: { [key: string]: string | number } | string,
		file = "global",
		lang = author.lang ?? "en"
	): any {
		if (typeof variables === "string") {
			const languages = fs.readdirSync("./strings")
			lang = languages.includes(file) ? file : author.lang ?? "en"
			file = variables
		}
		const command = client.commands.get(file)
		let enStrings = require(`../../strings/en/${file}.json`)
		let strings: any
		try {
			strings = require(`../../strings/${lang}/${file}.json`)
		} catch {
			strings = require(`../../strings/en/${file}.json`)
		}
		const pathSplit = path.split(".")
		let string
		pathSplit.forEach(pathPart => {
			if (pathPart) {
				let jsonElement
				if (strings[pathPart]) jsonElement = strings[pathPart]
				else jsonElement = enStrings[pathPart]

				if (typeof jsonElement === "object" && pathSplit.indexOf(pathPart) !== pathSplit.length - 1) {
					//check if the string isn't an object nor the end of the path
					if (strings[pathPart]) strings = strings[pathPart]
					enStrings = enStrings[pathPart]
					return
				} else {
					string = strings[pathPart]
					if (!string || (typeof string === "string" && !arrayEqual(string.match(/%%\w+%%/g)?.sort(), enStrings[pathPart].match(/%%\w+%%/g)?.sort()))) {
						string = enStrings[pathPart] //if the string hasn't been added yet or if the variables changed
						if (!string) {
							string = null //in case of fire
							if (command?.category != "Admin" && command?.category != "Staff" && !path.includes(" "))
								console.error(`Couldn't get string ${path} in English for ${file}, please fix this`)
						}
					}
					if (typeof string === "string" && variables) {
						for (const [variable, text] of Object.entries(variables)) {
							string = string.replace(`%%${variable}%%`, String(text))
						}
					}
				}
			} else if (strings) string = strings
			else string = enStrings
		})
		return string
	}
})
