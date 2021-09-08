import { loadingColor, errorColor, successColor } from "../config.json"
import Discord from "discord.js"
import axios from "axios"
import type { HTBClient } from "../lib/dbclient"
import { db } from "../lib/dbclient"
import { crowdinFetchSettings, CrowdinProject, LangDbEntry, LanguageStatus } from "../lib/util"

export async function execute(client: HTBClient, manual: boolean): Promise<void> {
	const m = new Date().getUTCMinutes()
	if (m == 0 || m == 20 || m == 40) {
		await updateProjectStatus(client, "128098") //Hypixel
		await updateProjectStatus(client, "369493") //SkyblockAddons
	}
	if (m == 10 || m == 30 || m == 50) {
		await updateProjectStatus(client, "369653") //Quickplay
		await updateProjectStatus(client, "436418") //Bot
	}
	if (manual) {
		await updateProjectStatus(client, "128098") //Hypixel
		await updateProjectStatus(client, "369493") //SkyblockAddons
		await updateProjectStatus(client, "369653") //Quickplay
		await updateProjectStatus(client, "436418") //Bot
		console.log("All stats have been manually updated.")
	}
}

export async function updateProjectStatus(client: Discord.Client, projectId: string) {
	const langdb = await db.collection<LangDbEntry>("langdb").find().toArray(),
		crowdinDb = db.collection<CrowdinProject>("crowdin"),
		projectDb = await crowdinDb.findOne({ id: projectId }) as CrowdinProject,
		json = await axios.get(`https://api.crowdin.com/api/v2/projects/${projectId}/languages/progress?limit=500`, crowdinFetchSettings)
			.catch(err => console.error(`Crowdin API is down, couldn't update ${projectDb.name} language statistics. Here's the error:`, err))
	if (!json?.data) return
	if (!json.data?.data) return console.error(`We got no data from the API when trying to update Hypixel! Here's the response:\n`, json)
	const langStatus: LanguageStatus[] = json.data.data.map((status: LanguageStatus) => {
		status.language = langdb.find(l => l.code === status.data.languageId || l.id === status.data.languageId)!
		return status
	}).sort((a: LanguageStatus, b: LanguageStatus) => b.data.phrases.total - a.data.phrases.total),
		sortedSatus = Array.from(langStatus).sort((currentStatus: LanguageStatus, nextStatus: LanguageStatus) =>
			nextStatus.language.name.localeCompare(currentStatus.language.name)
		)
	const channel = client.channels.cache.find(channel => (channel as Discord.TextChannel).name === `${projectDb.shortName}-language-status`) as Discord.TextChannel,
		messages = await channel.messages.fetch(),
		fiMessages = messages.filter(msg => msg.author.id === client.user!.id)
	let index = 0
	fiMessages.forEach(async msg => {
		const fullData = sortedSatus[index],
			crowdinData = fullData.data

		let adapColour: Discord.HexColorString
		if (projectDb.identifier === "hypixel") adapColour = fullData.language.color!
		else if (crowdinData.approvalProgress > 89) adapColour = successColor as Discord.HexColorString
		else if (crowdinData.approvalProgress > 49) adapColour = loadingColor as Discord.HexColorString
		else adapColour = errorColor as Discord.HexColorString

		const embed = new Discord.MessageEmbed()
			.setColor(adapColour)
			.setTitle(`${fullData.language.emoji || "<:icon_question:756582065834688662>"} | ${fullData.language.name}`)
			.setThumbnail(fullData.language.flag)
			.setDescription(`${crowdinData.translationProgress}% translated (${crowdinData.phrases.translated}/${crowdinData.phrases.total} strings)\n**${crowdinData.approvalProgress}% approved (${crowdinData.phrases.approved}/${crowdinData.phrases.total} strings)**`)
			.addField("Translate at", `https://crowdin.com/project/${projectDb.identifier}/${fullData.language.id}`)
			.setFooter("Last update")
			.setTimestamp()
		index++
		await msg.edit({ content: null, embeds: [embed] })
	})
	const stringCount = projectDb.stringCount
	if (stringCount != langStatus[0].data.phrases.total) {
		const translatorsChannel = client.channels.cache.find(c => (c as Discord.TextChannel).name == `${projectDb.shortName}-translators`) as Discord.TextChannel,
			stringDiff = Math.abs(langStatus[0].data.phrases.total - stringCount)
		if (stringCount < langStatus[0].data.phrases.total)
			await translatorsChannel.send(`> <a:partyBlob:769679132317057064> **New ${stringDiff == 1 ? "String" : "Strings"}!**\n${stringDiff} ${stringDiff == 1 ? "string has" : "strings have"} been added to the ${projectDb.name} project.\n\nTranslate at <https://crowdin.com/translate/${projectDb.identifier}/all/en>`)
		else if (stringCount > langStatus[0].data.phrases.total)
			await translatorsChannel.send(`> <:vote_no:839262184882044931> **${stringDiff == 1 ? "String" : "Strings"} Removed**\n${stringDiff} ${stringDiff == 1 ? "string has" : "strings have"} been removed from the ${projectDb.name} project.`)
		await crowdinDb.updateOne({ id: projectDb.id }, { $set: { stringCount: langStatus[0].data.phrases.total } })
	}
}

export default execute

