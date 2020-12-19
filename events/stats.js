const { loadingColor, errorColor, successColor, neutralColor, langdb } = require("../config.json");
const Discord = require("discord.js");
const fetch = require("node-fetch");
const ctoken = process.env.CTOKEN
const caccount = process.env.CACCOUNT

module.exports = {
    async execute(client, manual) {
        try {
            var d = new Date()
            var n = d.getMinutes()
            if (n == "0" || n == "20" || n == "40") {
                await hypixel(client)
                await skyblockaddons(client)
                //console.log("Hypixel and SBA's stats have been automatically updated.")
            }
            if (n == "10" || n == "30" || n == "50") {
                await quickplay(client)
                await bot(client)
                //console.log("Quickplay and SBA's stats have been automatically updated.")
            }
            if (manual) {
                await hypixel(client)
                await skyblockaddons(client)
                await quickplay(client)
                await bot(client)
                console.log("All stats have been manually updated.")
            }
        } catch (err) { throw err }
    }
}

async function hypixel(client) {
    let url = `https://api.crowdin.com/api/project/hypixel/status?login=${caccount}&account-key=${ctoken}&json`
    let settings = { method: "Get" }
    var index = 0
    fetch(url, settings)
        .then(res => res.json())
        .then((json) => {
            json.reverse()
            client.channels.cache.find(channel => channel.name === "hypixel-language-status").messages.fetch() //hypixel-language-status
                .then(messages => {
                    fiMessages = messages.filter(msg => msg.author.bot)
                    fiMessages.forEach(async (msg) => {
                        var r = json[index]
                        var langdbEntry = langdb.find(o => o.name === r.name)
                        const embed = new Discord.MessageEmbed()
                            .setColor(langdbEntry.colour)
                            .setTitle(langdbEntry.emoji + " | " + r.name || "<:icon_question:756582065834688662>" + " | " + r.name)
                            .setThumbnail("https://crowdin.com/images/flags/" + r.code + ".png")
                            .setDescription(`**${r.translated_progress}% translated (${r.translated}/${r.phrases} strings)**\n${r.approved_progress}% approved (${r.approved}/${r.phrases} strings)\n\nTranslate at https://crowdin.com/translate/hypixel/all/en-${langdbEntry.code}`)
                            .setTimestamp()
                        msg.edit("", embed)
                        index++
                    })
                })
            client.channels.cache.get("730042612647723058").messages.fetch("782637177552240661") //bot development Hypixel string count
                .then(stringCount => {
                    if (stringCount.content !== json[0].phrases) {
                        var stringDiff = Math.abs(Number(Number(json[0].phrases) - Number(stringCount.content)))
                        if (stringCount.content < json[0].phrases) {
                            if (stringDiff == 1) {
                                client.channels.cache.get("549503328472530976").send("> <a:coolparty:728990234930315344> **New String!**\n" + stringDiff + " string has been added to the Hypixel project.\n\nTranslate at <https://crowdin.com/translate/hypixel/all/en>") //hypixel-translators
                            } else
                                client.channels.cache.get("549503328472530976").send("> <a:coolparty:728990234930315344> **New Strings!**\n" + stringDiff + " strings have been added to the Hypixel project.\n\nTranslate at <https://crowdin.com/translate/hypixel/all/en>") //hypixel-translators
                        } else {
                            if (stringDiff == 1) {
                                client.channels.cache.get("549503328472530976").send("> <:vote_no:732298639736570007> **String Removed**\n" + stringDiff + " string has been removed from the Hypixel project.") //hypixel-translators
                            } else {
                                client.channels.cache.get("549503328472530976").send("> <:vote_no:732298639736570007> **Strings Removed**\n" + stringDiff + " strings have been removed from the Hypixel project.") //hypixel-translators
                            }
                        }
                        stringCount.edit(json[0].phrases)
                    }
                })
        })
}

