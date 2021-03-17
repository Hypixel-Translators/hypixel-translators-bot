import { db } from "../../lib/dbclient"
import Discord from "discord.js"
import fetch, { FetchError } from "node-fetch"
import { successColor, loadingColor, errorColor } from "../../config.json"
import { LangDbEntry } from "../../events/stats"
import { Command, client } from "../../index"
const ctokenV2 = process.env.CTOKEN_API_V2

const command: Command = {
    name: "languagestats",
    description: "Shows you the progress of a language on the all projects we currently support.",
    usage: "+languagestats <language>",
    aliases: ["langstats", "lstats"],
    cooldown: 30,
    channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058", "551693960913879071"], // bots staff-bots bot-development admin-bots
    async execute(message: Discord.Message, args: string[], getString: (path: string, variables?: { [key: string]: string | number }, cmd?: string, lang?: string) => any) {
        const executedBy = getString("executedBy", { user: message.author.tag }, "global")
        let rawLang: string
        const authorDb = await client.getUser(message.author.id)
        if (authorDb.lang !== "en" && authorDb.lang !== "empty" && !args[0]) rawLang = authorDb.lang
        if (args[0]) rawLang = args.join(" ").toLowerCase()
        if (!rawLang!) throw "noLang"
        const langdb = await db.collection("langdb").find().toArray()
        let lang: LangDbEntry = langdb.find(l => l.code === rawLang || l.id.toLowerCase() === rawLang || l.name.toLowerCase() === rawLang)
        if (!lang) lang = langdb.find(l => l.name.toLowerCase().includes(rawLang))
        if (!lang || lang?.code === "en") throw "falseLang"

        message.channel.startTyping()
        const settings = { headers: { "Content-Type": "application/json", "Authorization": "Bearer " + ctokenV2 }, timeout: 10000 }
        var hypixelData: LanguageStatus["data"]
        await fetch("https://api.crowdin.com/api/v2/projects/128098/languages/progress?limit=500", settings)
            .then(res => res.json())
            .then(async json => {
                json.data.forEach((language: LanguageStatus) => {
                    if (language.data.languageId === lang.id) hypixelData = language.data
                })

                let quickplayData: LanguageStatus["data"]
                await fetch("https://api.crowdin.com/api/v2/projects/369653/languages/progress?limit=500", settings)
                    .then(res => res.json())
                    .then(async json => {
                        json.data.forEach((language: LanguageStatus) => {
                            if (language.data.languageId === lang.id) quickplayData = language.data
                        })

                        const sba = `https://api.crowdin.com/api/v2/projects/369493/languages/progress?limit=500`
                        let sbaData: LanguageStatus["data"]
                        await fetch(sba, settings)
                            .then(res => res.json())
                            .then(async json => {
                                json.data.forEach((language: LanguageStatus) => {
                                    if (language.data.languageId === lang.id) sbaData = language.data
                                })

                                const bot = `https://api.crowdin.com/api/v2/projects/436418/languages/progress?limit=500`
                                let botData: LanguageStatus["data"]
                                await fetch(bot, settings)
                                    .then(res => res.json())
                                    .then(async json => {
                                        json.data.forEach((language: LanguageStatus) => {
                                            if (language.data.languageId === lang.id) botData = language.data
                                        })

                                        let adapColour: string
                                        if (hypixelData?.approvalProgress > 89 || quickplayData?.approvalProgress > 89 || sbaData?.approvalProgress > 89 || botData?.approvalProgress > 89) adapColour = successColor
                                        else if (hypixelData?.approvalProgress > 49 || quickplayData?.approvalProgress > 49 || sbaData?.approvalProgress > 49 || botData?.approvalProgress > 49) adapColour = loadingColor
                                        else adapColour = errorColor


                                        const embed = new Discord.MessageEmbed()
                                            .setColor(adapColour)
                                            .setThumbnail(lang.flag)
                                            .setAuthor(getString("moduleName"))
                                            .setTitle(`${lang.emoji} | ${getString(`languages.${lang.code}`)}`)
                                            .setDescription(`${getString("statsAll", { language: getString(`languages.${lang.code}`) })}`)
                                            .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                                        if (hypixelData) embed.addField("Hypixel", `${getString("translated", { percentage: hypixelData.translationProgress, translated: hypixelData.phrases.translated, total: hypixelData.phrases.total })}\n${getString("approved", { percentage: hypixelData.approvalProgress, approved: hypixelData.phrases.approved, total: hypixelData.phrases.total })}`)
                                        if (quickplayData) embed.addField("Quickplay", `${getString("translated", { percentage: quickplayData.translationProgress, translated: quickplayData.phrases.translated, total: quickplayData.phrases.total })}\n${getString("approved", { percentage: quickplayData.approvalProgress, approved: quickplayData.phrases.approved, total: quickplayData.phrases.total })}`)
                                        if (sbaData) embed.addField("SkyblockAddons", `${getString("translated", { percentage: sbaData.translationProgress, translated: sbaData.phrases.translated, total: sbaData.phrases.total })}\n${getString("approved", { percentage: sbaData.approvalProgress, approved: sbaData.phrases.approved, total: sbaData.phrases.total })}`)
                                        if (botData) embed.addField("Hypixel Translators Bot", `${getString("translated", { percentage: botData.translationProgress, translated: botData.phrases.translated, total: botData.phrases.total })}\n${getString("approved", { percentage: botData.approvalProgress, approved: botData.phrases.approved, total: botData.phrases.total })}`)
                                        message.channel.stopTyping()
                                        message.channel.send(embed)
                                    })
                            })
                    })
            })
            .catch(e => {
                if (e instanceof FetchError) {
                    console.error("Crowdin API is down, sending error.")
                    throw "apiError"
                } else throw e
            })
    }
}

export default command

interface LanguageStatus {
    data: {
        languageId: string,
        words: {
            total: number,
            translated: number,
            approved: number
        },
        phrases: {
            total: number,
            translated: number,
            approved: number
        },
        translationProgress: number,
        approvalProgress: number
    },
}
