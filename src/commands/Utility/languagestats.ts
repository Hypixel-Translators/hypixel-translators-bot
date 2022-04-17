import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js"

import { colors, ids } from "../../config.json"
import { client, crowdin } from "../../index"
import { db } from "../../lib/dbclient"
import { transformDiscordLocale, generateTip, type MongoLanguage, formatNumberToLocaleString } from "../../lib/util"

import type { Command, GetStringFunction } from "../../lib/imports"

const command: Command = {
	name: "languagestats",
	description: "Shows you the progress of a language on the all projects we currently support",
	options: [
		{
			type: ApplicationCommandOptionType.String,
			name: "language",
			description: "The language to get progress statistics for. Required if your language is set to English",
			required: false,
			autocomplete: true,
		},
	],
	cooldown: 30,
	channelWhitelist: [ids.channels.bots, ids.channels.staffBots, ids.channels.botDev, ids.channels.adminBots],
	async execute(interaction, getString: GetStringFunction) {
		if (!interaction.inCachedGuild()) return
		await interaction.deferReply()
		const authorDb = await client.getUser(interaction.user.id),
			discordLocale = transformDiscordLocale(interaction.locale)

		let rawLang = interaction.options.getString("language", false)?.toLowerCase()
		if (!["en", "empty"].includes(authorDb.lang ?? discordLocale)) rawLang ??= authorDb.lang ?? discordLocale
		if (!rawLang) throw "noLang"
		const languages = await db.collection<MongoLanguage>("languages").find().toArray(),
			lang =
				languages.find(l => l.code === rawLang || l.id.toLowerCase() === rawLang || l.name.toLowerCase() === rawLang)! ??
				languages.find(l => l.name.toLowerCase().includes(rawLang!))!
		if (!lang || lang.code === "en") throw "falseLang"

		const hypixelData = await crowdin.translationStatusApi
				.withFetchAll()
				.getProjectProgress(ids.projects.hypixel)
				.then(res => res.data.find(language => language.data.languageId === lang.id)?.data ?? null)
				.catch(e => {
					if (e.code === "ECONNABORTED") {
						// This means the request timed out
						console.error("Crowdin API is down, sending error.")
						throw "apiError"
					} else throw e
				}),
			quickplayData = await crowdin.translationStatusApi
				.withFetchAll()
				.getProjectProgress(ids.projects.quickplay)
				.then(res => res.data.find(language => language.data.languageId === lang.id)?.data ?? null),
			sbaData = await crowdin.translationStatusApi
				.withFetchAll()
				.getProjectProgress(ids.projects.sba)
				.then(res => res.data.find(language => language.data.languageId === lang.id)?.data ?? null),
			botData = await crowdin.translationStatusApi
				.withFetchAll()
				.getProjectProgress(ids.projects.bot)
				.then(res => res.data.find(language => language.data.languageId === lang.id)?.data ?? null)

		let color: number
		const approvalProgress = Math.max(
			hypixelData?.approvalProgress ?? 0,
			quickplayData?.approvalProgress ?? 0,
			sbaData?.approvalProgress ?? 0,
			botData?.approvalProgress ?? 0,
		)
		if (approvalProgress >= 90) color = colors.success
		else if (approvalProgress >= 50) color = colors.loading
		else color = colors.error

		const embed = new EmbedBuilder({
			color,
			thumbnail: { url: lang.flag },
			author: { name: getString("moduleName") },
			title: `${lang.emoji} | ${getString(`languages.${lang.code}`)}`,
			description: `${getString("statsAll", { variables: { language: getString(`languages.${lang.code}`) } })}`,
			footer: { text: generateTip(getString), iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
		})
		if (hypixelData) {
			embed.addFields({
				name: "Hypixel",
				value: `${getString("translated", {
					variables: {
						percentage: formatNumberToLocaleString(hypixelData.translationProgress, getString),
						translated: formatNumberToLocaleString(hypixelData.phrases.translated, getString),
						total: formatNumberToLocaleString(hypixelData.phrases.total, getString),
					},
				})}\n${getString("approved", {
					variables: {
						percentage: formatNumberToLocaleString(hypixelData.approvalProgress, getString),
						approved: formatNumberToLocaleString(hypixelData.phrases.approved, getString),
						total: formatNumberToLocaleString(hypixelData.phrases.total, getString),
					},
				})}`,
			})
		}
		if (quickplayData) {
			embed.addFields({
				name: "Quickplay",
				value: `${getString("translated", {
					variables: {
						percentage: formatNumberToLocaleString(quickplayData.translationProgress, getString),
						translated: formatNumberToLocaleString(quickplayData.phrases.translated, getString),
						total: formatNumberToLocaleString(quickplayData.phrases.total, getString),
					},
				})}\n${getString("approved", {
					variables: {
						percentage: formatNumberToLocaleString(quickplayData.approvalProgress, getString),
						approved: formatNumberToLocaleString(quickplayData.phrases.approved, getString),
						total: formatNumberToLocaleString(quickplayData.phrases.total, getString),
					},
				})}`,
			})
		}
		if (sbaData) {
			embed.addFields({
				name: "SkyblockAddons",
				value: `${getString("translated", {
					variables: {
						percentage: formatNumberToLocaleString(sbaData.translationProgress, getString),
						translated: formatNumberToLocaleString(sbaData.phrases.translated, getString),
						total: formatNumberToLocaleString(sbaData.phrases.total, getString),
					},
				})}\n${getString("approved", {
					variables: {
						percentage: formatNumberToLocaleString(sbaData.approvalProgress, getString),
						approved: formatNumberToLocaleString(sbaData.phrases.approved, getString),
						total: formatNumberToLocaleString(sbaData.phrases.total, getString),
					},
				})}`,
			})
		}
		if (botData) {
			embed.addFields({
				name: "Hypixel Translators Bot",
				value: `${getString("translated", {
					variables: {
						percentage: formatNumberToLocaleString(botData.translationProgress, getString),
						translated: formatNumberToLocaleString(botData.phrases.translated, getString),
						total: formatNumberToLocaleString(botData.phrases.total, getString),
					},
				})}\n${getString("approved", {
					variables: {
						percentage: formatNumberToLocaleString(botData.approvalProgress, getString),
						approved: formatNumberToLocaleString(botData.phrases.approved, getString),
						total: formatNumberToLocaleString(botData.phrases.total, getString),
					},
				})}`,
			})
		}
		await interaction.editReply({ embeds: [embed] })
	},
}

export default command