async function quickplay(client) {
    let url = `https://api.crowdin.com/api/project/quickplay/status?login=${caccount}&account-key=${ctoken}&json`
    let settings = { method: "Get" }
    var index = 0
    fetch(url, settings)
        .then(res => res.json())
        .then((json) => {
            json.reverse()
            client.channels.cache.find(channel => channel.name === "quickplay-language-status").messages.fetch() //quickplay-language-status
                .then(messages => {
                    fiMessages = messages.filter(msg => msg.author.bot)
                    fiMessages.forEach(async (msg) => {
                        var r = json[index]
                        var langdbEntry = langdb.find(o => o.name === r.name)

                        if (r.approved_progress > 89) {
                            adapColour = successColor
                        } else if (r.approved_progress > 49) {
                            adapColour = loadingColor
                        } else {
                            adapColour = errorColor
                        }

                        const embed = new Discord.MessageEmbed()
                            .setColor(adapColour)
                            .setTitle(langdbEntry.emoji + " | " + r.name || "<:icon_question:756582065834688662>" + " | " + r.name)
                            .setThumbnail("https://crowdin.com/images/flags/" + r.code + ".png")
                            .setDescription(`**${r.translated_progress}% translated (${r.translated}/${r.phrases} strings)**\n${r.approved_progress}% approved (${r.approved}/${r.phrases} strings)\n\nTranslate at https://crowdin.com/translate/quickplay/all/en-${langdbEntry.code}`)
                            .setTimestamp()
                        msg.edit("", embed)
                        index++
                    })
                })
            client.channels.cache.get("730042612647723058").messages.fetch("782637234322931733") //bot-development Quickplay string count
                .then(stringCount => {
                    if (stringCount.content !== json[0].phrases) {
                        var stringDiff = Math.abs(Number(Number(json[0].phrases) - Number(stringCount.content)))
                        if (stringCount.content < json[0].phrases) {
                            if (stringDiff == 1) {
                                client.channels.cache.get("646383292010070016").send("> <a:coolparty:728990234930315344> **New String!**\n" + stringDiff + " string has been added to the Quickplay project.\n\nTranslate at <https://crowdin.com/translate/quickplay/all/en>") //quickplay-translators
                            } else
                                client.channels.cache.get("646383292010070016").send("> <a:coolparty:728990234930315344> **New Strings!**\n" + stringDiff + " strings have been added to the Quickplay project.\n\nTranslate at <https://crowdin.com/translate/quickplay/all/en>") //quickplay-translators
                        } else {
                            if (stringDiff == 1) {
                                client.channels.cache.get("646383292010070016").send("> <:vote_no:732298639736570007> **String Removed**\n" + stringDiff + " string has been removed from the Quickplay project.") //quickplay-translators
                            } else {
                                client.channels.cache.get("646383292010070016").send("> <:vote_no:732298639736570007> **Strings Removed**\n" + stringDiff + " strings have been removed from the Quickplay project.") //quickplay-translators
                            }
                        }
                        stringCount.edit(json[0].phrases)
                    }
                })
        })
}

async function bot(client) {
    let url = `https://api.crowdin.com/api/project/hypixel-translators-bot/status?login=${caccount}&account-key=${ctoken}&json`
    let settings = { method: "Get" }
    var index = 0
    fetch(url, settings)
        .then(res => res.json())
        .then((json) => {
            json.reverse()
            client.channels.cache.find(channel => channel.name === "bot-language-status").messages.fetch() //bot-language-status
                .then(messages => {
                    fiMessages = messages.filter(msg => msg.author.bot)
                    fiMessages.forEach(async (msg) => {
                        var r = json[index]
                        var langdbEntry = langdb.find(o => o.name === r.name)

                        if (r.approved_progress > 89) {
                            adapColour = successColor
                        } else if (r.approved_progress > 49) {
                            adapColour = loadingColor
                        } else {
                            adapColour = errorColor
                        }

                        const embed = new Discord.MessageEmbed()
                            .setColor(adapColour)
                            .setTitle(langdbEntry.emoji + " | " + r.name || "<:icon_question:756582065834688662>" + " | " + r.name)
                            .setThumbnail((langdbEntry.flag).replace("%code%", r.code))
                            .setDescription(`**${r.translated_progress}% translated (${r.translated}/${r.phrases} strings)**\n${r.approved_progress}% approved (${r.approved}/${r.phrases} strings)\n\nTranslate at https://crowdin.com/translate/hypixel-translators-bot/all/en-${langdbEntry.code}`)
                            .setTimestamp()
                        msg.edit("", embed)
                        index++
                    })
                })
            client.channels.cache.get("730042612647723058").messages.fetch("782637303427497994") //bot-development Bot string count
                .then(stringCount => {
                    if (stringCount.content !== json[0].phrases) {
                        var stringDiff = Math.abs(Number(Number(json[0].phrases) - Number(stringCount.content)))
                        if (stringCount.content < json[0].phrases) {
                            if (stringDiff == 1) {
                                client.channels.cache.get("749391414600925335").send("> <a:coolparty:728990234930315344> **New String!**\n" + stringDiff + " string has been added to the Hypixel Translators Bot project.\n\nTranslate at <https://crowdin.com/translate/hypixel-translators-bot/all/en>") //bot-translators
                            } else
                                client.channels.cache.get("749391414600925335").send("> <a:coolparty:728990234930315344> **New Strings!**\n" + stringDiff + " strings have been added to the Hypixel Translators Bot project.\n\nTranslate at <https://crowdin.com/translate/hypixel-translators-bot/all/en>") //bot-translators
                        } else {
                            if (stringDiff == 1) {
                                client.channels.cache.get("749391414600925335").send("> <:vote_no:732298639736570007> **String Removed**\n" + stringDiff + " string has been removed from the Hypixel Translators Bot project.") //bot-translators
                            } else {
                                client.channels.cache.get("749391414600925335").send("> <:vote_no:732298639736570007> **Strings Removed**\n" + stringDiff + " strings have been removed from the Hypixel Translators Bot project.") //bot-translators
                            }
                        }
                        stringCount.edit(json[0].phrases)
                    }
                })
        })
}

