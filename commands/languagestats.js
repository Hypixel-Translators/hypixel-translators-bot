const Discord = require("discord.js")
const fetch = require("node-fetch")
const ctokenV2 = process.env.CTOKEN_API_V2
const { successColor, loadingColor, errorColor, neutralColor, langdb } = require("../config.json")

module.exports = {
    name: "languagestats",
    description: "Shows you the progress of a language on the all projects we currently support.",
    usage: "+languagestats <language>",
    aliases: ["langstats", "lstats"],
    cooldown: 30,
    channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058", "749391414600925335", "551693960913879071"], // bots staff-bots bot-development bot-translators admin-bots
    execute(message, strings, args) {
        const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
        if (!args[0]) throw "noLang"
        let rawLang = args.join(" ").toLowerCase()
        let lang = langdb.find(l => l.code === rawLang || l.id.toLowerCase() === rawLang || l.name.toLowerCase() === rawLang)
        if (!lang) lang = langdb.find(l => l.name.toLowerCase().includes(rawLang))
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

                                        const embed = new Discord.MessageEmbed()
                                            .setColor(neutralColor)
                                            .setThumbnail(lang.flag)
                                            .setAuthor(strings.moduleName)
                                            .setTitle(`${lang.emoji} | ${strings.languages[lang.code]}`)
                                            .setDescription(`${strings.statsAll.replace("%%language%%", lang.name)}`)
                                            .setFooter(executedBy, message.author.displayAvatarURL())
                                        if (hypixelData) embed.addField("Hypixel", `${strings.translated.replace("%%percentage%%", hypixelData.translationProgress).replace("%%translated%%", hypixelData.phrases.translated).replace("%%total%%", hypixelData.phrases.total)}\n${strings.approved.replace("%%percentage%%", hypixelData.approvalProgress).replace("%%approved%%", hypixelData.phrases.approved).replace("%%total%%", hypixelData.phrases.total)}`)
                                        if (quickplayData) embed.addField("Quickplay", `${strings.translated.replace("%%percentage%%", quickplayData.translationProgress).replace("%%translated%%", quickplayData.phrases.translated).replace("%%total%%", quickplayData.phrases.total)}\n${strings.approved.replace("%%percentage%%", quickplayData.approvalProgress).replace("%%approved%%", quickplayData.phrases.approved).replace("%%total%%", quickplayData.phrases.total)}`)
                                        if (sbaData) embed.addField("SkyblockAddons", `${strings.translated.replace("%%percentage%%", sbaData.translationProgress).replace("%%translated%%", sbaData.phrases.translated).replace("%%total%%", sbaData.phrases.total)}\n${strings.approved.replace("%%percentage%%", sbaData.approvalProgress).replace("%%approved%%", sbaData.phrases.approved).replace("%%total%%", sbaData.phrases.total)}`)
                                        if (botData) embed.addField("Hypixel Translators Bot", `${strings.translated.replace("%%percentage%%", botData.translationProgress).replace("%%translated%%", botData.phrases.translated).replace("%%total%%", botData.phrases.total)}\n${strings.approved.replace("%%percentage%%", botData.approvalProgress).replace("%%approved%%", botData.phrases.approved).replace("%%total%%", botData.phrases.total)}`)
                                        message.channel.stopTyping()
                                        message.channel.send(embed)
                                    })
                            })
                    })
            })
    }
}