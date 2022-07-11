import { EmbedBuilder, type NewsChannel, type TextChannel } from "discord.js"

import { colors, ids } from "../config.json"
import { client, crowdin } from "../index"
import { db } from "../lib/dbclient"
import { closeConnection, type CrowdinProject, getBrowser, type MongoLanguage, type LanguageStatus, type Stats } from "../lib/util"

export async function stats(manual = false) {
	const m = new Date().getUTCMinutes()
	if (manual) {
		for (const id of Object.values(ids.projects)) await updateProjectStatus(id)
		console.log("All stats have been manually updated.")
	} else if ([0, 20, 40].includes(m)) {
		await updateProjectStatus(ids.projects.hypixel)
		await updateProjectStatus(ids.projects.sba)
	} else if (m === 10 || m === 30 || m === 50) {
		await updateProjectStatus(ids.projects.quickplay)
		await updateProjectStatus(ids.projects.bot)
	}
}

export async function updateProjectStatus(projectId: number) {
	const projects = db.collection<CrowdinProject>("crowdin"),
		mongoProject = (await projects.findOne({ id: projectId }))!,
		channel = client.channels.cache.find(c => (c as TextChannel).name === `${mongoProject.shortName}-language-status`) as TextChannel,
		updatesChannel = client.channels.cache.find(
			c => (c as NewsChannel).name === `${mongoProject.shortName}-project-updates`,
		) as NewsChannel,
		statMessages = await channel.messages.fetch(),
		// Only ping if last ping was more than 90 minutes ago
		shouldPing =
			((await updatesChannel.messages.fetch()).find(m => m.mentions.roles.has(ids.roles.crowdinUpdates))?.createdTimestamp ?? 0) <
			Date.now() - 120 * 60 * 1000
	if (projectId === ids.projects.hypixel) checkBuild(shouldPing)
	const languages = await db.collection<MongoLanguage>("languages").find().toArray(),
		json = await crowdin.translationStatusApi
			.withFetchAll()
			.getProjectProgress(projectId)
			.catch(err => console.error(`Crowdin API is down, couldn't update ${mongoProject.name} language statistics. Here's the error:`, err))
	if (!json?.data) return console.error("We got no data from the API when trying to update language stats! Here's the response:\n", json)
	const langStatus: LanguageStatus[] = json.data
			.map(status => {
				Object.defineProperty(status, "language", {
					value: languages.find(l => l.code === status.data.languageId || l.id === status.data.languageId)!,
				})
				return status as LanguageStatus
			})
			.sort((a, b) => b.data.phrases.total - a.data.phrases.total),
		sortedSatus = Array.from(langStatus).sort((currentStatus, nextStatus) =>
			nextStatus.language.name.localeCompare(currentStatus.language.name),
		)
	let index = 0
	statMessages
		.filter(msg => msg.author.id === client.user!.id)
		.forEach(async msg => {
			const fullData = sortedSatus[index],
				crowdinData = fullData.data

			let color: number
			if (mongoProject.identifier === "hypixel") color = fullData.language.color!
			else if (crowdinData.approvalProgress > 89) color = colors.success
			else if (crowdinData.approvalProgress > 49) color = colors.loading
			else color = colors.error

			const embed = new EmbedBuilder({
				color,
				title: `${fullData.language.emoji ?? "<:icon_question:882267041904607232>"} | ${fullData.language.name}`,
				thumbnail: { url: fullData.language.flag },
				description: `${crowdinData.translationProgress}% translated (${crowdinData.phrases.translated}/${crowdinData.phrases.total} strings)\n**${crowdinData.approvalProgress}% approved (${crowdinData.phrases.approved}/${crowdinData.phrases.total} strings)**`,
				fields: [{ name: "Translate at", value: `https://crowdin.com/project/${mongoProject.identifier}/${fullData.language.id}` }],
				footer: { text: "Last update" },
				timestamp: Date.now(),
			})
			index++
			await msg.edit({ content: null, embeds: [embed] })
		})
	const oldStringCount = mongoProject.stringCount,
		newStringCount = langStatus[0].data.phrases.total

	if (oldStringCount !== newStringCount) {
		const stringDiff = Math.abs(newStringCount - oldStringCount)
		if (oldStringCount < newStringCount) {
			const embed = new EmbedBuilder({
				color: colors.success,
				author: { name: "New strings!" },
				title: `${stringDiff} ${stringDiff === 1 ? "string has" : "strings have"} been added to the ${mongoProject.name} project.`,
				description: `Translate at <https://crowdin.com/translate/${mongoProject.identifier}/all/en>`,
				footer: { text: `There are now ${newStringCount} strings on the project.` },
			})
			await updatesChannel.send({ embeds: [embed], content: `${shouldPing ? `<@&${ids.roles.crowdinUpdates}> ` : ""}New strings!` })
		} else if (oldStringCount > newStringCount) {
			const embed = new EmbedBuilder({
				color: colors.error,
				author: { name: "Removed strings!" },
				title: `${stringDiff} ${stringDiff === 1 ? "string has" : "strings have"} been removed from the ${mongoProject.name} project.`,
				footer: { text: `There are now ${newStringCount} strings on the project.` },
			})
			await updatesChannel.send({ embeds: [embed] })
		}
		await projects.updateOne({ id: mongoProject.id }, { $set: { stringCount: newStringCount } })
		await db.collection<Stats>("stats").insertOne({ type: "STRINGS", name: mongoProject.identifier, value: stringDiff })
	}
}

export async function checkBuild(shouldPing: boolean) {
	const browser = await getBrowser(),
		page = await browser.pupBrowser.newPage(),
		collection = db.collection<CrowdinProject>("crowdin")
	await page.goto("https://crowdin.com/project/hypixel/activity-stream")
	await page.waitForSelector(".list-activity")
	const lastBuild: CrowdinBuildActivity = await page.evaluate(async () => {
		window.eval('crowdin.activity.filters.filter_by_type = "1"') // Filter by builds only to assure we get a build
		await window.eval("crowdin.activity.refresh()") // Refresh the activity stream to apply the new filter
		await new Promise<void>(resolve => {
			// eslint-disable-next-line no-restricted-globals
			setInterval(() => {
				if (window.eval('document.querySelector(".build_project")')) resolve()
			}, 100)
		})
		return window.eval('crowdin.activity.data.filter(a => a.type === "build_project")[0]') as CrowdinBuildActivity
	})
	await page.close()
	await closeConnection(browser.uuid)

	if (lastBuild.timestamp > (await collection.findOne({ identifier: "hypixel" }))!.lastBuild!) {
		const author = lastBuild.message.match(/>(.*)( \([^(]*\))?</)?.[1],
			embed = new EmbedBuilder({
				color: colors.success,
				thumbnail: { url: lastBuild.avatar },
				author: { name: "New build!" },
				title: `${author} just built the project!`,
				description: "You can expect to see updated translations on the network soon!",
				timestamp: lastBuild.timestamp * 1_000,
				footer: { text: "Built at" },
			})
		await (client.channels.cache.get(ids.channels.hypixelUpdates) as NewsChannel).send({
			embeds: [embed],
			content: `${shouldPing ? `<@&${ids.roles.crowdinUpdates}> ` : ""}New build!`,
		})
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
