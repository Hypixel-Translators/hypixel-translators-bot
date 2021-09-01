import { db } from "../../lib/dbclient"
import Discord from "discord.js"
import axios from "axios"
import { successColor, loadingColor, errorColor } from "../../config.json"
import { Command, client, GetStringFunction } from "../../index"
import { crowdinFetchSettings, LangDbEntry, LanguageStatus } from "../../lib/util"
const ctokenV2 = process.env.CTOKEN_V2!

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
	channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058", "551693960913879071"], // bots staff-bots bot-development admin-bots
	async execute(interaction, getString: GetStringFunction) {
		const executedBy = getString("executedBy", { user: interaction.user.tag }, "global"),
			authorDb = await client.getUser(interaction.user.id)
		let rawLang = interaction.options.getString("language", false)?.toLowerCase()
		if (authorDb.lang !== "en" && authorDb.lang !== "empty" && !rawLang) rawLang = authorDb.lang
		if (!rawLang) throw "noLang"
		const langdb = await db.collection<LangDbEntry>("langdb").find().toArray()
		let lang = langdb.find(l => l.code === rawLang || l.id.toLowerCase() === rawLang || l.name.toLowerCase() === rawLang)!
		lang ??= langdb.find(l => l.name.toLowerCase().includes(rawLang!))!
		if (!lang || lang?.code === "en") throw "falseLang"

		await interaction.deferReply()
		let hypixelData: LanguageStatus["data"] | null = null,
			quickplayData: LanguageStatus["data"] | null = null,
			sbaData: LanguageStatus["data"] | null = null,
			botData: LanguageStatus["data"] | null = null
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

		let adapColour: Discord.HexColorString
		const approvalProgress = Math.max(hypixelData?.approvalProgress ?? 0, quickplayData?.approvalProgress ?? 0, sbaData?.approvalProgress ?? 0, botData?.approvalProgress ?? 0)
		if (approvalProgress >= 90) adapColour = successColor as Discord.HexColorString
		else if (approvalProgress >= 50) adapColour = loadingColor as Discord.HexColorString
		else adapColour = errorColor as Discord.HexColorString


		const embed = new Discord.MessageEmbed()
			.setColor(adapColour)
			.setThumbnail(lang.flag)
			.setAuthor(getString("moduleName"))
			.setTitle(`${lang.emoji} | ${getString(`languages.${lang.code}`)}`)
			.setDescription(`${getString("statsAll", { language: getString(`languages.${lang.code}`) })}`)
			.setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
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
