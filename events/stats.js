const { loadingColor, errorColor, successColor, langdb } = require("../config.json")
const Discord = require("discord.js")
const fetch = require("node-fetch")
const ctokenV2 = process.env.CTOKEN_API_V2

module.exports = {
    async execute(client, manual) {
        try {
            const d = new Date()
            const m = d.getMinutes()
            if (m == "0" || m == "20" || m == "40") {
                await hypixel(client)
                await skyblockaddons(client)
                //console.log("Hypixel and SBA's stats have been automatically updated.")
            }
            if (m == "10" || m == "30" || m == "50") {
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
    },
    hypixel,
    quickplay,
    skyblockaddons,
    bot
}

function hypixel(client) {
    const url = `https://api.crowdin.com/api/v2/projects/128098/languages/progress?limit=50`
    const settings = { headers: { "Content-Type": "application/json", "Authorization": "Bearer " + ctokenV2 } }
    let index = 0
    fetch(url, settings)
        .then(res => res.json())
        .then((json) => {
            const langStatus = json.data
            const reversed = Array.from(langStatus).reverse()
            client.channels.cache.find(channel => channel.name === "hypixel-language-status").messages.fetch() //hypixel-language-status
                .then(messages => {
                    fiMessages = messages.filter(msg => msg.author.bot)
                    fiMessages.forEach(async msg => {
                        let r = reversed[index].data
                        let langdbEntry = langdb.find(l => l.code === r.languageId || l.id === r.languageId)
                        const embed = new Discord.MessageEmbed()
                            .setColor(langdbEntry.colour)
                            .setTitle(langdbEntry.emoji + " | " + langdbEntry.name || "<:icon_question:756582065834688662>" + " | " + langdbEntry.name)
                            .setThumbnail("https://crowdin.com/images/flags/" + r.languageId + ".png")
                            .setDescription(`**${r.translationProgress}% translated (${r.phrases.translated}/${r.phrases.total} strings)**\n${r.approvalProgress}% approved (${r.phrases.approved}/${r.phrases.total} strings)\n\nTranslate at https://crowdin.com/translate/hypixel/all/en-${langdbEntry.code}`)
                            .setTimestamp()
                        msg.edit("", embed)
                        index++
                    })
                })
            client.channels.cache.get("730042612647723058").messages.fetch("782637177552240661") //bot development Hypixel string count
                .then(stringCount => {
                    if (Number(stringCount.content) !== langStatus[0].data.phrases.total) {
                        const stringDiff = Math.abs(Number(Number(langStatus[0].data.phrases.total) - Number(stringCount.content)))
                        if (Number(stringCount.content) < langStatus[0].data.phrases.total) {
                            if (stringDiff == 1) client.channels.cache.get("549503328472530976").send("> <a:partyBlob:769679132317057064> **New String!**\n" + stringDiff + " string has been added to the Hypixel project.\n\nTranslate at <https://crowdin.com/translate/hypixel/all/en>") //hypixel-translators
                            else client.channels.cache.get("549503328472530976").send("> <a:partyBlob:769679132317057064> **New Strings!**\n" + stringDiff + " strings have been added to the Hypixel project.\n\nTranslate at <https://crowdin.com/translate/hypixel/all/en>") //hypixel-translators
                        } else if (Number(stringCount.content) < langStatus[0].data.phrases.total) {
                            if (stringDiff == 1) client.channels.cache.get("549503328472530976").send("> <:vote_no:732298639736570007> **String Removed**\n" + stringDiff + " string has been removed from the Hypixel project.") //hypixel-translators
                            else client.channels.cache.get("549503328472530976").send("> <:vote_no:732298639736570007> **Strings Removed**\n" + stringDiff + " strings have been removed from the Hypixel project.") //hypixel-translators
                        }
                        stringCount.edit(langStatus[0].data.phrases.total)
                    }
                })
        })
}

function quickplay(client) {
    const url = `https://api.crowdin.com/api/v2/projects/369653/languages/progress?limit=50`
    const settings = { headers: { "Content-Type": "application/json", "Authorization": "Bearer " + ctokenV2 } }
    let index = 0
    fetch(url, settings)
        .then(res => res.json())
        .then((json) => {
            const langStatus = json.data
            const reversed = Array.from(langStatus).reverse()
            client.channels.cache.find(channel => channel.name === "quickplay-language-status").messages.fetch() //quickplay-language-status
                .then(messages => {
                    fiMessages = messages.filter(msg => msg.author.bot)
                    fiMessages.forEach(async msg => {
                        let r = reversed[index].data
                        let langdbEntry = langdb.find(l => l.code === r.languageId || l.id === r.languageId)

                        if (r.approvalProgress > 89) {
                            adapColour = successColor
                        } else if (r.approvalProgress > 49) {
                            adapColour = loadingColor
                        } else {
                            adapColour = errorColor
                        }

                        const embed = new Discord.MessageEmbed()
                            .setColor(adapColour)
                            .setTitle(langdbEntry.emoji + " | " + langdbEntry.name || "<:icon_question:756582065834688662>" + " | " + langdbEntry.name)
                            .setThumbnail("https://crowdin.com/images/flags/" + r.languageId + ".png")
                            .setDescription(`**${r.translationProgress}% translated (${r.phrases.translated}/${r.phrases.total} strings)**\n${r.approvalProgress}% approved (${r.phrases.approved}/${r.phrases.total} strings)\n\nTranslate at https://crowdin.com/translate/quickplay/all/en-${langdbEntry.code}`)
                            .setTimestamp()
                        msg.edit("", embed)
                        index++
                    })
                })
            client.channels.cache.get("730042612647723058").messages.fetch("782637234322931733") //bot-development Quickplay string count
                .then(stringCount => {
                    if (Number(stringCount.content) !== langStatus[0].data.phrases.total) {
                        const stringDiff = Math.abs(Number(Number(langStatus[0].data.phrases.total) - Number(stringCount.content)))
                        if (Number(stringCount.content) < langStatus[0].data.phrases.total) {
                            if (stringDiff == 1) client.channels.cache.get("646383292010070016").send("> <a:partyBlob:769679132317057064> **New String!**\n" + stringDiff + " string has been added to the Quickplay project.\n\nTranslate at <https://crowdin.com/translate/quickplay/all/en>") //quickplay-translators
                            else client.channels.cache.get("646383292010070016").send("> <a:partyBlob:769679132317057064> **New Strings!**\n" + stringDiff + " strings have been added to the Quickplay project.\n\nTranslate at <https://crowdin.com/translate/quickplay/all/en>") //quickplay-translators
                        } else if (Number(stringCount.content) < langStatus[0].data.phrases.total) {
                            if (stringDiff == 1) client.channels.cache.get("646383292010070016").send("> <:vote_no:732298639736570007> **String Removed**\n" + stringDiff + " string has been removed from the Quickplay project.") //quickplay-translators
                            else client.channels.cache.get("646383292010070016").send("> <:vote_no:732298639736570007> **Strings Removed**\n" + stringDiff + " strings have been removed from the Quickplay project.") //quickplay-translators
                        }
                        stringCount.edit(langStatus[0].data.phrases.total)
                    }
                })
        })
}

function bot(client) {
    const url = `https://api.crowdin.com/api/v2/projects/418174/languages/progress?limit=50`
    const settings = { headers: { "Content-Type": "application/json", "Authorization": "Bearer " + ctokenV2 } }
    let index = 0
    fetch(url, settings)
        .then(res => res.json())
        .then((json) => {
            const langStatus = json.data
            const reversed = Array.from(langStatus).reverse()
            client.channels.cache.find(channel => channel.name === "bot-language-status").messages.fetch() //bot-language-status
                .then(messages => {
                    fiMessages = messages.filter(msg => msg.author.bot)
                    fiMessages.forEach(async msg => {
                        let r = reversed[index].data
                        let langdbEntry = langdb.find(l => l.code === r.languageId || l.id === r.languageId)

                        if (r.approvalProgress > 89) {
                            adapColour = successColor
                        } else if (r.approvalProgress > 49) {
                            adapColour = loadingColor
                        } else {
                            adapColour = errorColor
                        }

                        const embed = new Discord.MessageEmbed()
                            .setColor(adapColour)
                            .setTitle(langdbEntry.emoji + " | " + langdbEntry.name || "<:icon_question:756582065834688662>" + " | " + langdbEntry.name)
                            .setThumbnail((langdbEntry.flag).replace("%code%", r.languageId))
                            .setDescription(`**${r.translationProgress}% translated (${r.phrases.translated}/${r.phrases.total} strings)**\n${r.approvalProgress}% approved (${r.phrases.approved}/${r.phrases.total} strings)\n\nTranslate at https://crowdin.com/translate/hypixel-translators-bot/all/en-${langdbEntry.code}`)
                            .setTimestamp()
                        msg.edit("", embed)
                        index++
                    })
                })
            client.channels.cache.get("730042612647723058").messages.fetch("782637303427497994") //bot-development Bot string count
                .then(stringCount => {
                    if (Number(stringCount.content) !== langStatus[0].data.phrases.total) {
                        const stringDiff = Math.abs(Number(Number(langStatus[0].data.phrases.total) - Number(stringCount.content)))
                        if (Number(stringCount.content) < langStatus[0].data.phrases.total) {
                            if (stringDiff == 1) client.channels.cache.get("749391414600925335").send("> <a:partyBlob:769679132317057064> **New String!**\n" + stringDiff + " string has been added to the Hypixel Translators Bot project.\n\nTranslate at <https://crowdin.com/translate/hypixel-translators-bot/all/en>") //bot-translators
                            else client.channels.cache.get("749391414600925335").send("> <a:partyBlob:769679132317057064> **New Strings!**\n" + stringDiff + " strings have been added to the Hypixel Translators Bot project.\n\nTranslate at <https://crowdin.com/translate/hypixel-translators-bot/all/en>") //bot-translators
                        } else if (Number(stringCount.content) < langStatus[0].data.phrases.total) {
                            if (stringDiff == 1) client.channels.cache.get("749391414600925335").send("> <:vote_no:732298639736570007> **String Removed**\n" + stringDiff + " string has been removed from the Hypixel Translators Bot project.") //bot-translators
                            else client.channels.cache.get("749391414600925335").send("> <:vote_no:732298639736570007> **Strings Removed**\n" + stringDiff + " strings have been removed from the Hypixel Translators Bot project.") //bot-translators
                        }
                        stringCount.edit(langStatus[0].data.phrases.total)
                    }
                })
        })
}

function skyblockaddons(client) {
    try {
        const url = `https://api.crowdin.com/api/v2/projects/369493/languages/progress?limit=50`
        const settings = { headers: { "Content-Type": "application/json", "Authorization": "Bearer " + ctokenV2 } }
        let index = 0
        fetch(url, settings)
            .then(res => res.json())
            .then((json) => {
                const langStatus = json.data
                const reversed = Array.from(langStatus).reverse()
                client.channels.cache.find(channel => channel.name === "sba-language-status").messages.fetch() //sba-language-status
                    .then(messages => {
                        fiMessages = messages.filter(msg => msg.author.bot)
                        fiMessages.forEach(async msg => {
                            let r = reversed[index].data
                            let langdbEntry = langdb.find(l => l.code === r.languageId || l.id === r.languageId)

                            if (r.approvalProgress > 89) {
                                adapColour = successColor
                            } else if (r.approvalProgress > 49) {
                                adapColour = loadingColor
                            } else {
                                adapColour = errorColor
                            }

                            const embed = new Discord.MessageEmbed()
                                .setColor(adapColour)
                                .setDescription(`**${r.translationProgress}% translated (${r.phrases.translated}/${r.phrases.total} strings)**\n${r.approvalProgress}% approved (${r.phrases.approved}/${r.phrases.total} strings)\n\nTranslate at https://crowdin.com/translate/skyblockaddons/all/en-${langdbEntry.code}`)
                                .setThumbnail((langdbEntry.flag).replace("%code%", r.languageId))
                                .setTimestamp()
                            if (langdbEntry) { embed.setTitle(langdbEntry.emoji + " | " + langdbEntry.name) } else { embed.setTitle("<:icon_question:756582065834688662> | " + langdbEntry.name) }
                            msg.edit("", embed)
                            index++
                        })
                    })

                client.channels.cache.get("730042612647723058").messages.fetch("782637265230626836") //bot-development Sba string count
                    .then(stringCount => {
                        if (Number(stringCount.content) !== langStatus[0].data.phrases.total) {
                            const stringDiff = Math.abs(Number(Number(langStatus[0].data.phrases.total) - Number(stringCount.content)))
                            if (Number(stringCount.content) < langStatus[0].data.phrases.total) {
                                if (stringDiff == 1) client.channels.cache.get("748594964476329994").send("> <a:partyBlob:769679132317057064> **New String!**\n" + stringDiff + " string has been added to the SkyblockAddons project.\n\nTranslate at <https://crowdin.com/translate/skyblockaddons/all/en>") //sba-translators
                                else
                                    client.channels.cache.get("748594964476329994").send("> <a:partyBlob:769679132317057064> **New Strings!**\n" + stringDiff + " strings have been added to the SkyblockAddons project.\n\nTranslate at <https://crowdin.com/translate/skyblockaddons/all/en>") //sba-translators
                            } else if (Number(stringCount.content) < langStatus[0].data.phrases.total) {
                                if (stringDiff == 1) client.channels.cache.get("748594964476329994").send("> <:vote_no:732298639736570007> **String Removed**\n" + stringDiff + " string has been removed from the SkyblockAddons project.") //sba-translators
                                else client.channels.cache.get("748594964476329994").send("> <:vote_no:732298639736570007> **Strings Removed**\n" + stringDiff + " strings have been removed from the SkyblockAddons project.") //sba-translators
                            }
                            stringCount.edit(langStatus[0].data.phrases.total)
                        }
                    })
            })
    } catch (error) { throw error }
}
