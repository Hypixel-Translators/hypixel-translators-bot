import axios from "axios"
import { HexColorString, MessageEmbed } from "discord.js"
import { client } from "../../index"
import { successColor, loadingColor, errorColor, ids } from "../../config.json"
import { db } from "../../lib/dbclient"
import { crowdinFetchSettings, generateTip, LangDbEntry, LanguageStatus } from "../../lib/util"

import type { Command, GetStringFunction } from "../../lib/imports"

const command: Command = {
	name: "languagestats",
	description: "Shows you the progress of a language on the all projects we currently support.",
	options: [{
		type: "STRING",
		name: "language",
		description: "The language to get progress statistics for. Required if your language is set to English.",
		required: false
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
		const langdb = await db.collection<LangDbEntry>("langdb").find().toArray()
		let lang = langdb.find(l => l.code === rawLang || l.id.toLowerCase() === rawLang || l.name.toLowerCase() === rawLang)!
		lang ??= langdb.find(l => l.name.toLowerCase().includes(rawLang!))!
		if (!lang || lang?.code === "en") throw "falseLang"

		let hypixelData: LanguageStatus["data"] | null,
			quickplayData: LanguageStatus["data"] | null,
			sbaData: LanguageStatus["data"] | null,
			botData: LanguageStatus["data"] | null
		const hypixelJson: LanguageStatus[] = await axios.get("https://api.crowdin.com/api/v2/projects/128098/languages/progress?limit=500", crowdinFetchSettings).then(async res => res.data.data)
			.catch(e => {
				if (e.code === "ECONNABORTED") { //this means the request timed out
					console.error("Crowdin API is down, sending error.")
					throw "apiError"
				} else throw e
			})

		hypixelData = hypixelJson.find(language => language.data.languageId === lang.id)?.data ?? null

		const quickplayJson: LanguageStatus[] = await axios.get("https://api.crowdin.com/api/v2/projects/369653/languages/progress?limit=500", crowdinFetchSettings).then(async res => res.data.data)
		quickplayData = quickplayJson.find(language => language.data.languageId === lang.id)?.data ?? null

		const sbaJson: LanguageStatus[] = await axios.get("https://api.crowdin.com/api/v2/projects/369493/languages/progress?limit=500", crowdinFetchSettings).then(async res => res.data.data)
		sbaData = sbaJson.find(language => language.data.languageId === lang.id)?.data ?? null

		const botJson: LanguageStatus[] = await axios.get("https://api.crowdin.com/api/v2/projects/436418/languages/progress?limit=500", crowdinFetchSettings).then(async res => res.data.data)
		botData = botJson.find(language => language.data.languageId === lang.id)?.data ?? null

		let adapColour: HexColorString
		const approvalProgress = Math.max(hypixelData?.approvalProgress ?? 0, quickplayData?.approvalProgress ?? 0, sbaData?.approvalProgress ?? 0, botData?.approvalProgress ?? 0)
		if (approvalProgress >= 90) adapColour = successColor as HexColorString
		else if (approvalProgress >= 50) adapColour = loadingColor as HexColorString
		else adapColour = errorColor as HexColorString

		const embed = new MessageEmbed()
			.setColor(adapColour)
			.setThumbnail(lang.flag)
			.setAuthor(getString("moduleName"))
			.setTitle(`${lang.emoji} | ${getString(`languages.${lang.code}`)}`)
			.setDescription(`${getString("statsAll", { language: getString(`languages.${lang.code}`) })}`)
			.setFooter(randomTip, interaction.member.displayAvatarURL({ format: "png", dynamic: true }))
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
