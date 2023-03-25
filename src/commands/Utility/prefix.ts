import {
	ActionRowBuilder,
	ButtonBuilder,
	EmbedBuilder,
	type TextChannel,
	ButtonStyle,
	ApplicationCommandOptionType,
	ComponentType,
} from "discord.js"
import { getEmoji } from "language-flag-colors"

import { colors, ids } from "../../config.json"
import { client } from "../../index"
import { db } from "../../lib/dbclient"
import { generateTip, type MongoLanguage, transformDiscordLocale } from "../../lib/util"

import type { Command, GetStringFunction } from "../../lib/imports"

const command: Command = {
	name: "prefix",
	description: "Lets you pick an appropriate prefix for your language(s)",
	options: [
		{
			type: ApplicationCommandOptionType.String,
			name: "flags",
			description: "The flags to be applied to your prefix, separated with spaces",
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
			nickNoPrefix = interaction.member.displayName.replaceAll(/\[.*\] ?/g, "").trim(),
			languages = await db.collection<MongoLanguage>("languages").find().toArray()

		if (
			interaction.options.getString("flags", false) &&
			!interaction.member.roles.cache.hasAny(ids.roles.hypixelTranslator, ids.roles.hypixelPf)
		) {
			const flagEmojis: (string | null)[] = []
			interaction.options
				.getString("flags", true)
				.split(" ")
				.forEach(emoji => {
					switch (emoji.toLowerCase()) {
						case "lol":
						case "lolcat":
							flagEmojis.push("😹")
							break
						case "enpt":
						case "pirate":
							flagEmojis.push("☠")
							break
						case "ib":
						case "banana":
							flagEmojis.push("🍌")
							break
						case "bc":
						case "biscuitish":
							flagEmojis.push("🍪")
							break
						default:
							flagEmojis.push(getEmoji(emoji)!)
					}
				})
			if (!flagEmojis.length || flagEmojis.includes(null)) throw "falseFlag"

			const prefix = flagEmojis.join("-"),
				confirmEmbed = new EmbedBuilder({
					color: colors.neutral,
					author: { name: getString("moduleName") },
					title: getString("caution"),
					description: `${getString("warning")}\n${getString("reactTimer", { variables: { cooldown: this.cooldown! } })}`,
					fields: [{ name: getString("previewT"), value: `\`[${prefix}] ${nickNoPrefix}\`` }],
					footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
				}),
				confirmButtons = new ActionRowBuilder<ButtonBuilder>({
					components: [
						new ButtonBuilder({
							customId: "confirm",
							style: ButtonStyle.Success,
							label: getString("pagination.confirm", { file: "global" }),
							emoji: "✅",
						}),
						new ButtonBuilder({
							customId: "cancel",
							style: ButtonStyle.Danger,
							label: getString("pagination.cancel", { file: "global" }),
							emoji: "❎",
						}),
					],
				}),
				msg = await interaction.reply({ embeds: [confirmEmbed], components: [confirmButtons], fetchReply: true }),
				collector = msg.createMessageComponentCollector<ComponentType.Button>({
					idle: this.cooldown! * 1000,
					filter: buttonInteraction => interaction.user.id === buttonInteraction.user.id,
				})

			collector.on("ignore", async buttonInteraction => {
				const userDb = await client.getUser(buttonInteraction.user.id)
				await buttonInteraction.reply({
					content: getString("pagination.notYours", {
						variables: { command: `/${this.name}` },
						file: "global",
						lang: userDb.lang ?? transformDiscordLocale(buttonInteraction.locale),
					}),
					ephemeral: true,
				})
			})

			confirmButtons.components.forEach(button => button.setDisabled())
			collector.on("collect", async buttonInteraction => {
				collector.stop("responded")
				if (buttonInteraction.customId === "confirm") {
					if (interaction.member.nickname !== `[${prefix}] ${nickNoPrefix}`) {
						await interaction.member
							.setNickname(`[${prefix}] ${nickNoPrefix}`, "Used the prefix command")
							.then(async () => {
								const embed = new EmbedBuilder({
									color: colors.success,
									author: { name: getString("moduleName") },
									title: getString("saved"),
									fields: [{ name: getString("newNickT"), value: `\`[${prefix}] ${nickNoPrefix}\`` }],
									footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
								})
								await interaction.editReply({ embeds: [embed], components: [confirmButtons] })
								const staffAlert = new EmbedBuilder({
									color: colors.loading,
									author: { name: "Prefix" },
									title: "A user manually changed their prefix",
									description: `${interaction.user} manually changed their prefix to include the following flag: ${prefix}\nMake sure they have the appropriate roles for this prefix and, if not, follow the appropriate procedure`,
									footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
								})
								await (interaction.client.channels.cache.get(ids.channels.staffBots) as TextChannel).send({ embeds: [staffAlert] })
							})
							.catch(async err => {
								const embed = new EmbedBuilder({
									color: colors.error,
									author: { name: getString("moduleName") },
									title: getString("errors.error"),
									description: err.toString(),
									fields: [{ name: getString("previewT"), value: `\`[${prefix}] ${nickNoPrefix}\`` }],
									footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
								})
								await interaction.editReply({ embeds: [embed], components: [confirmButtons] })
								console.log(err.stack ?? err)
							})
					} else {
						const embed = new EmbedBuilder({
							color: colors.success,
							author: { name: getString("moduleName") },
							title: getString("errors.alreadyThis") + getString("errors.notSaved"),
							fields: [{ name: getString("newNickT"), value: getString("noChanges") }],
							footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
						})
						await interaction.editReply({ embeds: [embed], components: [confirmButtons] })
					}
				} else if (buttonInteraction.customId === "cancel") {
					const embed = new EmbedBuilder({
						color: colors.error,
						author: { name: getString("moduleName") },
						title: getString("errors.cancelled") + getString("errors.notSaved"),
						fields: [{ name: getString("newNickT"), value: getString("noChanges") }],
						footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
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
								const embed = new EmbedBuilder({
									color: colors.success,
									author: { name: getString("moduleName") },
									title: getString("saved"),
									fields: [{ name: getString("newNickT"), value: `\`[${prefix}] ${nickNoPrefix}\`` }],
									footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
								})
								await interaction.editReply({ embeds: [embed], components: [confirmButtons] })
							})
							.catch(async err => {
								const embed = new EmbedBuilder({
									color: colors.error,
									author: { name: getString("moduleName") },
									title: getString("errors.error"),
									description: err.toString(),
									fields: [{ name: getString("previewT"), value: `\`[${prefix}] ${nickNoPrefix}\`` }],
									footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
								})
								await interaction.editReply({ embeds: [embed], components: [confirmButtons] })
								console.log(err.stack ?? err)
							})
					} else {
						const embed = new EmbedBuilder({
							color: colors.success,
							author: { name: getString("moduleName") },
							title: getString("errors.alreadyThis") + getString("errors.notSaved"),
							fields: [{ name: getString("newNickT"), value: getString("noChanges") }],
							footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
						})
						await interaction.editReply({ embeds: [embed], components: [confirmButtons] })
					}
				} else {
					const embed = new EmbedBuilder({
						color: colors.error,
						author: { name: getString("moduleName") },
						title: getString("errors.timedOut"),
						description: getString("errors.timeOutCustom") + getString("errors.notSaved"),
						fields: [{ name: getString("newNickT"), value: getString("noChanges") }],
						footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
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
				const mongoLanguage = languages.find(l => l.name === roleName.join(" "))
				if (mongoLanguage) userLangs.push(mongoLanguage)
			})
			userLangs = userLangs.reverse()
			let p = 0
			const rows: ActionRowBuilder<ButtonBuilder>[] = [],
				components: Map<string, ButtonBuilder> = new Map()
			while (p < userLangs.length) {
				rows.push(
					new ActionRowBuilder<ButtonBuilder>({
						components: userLangs.slice(p, (p += 5)).map(l => {
							const button = new ButtonBuilder({
								style: ButtonStyle.Success,
								customId: l.code,
								emoji: l.emoji,
							})
							components.set(l.code, button)
							return button
						}),
					})
				)
			}

			const confirmButton = new ButtonBuilder({
					style: ButtonStyle.Success,
					customId: "confirm",
					emoji: "✅",
					label: getString("pagination.confirm", { file: "global" }),
					disabled: true,
				}),
				cancelButton = new ButtonBuilder({
					style: ButtonStyle.Danger,
					customId: "cancel",
					emoji: "❎",
					label: getString("pagination.cancel", { file: "global" }),
				})

			components.set("confirm", confirmButton)
			components.set("cancel", cancelButton)

			rows.push(new ActionRowBuilder({ components: [confirmButton, cancelButton] }))

			if (!userLangs.length) {
				if (
					interaction.member.roles.cache.find(role => role.name.startsWith("Bot ") && role.id !== ids.roles.botUpdates) ||
					interaction.member.roles.cache.find(role => role.name.startsWith("Quickplay "))
				) {
					const embed = new EmbedBuilder({
						color: colors.error,
						author: { name: getString("moduleName") },
						title: getString("errors.trNoRoles"),
						description: getString("customPrefix"),
						footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
					})
					client.cooldowns.get(this.name)!.delete(interaction.user.id)
					return void (await interaction.editReply({ embeds: [embed] }))
				} else {
					const embed = new EmbedBuilder({
						color: colors.error,
						author: { name: getString("moduleName") },
						title: getString("errors.noLanguages"),
						footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
					})
					client.cooldowns.get(this.name)!.delete(interaction.user.id)
					return void (await interaction.editReply({ embeds: [embed] }))
				}
			}
			const noChangesEmbed = new EmbedBuilder({
					color: colors.neutral,
					author: { name: getString("moduleName") },
					title: getString("react"),
					description: getString("reactTimer", { variables: { cooldown: this.cooldown! } }),
					fields: [{ name: getString("previewT"), value: getString("noChanges") }],
					footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
				}),
				msg = await interaction.editReply({ embeds: [noChangesEmbed], components: rows }),
				collector = msg.createMessageComponentCollector<ComponentType.Button>({
					idle: this.cooldown! * 1000,
					filter: buttonInteraction => interaction.user.id === buttonInteraction.user.id,
				})

			collector.on("ignore", async buttonInteraction => {
				const userDb = await client.getUser(buttonInteraction.user.id)
				await buttonInteraction.reply({
					content: getString("pagination.notYours", {
						variables: { command: `/${this.name}` },
						file: "global",
						lang: userDb.lang ?? transformDiscordLocale(buttonInteraction.locale),
					}),
					ephemeral: true,
				})
			})

			collector.on("collect", async buttonInteraction => {
				if (buttonInteraction.customId !== "cancel") confirmButton.setDisabled(false)
				if (buttonInteraction.customId === "confirm") {
					components.forEach(buttons => buttons.setDisabled())
					collector.stop("responded")
					if (prefixes) {
						if (interaction.member.nickname !== `[${prefixes}] ${nickNoPrefix}`) {
							await interaction.member
								.setNickname(`[${prefixes}] ${nickNoPrefix}`, "Used the prefix command")
								.then(async () => {
									const embed = new EmbedBuilder({
										color: colors.success,
										author: { name: getString("moduleName") },
										title: getString("saved"),
										fields: [{ name: getString("newNickT"), value: `\`[${prefixes}] ${nickNoPrefix}\`` }],
										footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
									})
									await buttonInteraction.update({ embeds: [embed], components: rows })
								})
								.catch(async err => {
									const embed = new EmbedBuilder({
										color: colors.error,
										author: { name: getString("moduleName") },
										title: getString("errors.error"),
										description: err.toString(),
										fields: [{ name: getString("previewT"), value: `\`[${prefixes}] ${nickNoPrefix}\`` }],
										footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
									})
									await buttonInteraction.update({ embeds: [embed], components: rows })
									console.log(err.stack ?? err)
								})
						} else {
							const embed = new EmbedBuilder({
								color: colors.error,
								author: { name: getString("moduleName") },
								title: getString("errors.alreadyThis") + getString("errors.notSaved"),
								footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
							})
							await buttonInteraction.update({ embeds: [embed], components: rows })
						}
					} else {
						const embed = new EmbedBuilder({
							color: colors.error,
							author: { name: getString("moduleName") },
							title: getString("errors.confirmedNoFlags") + getString("errors.notSaved"),
							footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
						})
						await buttonInteraction.update({ embeds: [embed], components: rows })
					}
				} else if (buttonInteraction.customId === "cancel") {
					components.forEach(buttons => buttons.setDisabled())
					collector.stop("responded")
					const embed = new EmbedBuilder({
						color: colors.error,
						author: { name: getString("moduleName") },
						title: getString("errors.cancelled") + getString("errors.notSaved"),
						footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
					})
					await buttonInteraction.update({ embeds: [embed], components: rows })
				} else {
					const clickedEntry = languages.find(entry => entry.code === buttonInteraction.customId)!
					if (prefixes) prefixes = `${prefixes}-${clickedEntry.emoji}`
					else prefixes = `${clickedEntry.emoji}`
					components.get(buttonInteraction.customId)?.setDisabled().setStyle(ButtonStyle.Secondary)
					const embed = new EmbedBuilder({
						color: colors.neutral,
						author: { name: getString("moduleName") },
						title: getString("react"),
						description: getString("reactTimer2", { variables: { cooldown: this.cooldown! } }),
						fields: [{ name: getString("previewT"), value: `\`[${prefixes}] ${nickNoPrefix}\`` }],
						footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
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
								const embed = new EmbedBuilder({
									color: colors.success,
									author: { name: getString("moduleName") },
									title: getString("saved"),
									fields: [{ name: getString("newNickT"), value: `\`[${prefixes}] ${nickNoPrefix}\`` }],
									footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
								})
								await interaction.editReply({ embeds: [embed], components: rows })
							})
							.catch(async err => {
								const embed = new EmbedBuilder({
									color: colors.error,
									author: { name: getString("moduleName") },
									title: getString("errors.error"),
									description: err.toString(),
									fields: [{ name: getString("previewT"), value: `\`[${prefixes}] ${nickNoPrefix}\`` }],
									footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
								})
								await interaction.editReply({ embeds: [embed], components: rows })
								console.log(err.stack ?? err)
							})
					} else {
						const embed = new EmbedBuilder({
							color: colors.success,
							author: { name: getString("moduleName") },
							title: getString("errors.alreadyThis") + getString("errors.notSaved"),
							fields: [{ name: getString("newNickT"), value: getString("noChanges") }],
							footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
						})
						await interaction.editReply({ embeds: [embed], components: rows })
					}
				} else {
					const embed = new EmbedBuilder({
						color: colors.error,
						author: { name: getString("moduleName") },
						title: getString("errors.timedOut"),
						description: getString("errors.timeOut") + getString("errors.notSaved"),
						fields: [{ name: getString("newNickT"), value: getString("noChanges") }],
						footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
					})
					await interaction.editReply({ embeds: [embed], components: rows })
				}
			})
		}
	},
}

export default command
