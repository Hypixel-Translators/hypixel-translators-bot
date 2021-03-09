import { client } from "../../index"
import { db } from "../../lib/dbclient"
import Discord from "discord.js"
import fetch, { FetchError } from "node-fetch"
import { successColor, loadingColor, errorColor } from "../../config.json"
import { Command } from "../../lib/dbclient"
import { ObjectId } from "mongodb"
const ctokenV2 = process.env.CTOKEN_API_V2

const command: Command = {
    name: "languagestats",
    description: "Shows you the progress of a language on the all projects we currently support.",
    usage: "+languagestats <language>",
    aliases: ["langstats", "lstats"],
    cooldown: 30,
    channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058", "551693960913879071"], // bots staff-bots bot-development admin-bots
    async execute(message: Discord.Message, args: string[], getString: (path: string, cmd?: string, lang?: string) => any) {
        const executedBy = getString("executedBy", "global").replace("%%user%%", message.author.tag)
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
        const settings = { headers: { "Content-Type": "application/json", "Authorization": "Bearer " + ctokenV2 } }
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
                                            .setDescription(`${getString("statsAll").replace("%%language%%", getString(`languages.${lang.code}`))}`)
                                            .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                                        if (hypixelData) embed.addField("Hypixel", `${getString("translated").replace("%%percentage%%", hypixelData.translationProgress).replace("%%translated%%", hypixelData.phrases.translated).replace("%%total%%", hypixelData.phrases.total)}\n${getString("approved").replace("%%percentage%%", hypixelData.approvalProgress).replace("%%approved%%", hypixelData.phrases.approved).replace("%%total%%", hypixelData.phrases.total)}`)
                                        if (quickplayData) embed.addField("Quickplay", `${getString("translated").replace("%%percentage%%", quickplayData.translationProgress).replace("%%translated%%", quickplayData.phrases.translated).replace("%%total%%", quickplayData.phrases.total)}\n${getString("approved").replace("%%percentage%%", quickplayData.approvalProgress).replace("%%approved%%", quickplayData.phrases.approved).replace("%%total%%", quickplayData.phrases.total)}`)
                                        if (sbaData) embed.addField("SkyblockAddons", `${getString("translated").replace("%%percentage%%", sbaData.translationProgress).replace("%%translated%%", sbaData.phrases.translated).replace("%%total%%", sbaData.phrases.total)}\n${getString("approved").replace("%%percentage%%", sbaData.approvalProgress).replace("%%approved%%", sbaData.phrases.approved).replace("%%total%%", sbaData.phrases.total)}`)
                                        if (botData) embed.addField("Hypixel Translators Bot", `${getString("translated").replace("%%percentage%%", botData.translationProgress).replace("%%translated%%", botData.phrases.translated).replace("%%total%%", botData.phrases.total)}\n${getString("approved").replace("%%percentage%%", botData.approvalProgress).replace("%%approved%%", botData.phrases.approved).replace("%%total%%", botData.phrases.total)}`)
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

interface LangDbEntry {
    _id: ObjectId,
    name: string,
    emoji: string,
    colour?: string,
    code: string,
    id: string
    flag: string
}
