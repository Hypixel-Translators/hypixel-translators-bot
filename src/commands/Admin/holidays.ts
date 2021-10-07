import { ids } from "../../config.json"
import fs from "node:fs"
import path from "node:path"
import Discord from "discord.js"
import type { Command } from "../../index"

const command: Command = {
	name: "holidays",
	description: "Sends an announcement wishing everyone a happy (holiday) in each language.",
	options: [{
		type: "STRING",
		name: "holiday",
		description: "The holiday to announce",
		choices: [
			{ name: "Easter", value: "easter" },
			{ name: "Halloween", value: "halloween" },
			{ name: "Christmas", value: "christmas" },
			{ name: "New Year", value: "newYear" }
		],
		required: true
	}],
	roleWhitelist: [ids.roles.admin],
	channelWhitelist: [ids.channels.botDev, ids.channels.adminBots],
	async execute(interaction) {
		let strings: HolidayStrings = require(`../../../strings/en/holidays.json`)
		const dirPath = path.join(__dirname, "../../../strings"),
			holidayName = interaction.options.getString("holiday", true) as "easter" | "halloween" | "christmas" | "newYear",
			holiday: string[] = [],
			log: { [Language: string]: string } = {}
		holiday.push(strings[holidayName])
		fs.readdir(dirPath, async (err, langs) => {
			if (err) return console.error(`Unable to scan directory.\n${err.stack || err}`)
			langs.forEach(lang => {
				if (lang === "empty") return
				try {
					strings = require(`../../../strings/${lang}/holidays.json`)
				} catch {}
				if (!strings) return
				if (!holiday.includes(strings[holidayName])) {
					holiday.push(strings[holidayName])
					log[lang] = strings[holidayName]
				}
			})
			let logMsg = ""
			for (const lang in log) {
				if (!log.hasOwnProperty.call(log, lang)) {
					continue
				}

				logMsg = logMsg.concat(`${lang}: ${log[lang]}\n`)
			}
			const announcement = holiday.join(" ")
			if (announcement) {
				const announcements = interaction.client.channels.cache.get(ids.channels.announcements) as Discord.NewsChannel
				await announcements.send(`${announcement}\n\n - From the Hypixel Translators Team. ❤`)
					.then(msg => msg.crosspost())
				await interaction.reply(`${holidayName.charAt(0).toUpperCase() + holidayName.slice(1)} announcement sent! Here's each language's translation:\n${logMsg}`)
				console.table(log)
				console.log(`Sent the ${holidayName.charAt(0).toUpperCase() + holidayName.slice(1)} announcement`)
			} else return await interaction.reply({ content: "For some reason there is nothing in the announcement so I can't send it. Fix your code bro.", ephemeral: true })
		})
	}
}

export default command

interface HolidayStrings {
	easter: string
	halloween: string
	christmas: string
	newYear: string
}
