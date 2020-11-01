const { workingColor, errorColor, successColor, neutralColor, langdb } = require("../config.json");
const Discord = require("discord.js");
const fetch = require("node-fetch");
const ctoken = process.env.CTOKEN

module.exports = {
    async execute(client, manual) {
        try {
            var d = new Date()
            var n = d.getMinutes()
            if (n == "0" || n == "20" || n == "40" || manual) {
                await hypixel(client)
                await skyblockaddons(client)
            }
            if (n == "10" || n == "30" || n == "50" || manual) {
                await quickplay(client)
                await bot(client)
            }
        } catch (err) { throw err }
    }
}

async function hypixel(client) {
    let url = "https://api.crowdin.com/api/project/hypixel/status?login=qkeleq10&account-key=" + ctoken + "&json"
    let settings = { method: "Get" }
    var index = 0
    fetch(url, settings)
        .then(res => res.json())
        .then((json) => {
            json.reverse()
            client.channels.cache.get("748538826003054643").messages.fetch()
                .then(messages => {
                    fiMessages = messages.filter(msg => msg.author.bot)
                    fiMessages.forEach(async (msg) => {
                        var r = json[index]
                        var langdbEntry = langdb.find(o => o.name === r.name)
                        const embed = new Discord.MessageEmbed()
                            .setColor(langdbEntry.colour)
                            .setTitle(langdbEntry.emoji + " | " + r.name || "<:icon_question:756582065834688662>" + " | " + r.name)
                            .setThumbnail("https://crowdin.com/images/flags/" + r.code + ".png")
                            .setDescription("**" + r.translated_progress + "% translated (" + r.translated + "/" + r.phrases + " strings)**\n" + r.approved_progress + "% approved (" + r.approved + "/" + r.phrases + " strings)\n\nTranslate at https://crowdin.com/translate/hypixel/all/en-" + langdbEntry.code)
                            .setTimestamp()
                        msg.edit("", embed)
                        index++
                    })
                })
            client.channels.cache.get("730042612647723058").messages.fetch("748584877921796146")
                .then(stringCount => {
                    if (stringCount.content !== json[0].phrases) {
                        if (stringCount.content < json[0].phrases) {
                            client.channels.cache.get("549503328472530976").send("> <a:coolparty:728990234930315344> **New String(s)!**\n" + Number(Number(json[0].phrases) - Number(stringCount.content)) + " string(s) have been added to the Hypixel project.\n\nTranslate at <https://crowdin.com/translate/hypixel/all/en>")
                        } else {
                            client.channels.cache.get("549503328472530976").send("> <:vote_no:732298639736570007> **String(s) Removed**\n" + Math.abs(Number(Number(json[0].phrases) - Number(stringCount.content))) + " string(s) have been removed from the Hypixel project.")
                        }
                        stringCount.edit(json[0].phrases)
                    }
                })
        })
}

async function quickplay(client) {
    let url = "https://api.crowdin.com/api/project/quickplay/status?login=qkeleq10&account-key=" + ctoken + "&json"
    let settings = { method: "Get" }
    var index = 0
    fetch(url, settings)
        .then(res => res.json())
        .then((json) => {
            json.reverse()
            client.channels.cache.get("748626115530326016").messages.fetch()
                .then(messages => {
                    fiMessages = messages.filter(msg => msg.author.bot)
                    fiMessages.forEach(async (msg) => {
                        var r = json[index]
                        var langdbEntry = langdb.find(o => o.name === r.name)

                        if (r.approved_progress > 89) {
                            adapColour = successColor
                        } else if (r.approved_progress > 49) {
                            adapColour = workingColor
                        } else {
                            adapColour = errorColor
                        }

                        const embed = new Discord.MessageEmbed()
                            .setColor(adapColour)
                            .setTitle(langdbEntry.emoji + " | " + r.name || "<:icon_question:756582065834688662>" + " | " + r.name)
                            .setThumbnail("https://crowdin.com/images/flags/" + r.code + ".png")
                            .setDescription("**" + r.translated_progress + "% translated (" + r.translated + "/" + r.phrases + " strings)**\n" + r.approved_progress + "% approved (" + r.approved + "/" + r.phrases + " strings)\n\nTranslate at https://crowdin.com/translate/quickplay/all/en-" + langdbEntry.code)
                            .setTimestamp()
                        msg.edit("", embed)
                        index++
                    })
                })
            client.channels.cache.get("730042612647723058").messages.fetch("748644636318236672")
                .then(stringCount => {
                    if (stringCount.content !== json[0].phrases) {
                        if (stringCount.content < json[0].phrases) {
                            client.channels.cache.get("646383292010070016").send("> <a:coolparty:728990234930315344> **New String(s)!**\n" + Number(Number(json[0].phrases) - Number(stringCount.content)) + " string(s) have been added to the Quickplay project.\n\nTranslate at <https://crowdin.com/translate/quickplay/all/en>")
                        } else {
                            client.channels.cache.get("646383292010070016").send("> <:vote_no:732298639736570007> **String(s) Removed**\n" + Math.abs(Number(Number(json[0].phrases) - Number(stringCount.content))) + " string(s) have been removed from the Quickplay project.")
                        }
                        stringCount.edit(json[0].phrases)
                    }
                })
        })
}

