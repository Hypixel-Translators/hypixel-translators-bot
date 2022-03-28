import { MessageActionRow, MessageButton, MessageEmbed, TextChannel } from "discord.js"
import { getEmoji } from "language-flag-colors"

import { colors, ids } from "../../config.json"
import { client } from "../../index"
import { db } from "../../lib/dbclient"
import { generateTip, MongoLanguage, transformDiscordLocale } from "../../lib/util"

import type { Command, GetStringFunction } from "../../lib/imports"

const command: Command = {
	name: "prefix",
	description: "Gives the author the appropriate prefix for their language(s).",
	options: [
		{
			type: "STRING",
			name: "flags",
			description: "The flags to be applied to your prefix, separated with spaces.",
			required: false,
		},
	],
	cooldown: 30,
	roleWhitelist: [
		ids.roles.botTranslator,
		ids.roles.qpTranslator,
		ids.roles.sbaTranslator,
		ids.roles.hypixelTranslator,
		ids.roles.botPf,
		ids.roles.qpPf,
		ids.roles.sbaPf,
		ids.roles.hypixelPf,
	],
	channelWhitelist: [ids.channels.bots, ids.channels.staffBots, ids.channels.botDev],
	async execute(interaction, getString: GetStringFunction) {
		if (!interaction.inCachedGuild()) return
		const randomTip = generateTip(getString),
			nickNoPrefix = interaction.member.displayName.replaceAll(/\[[^\s]*\] ?/g, "").trim(),
			languages = await db.collection<MongoLanguage>("languages").find().toArray()

		if (interaction.options.getString("flags", false) && !interaction.member.roles.cache.hasAny(ids.roles.hypixelTranslator, ids.roles.hypixelPf)) {
			const flagEmojis: (string | null)[] = []
			interaction.options
				.getString("flags", true)
				.split(" ")
				.forEach(emoji => {
					if (emoji.toLowerCase() === "lol" || emoji.toLowerCase() === "lolcat") flagEmojis.push("😹")
					else if (emoji.toLowerCase() === "enpt" || emoji.toLowerCase() === "pirate") flagEmojis.push("☠")
					else if (emoji.toLowerCase() === "ib" || emoji.toLowerCase() === "banana") flagEmojis.push("🍌")
					else if (emoji.toLowerCase() === "bc" || emoji.toLowerCase() === "biscuitish") flagEmojis.push("🍪")
					else flagEmojis.push(getEmoji(emoji)!)
				})
			if (!flagEmojis.length || flagEmojis.includes(null)) throw "falseFlag"

			const prefix = flagEmojis.join("-"),
				confirmEmbed = new MessageEmbed({
					color: colors.neutral,
					author: { name: getString("moduleName") },
					title: getString("caution"),
					description: `${getString("warning")}\n${getString("reactTimer", { variables: { cooldown: this.cooldown! } })}`,
					fields: [{ name: getString("previewT"), value: `\`[${prefix}] ${nickNoPrefix}\`` }],
					footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ format: "png", dynamic: true }) },
				}),
				confirmButtons = new MessageActionRow({
					components: [
						new MessageButton({
							customId: "confirm",
							style: "SUCCESS",
							label: getString("pagination.confirm", { file: "global" }),
							emoji: "✅",
						}),
						new MessageButton({
							customId: "cancel",
							style: "DANGER",
							label: getString("pagination.cancel", { file: "global" }),
							emoji: "❎",
						}),
					],
				}),
				msg = await interaction.reply({ embeds: [confirmEmbed], components: [confirmButtons], fetchReply: true }),
				collector = msg.createMessageComponentCollector<"BUTTON">({ idle: this.cooldown! * 1000 })

			confirmButtons.components.forEach(button => button.setDisabled())
			collector.on("collect", async buttonInteraction => {
				const userDb = await client.getUser(buttonInteraction.user.id)
				if (interaction.user.id !== buttonInteraction.user.id) {
					return await buttonInteraction.reply({
						content: getString("pagination.notYours", {
							variables: { command: `/${this.name}` },
							file: "global",
							lang: userDb.lang ?? transformDiscordLocale(buttonInteraction.locale),
						}),
						ephemeral: true,
					})
				}
				collector.stop("responded")
				if (buttonInteraction.customId === "confirm") {
					if (interaction.member.nickname !== `[${prefix}] ${nickNoPrefix}`) {
						await interaction.member
							.setNickname(`[${prefix}] ${nickNoPrefix}`, "Used the prefix command")
							.then(async () => {
								const embed = new MessageEmbed({
									color: colors.success,
									author: { name: getString("moduleName") },
									title: getString("saved"),
									fields: [{ name: getString("newNickT"), value: `\`[${prefix}] ${nickNoPrefix}\`` }],
									footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ format: "png", dynamic: true }) },
								})
								await interaction.editReply({ embeds: [embed], components: [confirmButtons] })
								const staffAlert = new MessageEmbed({
									color: colors.loading,
									author: { name: "Prefix" },
									title: "A user manually changed their prefix",
									description: `${interaction.user} manually changed their prefix to include the following flag: ${prefix}\nMake sure they have the appropriate roles for this prefix and, if not, follow the appropriate procedure`,
									footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ format: "png", dynamic: true }) },
								})
								await (interaction.client.channels.cache.get(ids.channels.staffBots) as TextChannel).send({ embeds: [staffAlert] })
							})
							.catch(async err => {
								const embed = new MessageEmbed({
									color: colors.error,
									author: { name: getString("moduleName") },
									title: getString("errors.error"),
									description: err.toString(),
									fields: [{ name: getString("previewT"), value: `\`[${prefix}] ${nickNoPrefix}\`` }],
									footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ format: "png", dynamic: true }) },
								})
								await interaction.editReply({ embeds: [embed], components: [confirmButtons] })
								console.log(err.stack ?? err)
							})
					} else {
						const embed = new MessageEmbed({
							color: colors.success,
							author: { name: getString("moduleName") },
							title: getString("errors.alreadyThis") + getString("errors.notSaved"),
							fields: [{ name: getString("newNickT"), value: getString("noChanges") }],
							footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ format: "png", dynamic: true }) },
						})
						await interaction.editReply({ embeds: [embed], components: [confirmButtons] })
					}
				} else if (buttonInteraction.customId === "cancel") {
					const embed = new MessageEmbed({
						color: colors.error,
						author: { name: getString("moduleName") },
						title: getString("errors.cancelled") + getString("errors.notSaved"),
						fields: [{ name: getString("newNickT"), value: getString("noChanges") }],
						footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ format: "png", dynamic: true }) },
					})
					await interaction.editReply({ embeds: [embed], components: [confirmButtons] })
				}
			})
			collector.on("end", async (_collected, reason) => {
				if (reason === "responded") return
				if (prefix) {
					if (interaction.member.nickname !== `[${prefix}] ${nickNoPrefix}`) {
						await interaction.member
							.setNickname(`[${prefix}] ${nickNoPrefix}`, "Used the prefix command")
							.then(async () => {
								const embed = new MessageEmbed({
									color: colors.success,
									author: { name: getString("moduleName") },
									title: getString("saved"),
									fields: [{ name: getString("newNickT"), value: `\`[${prefix}] ${nickNoPrefix}\`` }],
									footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ format: "png", dynamic: true }) },
								})
								await interaction.editReply({ embeds: [embed], components: [confirmButtons] })
							})
							.catch(async err => {
								const embed = new MessageEmbed({
									color: colors.error,
									author: { name: getString("moduleName") },
									title: getString("errors.error"),
									description: err.toString(),
									fields: [{ name: getString("previewT"), value: `\`[${prefix}] ${nickNoPrefix}\`` }],
									footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ format: "png", dynamic: true }) },
								})
								await interaction.editReply({ embeds: [embed], components: [confirmButtons] })
								console.log(err.stack ?? err)
							})
					} else {
						const embed = new MessageEmbed({
							color: colors.success,
							author: { name: getString("moduleName") },
							title: getString("errors.alreadyThis") + getString("errors.notSaved"),
							fields: [{ name: getString("newNickT"), value: getString("noChanges") }],
							footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ format: "png", dynamic: true }) },
						})
						await interaction.editReply({ embeds: [embed], components: [confirmButtons] })
					}
				} else {
					const embed = new MessageEmbed({
						color: colors.error,
						author: { name: getString("moduleName") },
						title: getString("errors.timedOut"),
						description: getString("errors.timeOutCustom") + getString("errors.notSaved"),
						fields: [{ name: getString("newNickT"), value: getString("noChanges") }],
						footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ format: "png", dynamic: true }) },
					})
					await interaction.editReply({ embeds: [embed], components: [confirmButtons] })
				}
			})
		} else {
			await interaction.deferReply()
			let userLangs: MongoLanguage[] = [],
				prefixes = ""

			interaction.member.roles.cache.forEach(r => {
				const roleName = r.name.split(" ")
				roleName.splice(roleName.length - 1, 1)
				const role = roleName.join(" "),
					mongoLanguage = languages.find(l => l.name === role)
				if (mongoLanguage) userLangs.push(mongoLanguage)
			})
			userLangs = userLangs.reverse()
			let p = 0
			const rows: MessageActionRow[] = [],
				components: Map<string, MessageButton> = new Map()
			userLangs.forEach(entry => {
				const button = new MessageButton({
					style: "SUCCESS",
					customId: entry.code,
					emoji: entry.emoji,
				})
				if (rows[p].components.length >= 5) p++
				rows[p].addComponents(button)
				components.set(entry.code, button)
			})

			const confirmButton = new MessageButton({
					style: "SUCCESS",
					customId: "confirm",
					emoji: "✅",
					label: getString("pagination.confirm", { file: "global" }),
					disabled: true,
				}),
				cancelButton = new MessageButton({
					style: "DANGER",
					customId: "cancel",
					emoji: "❎",
					label: getString("pagination.cancel", { file: "global" }),
				})

			rows.push(new MessageActionRow().addComponents(confirmButton, cancelButton))

			if (!userLangs.length) {
				if (
					interaction.member.roles.cache.find(role => role.name.startsWith("Bot ") && role.id !== ids.roles.botUpdates) ||
					interaction.member.roles.cache.find(role => role.name.startsWith("SkyblockAddons "))
				) {
					const embed = new MessageEmbed({
						color: colors.error,
						author: { name: getString("moduleName") },
						title: getString("errors.trNoRoles"),
						description: getString("customPrefix"),
						footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ format: "png", dynamic: true }) },
					})
					client.cooldowns.get(this.name)!.delete(interaction.user.id)
					return void (await interaction.editReply({ embeds: [embed] }))
				} else {
					const embed = new MessageEmbed({
						color: colors.error,
						author: { name: getString("moduleName") },
						title: getString("errors.noLanguages"),
						footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ format: "png", dynamic: true }) },
					})
					client.cooldowns.get(this.name)!.delete(interaction.user.id)
					return void (await interaction.editReply({ embeds: [embed] }))
				}
			}
			const noChangesEmbed = new MessageEmbed({
					color: colors.neutral,
					author: { name: getString("moduleName") },
					title: getString("react"),
					description: getString("reactTimer", { variables: { cooldown: this.cooldown! } }),
					fields: [{ name: getString("previewT"), value: getString("noChanges") }],
					footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ format: "png", dynamic: true }) },
				}),
				msg = await interaction.editReply({ embeds: [noChangesEmbed], components: rows }),
				collector = msg.createMessageComponentCollector<"BUTTON">({ idle: this.cooldown! * 1000 })

			collector.on("collect", async buttonInteraction => {
				const userDb = await client.getUser(buttonInteraction.user.id)
				if (interaction.user.id !== buttonInteraction.user.id) {
					return await buttonInteraction.reply({
						content: getString("pagination.notYours", {
							variables: { command: `/${this.name}` },
							file: "global",
							lang: userDb.lang ?? transformDiscordLocale(buttonInteraction.locale),
						}),
						ephemeral: true,
					})
				}
				if (buttonInteraction.customId !== "cancel") confirmButton.setDisabled(true)
				if (buttonInteraction.customId === "confirm") {
					components.forEach(buttons => buttons.setDisabled())
					collector.stop("responded")
					if (prefixes) {
						if (interaction.member.nickname !== `[${prefixes}] ${nickNoPrefix}`) {
							await interaction.member
								.setNickname(`[${prefixes}] ${nickNoPrefix}`, "Used the prefix command")
								.then(async () => {
									const embed = new MessageEmbed({
										color: colors.success,
										author: { name: getString("moduleName") },
										title: getString("saved"),
										fields: [{ name: getString("newNickT"), value: `\`[${prefixes}] ${nickNoPrefix}\`` }],
										footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ format: "png", dynamic: true }) },
									})
									await buttonInteraction.update({ embeds: [embed], components: rows })
								})
								.catch(async err => {
									const embed = new MessageEmbed({
										color: colors.error,
										author: { name: getString("moduleName") },
										title: getString("errors.error"),
										description: err.toString(),
										fields: [{ name: getString("previewT"), value: `\`[${prefixes}] ${nickNoPrefix}\`` }],
										footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ format: "png", dynamic: true }) },
									})
									await buttonInteraction.update({ embeds: [embed], components: rows })
									console.log(err.stack ?? err)
								})
						} else {
							const embed = new MessageEmbed({
								color: colors.error,
								author: { name: getString("moduleName") },
								title: getString("errors.alreadyThis") + getString("errors.notSaved"),
								footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ format: "png", dynamic: true }) },
							})
							await buttonInteraction.update({ embeds: [embed], components: rows })
						}
					} else {
						const embed = new MessageEmbed({
							color: colors.error,
							author: { name: getString("moduleName") },
							title: getString("errors.confirmedNoFlags") + getString("errors.notSaved"),
							footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ format: "png", dynamic: true }) },
						})
						await buttonInteraction.update({ embeds: [embed], components: rows })
					}
				} else if (buttonInteraction.customId === "cancel") {
					components.forEach(buttons => buttons.setDisabled())
					collector.stop("responded")
					const embed = new MessageEmbed({
						color: colors.error,
						author: { name: getString("moduleName") },
						title: getString("errors.cancelled") + getString("errors.notSaved"),
						footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ format: "png", dynamic: true }) },
					})
					await buttonInteraction.update({ embeds: [embed], components: rows })
				} else {
					const clickedEntry = languages.find(entry => entry.code === buttonInteraction.customId)!
					if (prefixes) prefixes = `${prefixes}-${clickedEntry.emoji}`
					else prefixes = `${clickedEntry.emoji}`
					components.get(buttonInteraction.customId)?.setDisabled().setStyle("SECONDARY")
					const embed = new MessageEmbed({
						color: colors.neutral,
						author: { name: getString("moduleName") },
						title: getString("react"),
						description: getString("reactTimer2", { variables: { cooldown: this.cooldown! } }),
						fields: [{ name: getString("previewT"), value: `\`[${prefixes}] ${nickNoPrefix}\`` }],
						footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ format: "png", dynamic: true }) },
					})
					await buttonInteraction.update({ embeds: [embed], components: rows })
				}
			})

			collector.on("end", async (_collected, reason) => {
				if (reason === "responded") return
				components.forEach(buttons => buttons.setDisabled())
				if (prefixes.length > 0) {
					if (interaction.member.nickname !== `[${prefixes}] ${nickNoPrefix}`) {
						interaction.member
							.setNickname(`[${prefixes}] ${nickNoPrefix}`, "Used the prefix command")
							.then(async () => {
								const embed = new MessageEmbed({
									color: colors.success,
									author: { name: getString("moduleName") },
									title: getString("saved"),
									fields: [{ name: getString("newNickT"), value: `\`[${prefixes}] ${nickNoPrefix}\`` }],
									footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ format: "png", dynamic: true }) },
								})
								await interaction.editReply({ embeds: [embed], components: rows })
							})
							.catch(async err => {
								const embed = new MessageEmbed({
									color: colors.error,
									author: { name: getString("moduleName") },
									title: getString("errors.error"),
									description: err.toString(),
									fields: [{ name: getString("previewT"), value: `\`[${prefixes}] ${nickNoPrefix}\`` }],
									footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ format: "png", dynamic: true }) },
								})
								await interaction.editReply({ embeds: [embed], components: rows })
								console.log(err.stack ?? err)
							})
					} else {
						const embed = new MessageEmbed({
							color: colors.success,
							author: { name: getString("moduleName") },
							title: getString("errors.alreadyThis") + getString("errors.notSaved"),
							fields: [{ name: getString("newNickT"), value: getString("noChanges") }],
							footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ format: "png", dynamic: true }) },
						})
						await interaction.editReply({ embeds: [embed], components: rows })
					}
				} else {
					const embed = new MessageEmbed({
						color: colors.error,
						author: { name: getString("moduleName") },
						title: getString("errors.timedOut"),
						description: getString("errors.timeOut") + getString("errors.notSaved"),
						fields: [{ name: getString("newNickT"), value: getString("noChanges") }],
						footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ format: "png", dynamic: true }) },
					})
					await interaction.editReply({ embeds: [embed], components: rows })
				}
			})
		}
	},
}

export default command
