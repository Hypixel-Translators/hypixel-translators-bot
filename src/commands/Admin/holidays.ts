import fs from 'fs'
import path from 'path'
import Discord from "discord.js"
import { Command } from "../../index"

const command: Command = {
    name: "holidays",
    description: "Sends an announcement wishing everyone a happy (holiday) in each language.",
    options: [{
        type: "STRING",
        name: "holiday",
        description: "The holiday to announce",
        choices: [{
            name: "Easter",
            value: "easter"
        },
        {
            name: "Halloween",
            value: "halloween"
        },
        {
            name: "Christmas",
            value: "christmas"
        },
        {
            name: "New Year",
            value: "newYear"
        }],
        required: true
    }],
    allowDM: true,
    roleWhitelist: ["764442984119795732"], //Discord Administrator
    channelWhitelist: ["730042612647723058", "551693960913879071"], // bot-development admin-bots
    async execute(interaction: Discord.CommandInteraction) {
        let strings = require(`../../../strings/en/holidays.json`)
        const dirPath = path.join(__dirname, "../../../strings"),
            holidayName = interaction.options.get("holiday")!.value as string
        let holiday: string[] = []
        let log: string[] = []
        holiday.push(strings[holidayName])
        fs.readdir(dirPath, async (err, langs) => {
            if (err) return console.error(`Unable to scan directory.\n${err}`)
            langs.forEach(lang => {
                if (lang === "empty") return
                strings = require(`../../../strings/${lang}/holidays.json`)
                if (!holiday.includes(strings[holidayName])) {
                    holiday.push(strings[holidayName])
                    log.push(`${lang}: ${strings[holidayName]}`)
                }
            })
            const announcement = holiday.join(" ")
            if (announcement) {
                const announcements = interaction.client.channels.cache.get("549503985501995011") as Discord.NewsChannel
                announcements.send(`${announcement}\n\n - From the Hypixel Translators Team. ❤`) //announcements
                    .then(msg => msg.crosspost())
                await interaction.reply(`${holidayName.charAt(0).toUpperCase() + holidayName.slice(1)} announcement sent! Here's each language's translation:\n${log.join("\n")}`)
                console.log(log)
                console.log(`Sent the ${holidayName.charAt(0).toUpperCase() + holidayName.slice(1)} announcement`)
            } else return interaction.reply("For some reason there is nothing in the announcement so I can't send it. Fix your code bro.", { ephemeral: true })
        })
    }
}

export default command