async function bot(client) {
    let url = "https://api.crowdin.com/api/project/hypixel-translators-bot/status?login=qkeleq10&account-key=" + ctoken + "&json"
    let settings = { method: "Get" }
    var index = 0
    fetch(url, settings)
        .then(res => res.json())
        .then((json) => {
            json.reverse()
            client.channels.cache.get("762661287749484614").messages.fetch()
                .then(messages => {
                    fiMessages = messages.filter(msg => msg.author.bot)
                    fiMessages.forEach(async (msg) => {
                        var r = json[index]
                        var langdbEntry = langdb.find(o => o.name === r.name)

                        if (r.approved_progress > 89) {
                            adapColour = successColor
                        } else if (r.approved_progress > 49) {
                            adapColour = workingColor
                        } else {
                            adapColour = errorColor
                        }

                        const embed = new Discord.MessageEmbed()
                            .setColor(adapColour)
                            .setTitle(langdbEntry.emoji + " | " + r.name || "<:icon_question:756582065834688662>" + " | " + r.name)
                            .setThumbnail((langdbEntry.flag).replace("%code%", r.code))
                            .setDescription("**" + r.translated_progress + "% translated (" + r.translated + "/" + r.phrases + " strings)**\n" + r.approved_progress + "% approved (" + r.approved + "/" + r.phrases + " strings)\n\nTranslate at https://crowdin.com/translate/hypixel-translators-bot/all/en-" + langdbEntry.code)
                            .setTimestamp()
                        msg.edit("", embed)
                        index++
                    })
                })
            client.channels.cache.get("730042612647723058").messages.fetch("750161237106622634")
                .then(stringCount => {
                    if (stringCount.content !== json[0].phrases) {
                        if (stringCount.content < json[0].phrases) {
                            client.channels.cache.get("749391414600925335").send("> <a:coolparty:728990234930315344> **New String(s)!**\n" + Number(Number(json[0].phrases) - Number(stringCount.content)) + " string(s) have been added to the Hypixel Translators Bot project.\n\nTranslate at <https://crowdin.com/translate/hypixel-translators-bot/all/en>")
                        } else {
                            client.channels.cache.get("749391414600925335").send("> <:vote_no:732298639736570007> **String(s) Removed**\n" + Math.abs(Number(Number(json[0].phrases) - Number(stringCount.content))) + " string(s) have been removed from the Hypixel Translators Bot project.")
                        }
                        stringCount.edit(json[0].phrases)
                    }
                })
        })
}

async function skyblockaddons(client) {
    try {
        let url = "https://api.crowdin.com/api/project/skyblockaddons/status?login=qkeleq10&account-key=" + ctoken + "&json"
        let settings = { method: "Get" }
        var index = 0
        fetch(url, settings)
            .then(res => res.json())
            .then((json) => {
                json.reverse()
                client.channels.cache.get("759740668310192199").messages.fetch()
                    .then(messages => {
                        fiMessages = messages.filter(msg => msg.author.bot)
                        fiMessages.forEach(async (msg) => {
                            var r = json[index]
                            var langdbEntry = langdb.find(o => o.name === r.name)

                            if (r.approved_progress > 89) {
                                adapColour = successColor
                            } else if (r.approved_progress > 49) {
                                adapColour = workingColor
                            } else {
                                adapColour = errorColor
                            }

                            const embed = new Discord.MessageEmbed()
                                .setColor(adapColour)
                                .setDescription("**" + r.translated_progress + "% translated (" + r.translated + "/" + r.phrases + " strings)**\n" + r.approved_progress + "% approved (" + r.approved + "/" + r.phrases + " strings)\n\nTranslate at https://crowdin.com/translate/skyblockaddons/all/en-" + langdbEntry.code)
                                .setThumbnail((langdbEntry.flag).replace("%code%", r.code))
                                .setTimestamp()
                            if (langdbEntry) { embed.setTitle(langdbEntry.emoji + " | " + r.name) } else { embed.setTitle("<:icon_question:756582065834688662> | " + r.name) }
                            msg.edit("", embed)
                            index++
                        })
                    })

                client.channels.cache.get("730042612647723058").messages.fetch("758819913577136190")
                    .then(stringCount => {
                        if (stringCount.content !== json[0].phrases) {
                            if (stringCount.content < json[0].phrases) {
                                client.channels.cache.get("748594964476329994").send("> <a:coolparty:728990234930315344> **New String(s)!**\n" + Number(Number(json[0].phrases) - Number(stringCount.content)) + " string(s) have been added to the SkyblockAddons project.\n\nTranslate at <https://crowdin.com/translate/skyblockaddons/all/en>")
                            } else {
                                client.channels.cache.get("748594964476329994").send("> <:vote_no:732298639736570007> **String(s) Removed**\n" + Math.abs(Number(Number(json[0].phrases) - Number(stringCount.content))) + " string(s) have been removed from the SkyblockAddons project.")
                            }
                            stringCount.edit(json[0].phrases)
                        }
                    })
            })
    } catch (error) { throw error }
}
