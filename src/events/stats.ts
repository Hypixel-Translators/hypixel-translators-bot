import axios from "axios"
import { MessageEmbed, NewsChannel, TextChannel } from "discord.js"
import { client } from "../index"
import { colors, ids } from "../config.json"
import { db } from "../lib/dbclient"
import { closeConnection, crowdinFetchSettings, CrowdinProject, getBrowser, LangDbEntry, LanguageStatus, Stats } from "../lib/util"

export async function stats(manual = false) {
	const m = new Date().getUTCMinutes()
	if (manual) {
		await updateProjectStatus("128098") //Hypixel
		await updateProjectStatus("369493") //SkyblockAddons
		await updateProjectStatus("369653") //Quickplay
		await updateProjectStatus("436418") //Bot
		console.log("All stats have been manually updated.")
	} else if (m == 0 || m == 20 || m == 40) {
		await updateProjectStatus("128098") //Hypixel
		await updateProjectStatus("369493") //SkyblockAddons
	} else if (m == 10 || m == 30 || m == 50) {
		await updateProjectStatus("369653") //Quickplay
		await updateProjectStatus("436418") //Bot
	}
}

export async function updateProjectStatus(projectId: string) {
	if (projectId === "128098") checkBuild()
	const langdb = await db.collection<LangDbEntry>("langdb").find().toArray(),
		crowdinDb = db.collection<CrowdinProject>("crowdin"),
		projectDb = (await crowdinDb.findOne({ id: projectId }))!,
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
	const channel = client.channels.cache.find(channel => (channel as TextChannel).name === `${projectDb.shortName}-language-status`) as TextChannel,
		messages = await channel.messages.fetch(),
		fiMessages = messages.filter(msg => msg.author.id === client.user!.id)
	let index = 0
	fiMessages.forEach(async msg => {
		const fullData = sortedSatus[index],
			crowdinData = fullData.data

		let adapColour: number
		if (projectDb.identifier === "hypixel") adapColour = fullData.language.color!
		else if (crowdinData.approvalProgress > 89) adapColour = colors.success
		else if (crowdinData.approvalProgress > 49) adapColour = colors.loading
		else adapColour = colors.error

		const embed = new MessageEmbed()
			.setColor(adapColour)
			.setTitle(`${fullData.language.emoji ?? "<:icon_question:882267041904607232>"} | ${fullData.language.name}`)
			.setThumbnail(fullData.language.flag)
			.setDescription(`${crowdinData.translationProgress}% translated (${crowdinData.phrases.translated}/${crowdinData.phrases.total} strings)\n**${crowdinData.approvalProgress}% approved (${crowdinData.phrases.approved}/${crowdinData.phrases.total} strings)**`)
			.addField("Translate at", `https://crowdin.com/project/${projectDb.identifier}/${fullData.language.id}`)
			.setFooter("Last update")
			.setTimestamp()
		index++
		await msg.edit({ content: null, embeds: [embed] })
	})
	const oldStringCount = projectDb.stringCount,
		newStringCount = langStatus[0].data.phrases.total

	if (oldStringCount != newStringCount) {
		const updatesChannel = client.channels.cache.find(c => (c as NewsChannel).name == `${projectDb.shortName}-project-updates`) as NewsChannel,
			stringDiff = Math.abs(newStringCount - oldStringCount)
		if (oldStringCount < newStringCount) {
			const embed = new MessageEmbed()
				.setColor(colors.success)
				.setAuthor("New strings!")
				.setTitle(`${stringDiff} ${stringDiff == 1 ? "string has" : "strings have"} been added to the ${projectDb.name} project.`)
				.setDescription(`Translate at <https://crowdin.com/translate/${projectDb.identifier}/all/en>`)
				.setFooter(`There are now ${newStringCount} strings on the project.`)
			await updatesChannel.send({ embeds: [embed], content: `<@&${ids.roles.crowdinUpdates}> New strings!` })
		} else if (oldStringCount > newStringCount) {
			const embed = new MessageEmbed()
				.setColor(colors.error)
				.setAuthor("Removed strings!")
				.setTitle(`${stringDiff} ${stringDiff == 1 ? "string has" : "strings have"} been removed from the ${projectDb.name} project.`)
				.setFooter(`There are now ${newStringCount} strings on the project.`)
			await updatesChannel.send({ embeds: [embed] })
		}
		await crowdinDb.updateOne({ id: projectDb.id }, { $set: { stringCount: newStringCount } })
		await db.collection<Stats>("stats").insertOne({ type: "STRINGS", name: projectDb.identifier, value: stringDiff })
	}
}

export async function checkBuild() {
	const browser = await getBrowser(),
		page = await browser.pupBrowser.newPage(),
		collection = db.collection<CrowdinProject>("crowdin")
	await page.goto("https://crowdin.com/project/hypixel/activity-stream")
	await page.waitForSelector(".list-activity")
	const lastBuild: CrowdinBuildActivity = await page.evaluate(async () => {
		window.eval('crowdin.activity.filters.filter_by_type = "1"') //filter by builds only to assure we get a build
		await window.eval("crowdin.activity.refresh()") //refresh the activity stream to apply the new filter
		await new Promise<void>(resolve => {
			setInterval(() => {
				const selector = window.eval('document.querySelector(".build_project")')
				if (selector) resolve()
			}, 100)
		})
		const activity = window.eval('crowdin.activity.data.filter(a => a.type === "build_project")[0]') as CrowdinBuildActivity
		return activity
	})
	await page.close()
	await closeConnection(browser.uuid)

	const lastDbBuild = (await collection.findOne({ identifier: "hypixel" }))!.lastBuild!
	if (lastBuild.timestamp > lastDbBuild) {
		const author = lastBuild.message.match(/>(.*)( \([^(]*\))?</)?.[1],
			embed = new MessageEmbed()
				.setColor(colors.success)
				.setThumbnail(lastBuild.avatar)
				.setAuthor("New build!")
				.setTitle(`${author} just built the project!`)
				.setDescription("You can expect to see updated translations on the network soon!")
				.setTimestamp(lastBuild.timestamp * 1_000)
				.setFooter("Built at")
		await (client.channels.cache.get(ids.channels.hypixelUpdates) as NewsChannel).send({ embeds: [embed], content: `<@&${ids.roles.crowdinUpdates}> New build!` })
		await collection.updateOne({ identifier: "hypixel" }, { $set: { lastBuild: lastBuild.timestamp } })
	}
}

interface CrowdinBuildActivity {
	after_build: number
	avatar: string
	before_build: number
	count: string
	date: string
	datetime: string
	icon_class: string
	id: string
	message: string
	project_id: string
	revision: string
	time: string
	timestamp: number
	type: string
	undo_able: boolean
	user_id: string
}

export default stats