async function skyblockaddons(client) {
    try {
        let url = `https://api.crowdin.com/api/project/skyblockaddons/status?login=${caccount}&account-key=${ctoken}&json`
        let settings = { method: "Get" }
        var index = 0
        fetch(url, settings)
            .then(res => res.json())
            .then((json) => {
                json.reverse()
                client.channels.cache.find(channel => channel.name === "sba-language-status").messages.fetch() //sba-language-status
                    .then(messages => {
                        fiMessages = messages.filter(msg => msg.author.bot)
                        fiMessages.forEach(async (msg) => {
                            var r = json[index]
                            var langdbEntry = langdb.find(o => o.name === r.name)

                            if (r.approved_progress > 89) {
                                adapColour = successColor
                            } else if (r.approved_progress > 49) {
                                adapColour = loadingColor
                            } else {
                                adapColour = errorColor
                            }

                            const embed = new Discord.MessageEmbed()
                                .setColor(adapColour)
                                .setDescription(`**${r.translated_progress}% translated (${r.translated}/${r.phrases} strings)**\n${r.approved_progress}% approved (${r.approved}/${r.phrases} strings)\n\nTranslate at https://crowdin.com/translate/skyblockaddons/all/en-${langdbEntry.code}`)
                                .setThumbnail((langdbEntry.flag).replace("%code%", r.code))
                                .setTimestamp()
                            if (langdbEntry) { embed.setTitle(langdbEntry.emoji + " | " + r.name) } else { embed.setTitle("<:icon_question:756582065834688662> | " + r.name) }
                            msg.edit("", embed)
                            index++
                        })
                    })

                client.channels.cache.get("730042612647723058").messages.fetch("782637265230626836") //bot-development Sba string count
                    .then(stringCount => {
                        if (stringCount.content !== json[0].phrases) {
                            var stringDiff = Math.abs(Number(Number(json[0].phrases) - Number(stringCount.content)))
                            if (stringCount.content < json[0].phrases) {
                                if (stringDiff == 1) {
                                    client.channels.cache.get("748594964476329994").send("> <a:coolparty:728990234930315344> **New String!**\n" + stringDiff + " string has been added to the SkyblockAddons project.\n\nTranslate at <https://crowdin.com/translate/skyblockaddons/all/en>") //sba-translators
                                } else
                                    client.channels.cache.get("748594964476329994").send("> <a:coolparty:728990234930315344> **New Strings!**\n" + stringDiff + " strings have been added to the SkyblockAddons project.\n\nTranslate at <https://crowdin.com/translate/skyblockaddons/all/en>") //sba-translators
                            } else {
                                if (stringDiff == 1) {
                                    client.channels.cache.get("748594964476329994").send("> <:vote_no:732298639736570007> **String Removed**\n" + stringDiff + " string has been removed from the SkyblockAddons project.") //sba-translators
                                } else {
                                    client.channels.cache.get("748594964476329994").send("> <:vote_no:732298639736570007> **Strings Removed**\n" + stringDiff + " strings have been removed from the SkyblockAddons project.") //sba-translators
                                }
                            }
                            stringCount.edit(json[0].phrases)
                        }
                    })
            })
    } catch (error) { throw error }
}
