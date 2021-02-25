const Discord = require("discord.js")
const fetch = require("node-fetch")
const ctokenV2 = process.env.CTOKEN_API_V2
const { successColor, loadingColor, errorColor, neutralColor } = require("../../config.json")
const { getUser, getDb } = require("../../lib/mongodb")

module.exports = {
    name: "languagestats",
    description: "Shows you the progress of a language on the all projects we currently support.",
    usage: "+languagestats <language>",
    aliases: ["langstats", "lstats"],
    cooldown: 30,
    channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058", "551693960913879071"], // bots staff-bots bot-development admin-bots
    async execute(message, args, getString) {
        const executedBy = getString("executedBy").replace("%%user%%", message.author.tag)
        let rawLang
        const authorDb = await getUser(message.author.id)
        if (authorDb.lang !== "en" && authorDb.lang !== "empty" && !args[0]) rawLang = authorDb.lang
        if (args[0]) rawLang = args.join(" ").toLowerCase()
        if (!rawLang) throw "noLang"
        const langdb = await getDb().collection("langdb").find().toArray()
        let lang = langdb.find(l => l.code === rawLang || l.id.toLowerCase() === rawLang || l.name.toLowerCase() === rawLang)
        if (!lang) lang = langdb.find(l => l.name.toLowerCase().includes(rawLang))
        if (lang.code === "en") lang = undefined
        if (!lang) throw "falseLang"

        message.channel.startTyping()
        const settings = { headers: { "Content-Type": "application/json", "Authorization": "Bearer " + ctokenV2 } }
        const hypixel = `https://api.crowdin.com/api/v2/projects/128098/languages/progress?limit=500`
        var hypixelData
        fetch(hypixel, settings)
            .then(res => res.json())
            .then(json => {
                json.data.forEach(language => {
                    if (language.data.languageId === lang.id) hypixelData = language.data
                })

                const quickplay = `https://api.crowdin.com/api/v2/projects/369653/languages/progress?limit=500`
                let quickplayData
                fetch(quickplay, settings)
                    .then(res => res.json())
                    .then(json => {
                        json.data.forEach(language => {
                            if (language.data.languageId === lang.id) quickplayData = language.data
                        })

                        const sba = `https://api.crowdin.com/api/v2/projects/369493/languages/progress?limit=500`
                        let sbaData
                        fetch(sba, settings)
                            .then(res => res.json())
                            .then(json => {
                                json.data.forEach(language => {
                                    if (language.data.languageId === lang.id) sbaData = language.data
                                })

                                const bot = `https://api.crowdin.com/api/v2/projects/436418/languages/progress?limit=500`
                                let botData
                                fetch(bot, settings)
                                    .then(res => res.json())
                                    .then(json => {
                                        json.data.forEach(language => {
                                            if (language.data.languageId === lang.id) botData = language.data
                                        })

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
    }
}