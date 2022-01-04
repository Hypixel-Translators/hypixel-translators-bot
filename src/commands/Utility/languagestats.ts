import { MessageEmbed } from "discord.js"
import { client, crowdin } from "../../index"
import { colors, ids } from "../../config.json"
import { db } from "../../lib/dbclient"
import { generateTip, MongoLanguage } from "../../lib/util"

import type { Command, GetStringFunction } from "../../lib/imports"

const command: Command = {
	name: "languagestats",
	description: "Shows you the progress of a language on the all projects we currently support.",
	options: [{
		type: "STRING",
		name: "language",
		description: "The language to get progress statistics for. Required if your language is set to English.",
		required: false,
		autocomplete: true
	}],
	cooldown: 30,
	channelWhitelist: [ids.channels.bots, ids.channels.staffBots, ids.channels.botDev, ids.channels.adminBots],
	async execute(interaction, getString: GetStringFunction) {
		if (!interaction.inCachedGuild()) return
		await interaction.deferReply()
		const randomTip = generateTip(getString),
			authorDb = await client.getUser(interaction.user.id)

		let rawLang = interaction.options.getString("language", false)?.toLowerCase()
		if (authorDb.lang !== "en" && authorDb.lang !== "empty" && !rawLang) rawLang = authorDb.lang
		if (!rawLang) throw "noLang"
		const languages = await db.collection<MongoLanguage>("languages").find().toArray()
		let lang =
			languages.find(l => l.code === rawLang || l.id.toLowerCase() === rawLang || l.name.toLowerCase() === rawLang)! ??
			languages.find(l => l.name.toLowerCase().includes(rawLang!))!
		if (!lang || lang.code === "en") throw "falseLang"

		const hypixelData = await (crowdin.translationStatusApi.getProjectProgress(128098, 500)).then(res => res.data.find(language => language.data.languageId === lang.id)?.data ?? null)
			.catch(e => {
				if (e.code === "ECONNABORTED") { //this means the request timed out
					console.error("Crowdin API is down, sending error.")
					throw "apiError"
				} else throw e
			})

		const quickplayData = await (crowdin.translationStatusApi.getProjectProgress(369653, 500)).then(res => res.data.find(language => language.data.languageId === lang.id)?.data ?? null)

		const sbaData = await (crowdin.translationStatusApi.getProjectProgress(369493, 500)).then(res => res.data.find(language => language.data.languageId === lang.id)?.data ?? null)

		const botData = await (crowdin.translationStatusApi.getProjectProgress(436418, 500)).then(res => res.data.find(language => language.data.languageId === lang.id)?.data ?? null)

		let color: number
		const approvalProgress = Math.max(hypixelData?.approvalProgress ?? 0, quickplayData?.approvalProgress ?? 0, sbaData?.approvalProgress ?? 0, botData?.approvalProgress ?? 0)
		if (approvalProgress >= 90) color = colors.success
		else if (approvalProgress >= 50) color = colors.loading
		else color = colors.error

		const embed = new MessageEmbed({
			color,
			thumbnail: { url: lang.flag },
			author: { name: getString("moduleName") },
			title: `${lang.emoji} | ${getString(`languages.${lang.code}`)}`,
			description: `${getString("statsAll", { language: getString(`languages.${lang.code}`) })}`,
			footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ format: "png", dynamic: true }) }
		})
		if (hypixelData)
			embed.addField(
				"Hypixel",
				`${getString("translated", {
					percentage: hypixelData.translationProgress,
					translated: hypixelData.phrases.translated,
					total: hypixelData.phrases.total
				})}\n${getString("approved", {
					percentage: hypixelData.approvalProgress,
					approved: hypixelData.phrases.approved,
					total: hypixelData.phrases.total
				})}`
			)
		if (quickplayData)
			embed.addField(
				"Quickplay",
				`${getString("translated", {
					percentage: quickplayData.translationProgress,
					translated: quickplayData.phrases.translated,
					total: quickplayData.phrases.total
				})}\n${getString("approved", {
					percentage: quickplayData.approvalProgress,
					approved: quickplayData.phrases.approved,
					total: quickplayData.phrases.total
				})}`
			)
		if (sbaData)
			embed.addField(
				"SkyblockAddons",
				`${getString("translated", {
					percentage: sbaData.translationProgress,
					translated: sbaData.phrases.translated,
					total: sbaData.phrases.total
				})}\n${getString("approved", {
					percentage: sbaData.approvalProgress,
					approved: sbaData.phrases.approved,
					total: sbaData.phrases.total
				})}`
			)
		if (botData)
			embed.addField(
				"Hypixel Translators Bot",
				`${getString("translated", {
					percentage: botData.translationProgress,
					translated: botData.phrases.translated,
					total: botData.phrases.total
				})}\n${getString("approved", { percentage: botData.approvalProgress, approved: botData.phrases.approved, total: botData.phrases.total })}`
			)
		await interaction.editReply({ embeds: [embed] })
	}
}

export default command
