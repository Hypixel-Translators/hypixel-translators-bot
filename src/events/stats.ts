import { loadingColor, errorColor, successColor } from "../config.json"
import Discord from "discord.js"
import fetch from "node-fetch"
import { HTBClient } from "../lib/dbclient"
import { db } from "../lib/dbclient"
import { ObjectId } from "mongodb"
const settings = { headers: { "Content-Type": "application/json", "Authorization": "Bearer " + process.env.CTOKEN_API_V2, "User-Agent": "Hypixel Translators Bot" }, timeout: 10000 }

export async function execute(client: HTBClient, manual: boolean) {
    try {
        const d = new Date()
        const m = d.getMinutes()
        if (m == 0 || m == 20 || m == 40) {
            await hypixel(client)
            await skyblockaddons(client)
        }
        if (m == 10 || m == 30 || m == 50) {
            await quickplay(client)
            await bot(client)
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

export async function hypixel(client: HTBClient) {
    const langdb = await db.collection("langdb").find().toArray()
    fetch("https://api.crowdin.com/api/v2/projects/128098/languages/progress?limit=500", settings)
        .then(res => res.json())
        .then(json => {
            const langStatus: LanguageStatus[] = json.data.map((status: LanguageStatus) => {
                status.data.language = langdb.find(l => l.code === status.data.languageId || l.id === status.data.languageId)
                return status
            })
            const sortedSatus = Array.from(langStatus).sort((currentStatus: LanguageStatus, nextStatus: LanguageStatus) => {
                return nextStatus.data.language.name.localeCompare(currentStatus.data.language.name)
            })
            const channel = client.channels.cache.find(channel => (channel as Discord.TextChannel).name === "hypixel-language-status") as Discord.TextChannel
            channel.messages.fetch()
                .then((messages: Discord.Collection<Discord.Snowflake, Discord.Message>) => {
                    let index = 0
                    const fiMessages = messages.filter(msg => msg.author === client.user)
                    fiMessages.forEach(msg => {
                        const langData = sortedSatus[index].data

                        const embed = new Discord.MessageEmbed()
                            .setColor(langData.language.colour!)
                            .setTitle(`${langData.language.emoji} | ${langData.language.name}` || "<:icon_question:756582065834688662>" + " | " + langData.language.name)
                            .setThumbnail("https://crowdin.com/images/flags/" + langData.languageId + ".png")
                            .setDescription(`**${langData.translationProgress}% translated (${langData.phrases.translated}/${langData.phrases.total} strings)**\n${langData.approvalProgress}% approved (${langData.phrases.approved}/${langData.phrases.total} strings)\n\nTranslate at https://crowdin.com/translate/hypixel/all/en-${langData.language.code}`)
                            .setTimestamp()
                        msg.edit("", embed)
                        index++
                    })
                })
            const botDev = client.channels.cache.get("730042612647723058") as Discord.TextChannel
            botDev.messages.fetch("782637177552240661") //bot development Hypixel string count
                .then((stringCount: Discord.Message) => {
                    if (Number(stringCount.content) != langStatus[0].data.phrases.total) {
                        const hypixelTranslators = client.channels.cache.get("549503328472530976") as Discord.TextChannel
                        const stringDiff = Math.abs(Number(Number(langStatus[0].data.phrases.total) - Number(stringCount.content)))
                        if (Number(stringCount.content) < langStatus[0].data.phrases.total) {
                            if (stringDiff == 1) hypixelTranslators.send("> <a:partyBlob:769679132317057064> **New String!**\n" + stringDiff + " string has been added to the Hypixel project.\n\nTranslate at <https://crowdin.com/translate/hypixel/all/en>")
                            else hypixelTranslators.send("> <a:partyBlob:769679132317057064> **New Strings!**\n" + stringDiff + " strings have been added to the Hypixel project.\n\nTranslate at <https://crowdin.com/translate/hypixel/all/en>")
                        } else if (Number(stringCount.content) > langStatus[0].data.phrases.total) {
                            if (stringDiff == 1) hypixelTranslators.send("> <:vote_no:732298639736570007> **String Removed**\n" + stringDiff + " string has been removed from the Hypixel project.")
                            else hypixelTranslators.send("> <:vote_no:732298639736570007> **Strings Removed**\n" + stringDiff + " strings have been removed from the Hypixel project.")
                        }
                        stringCount.edit(langStatus[0].data.phrases.total)
                    }
                })
        })
}

export async function quickplay(client: HTBClient) {
    const langdb = await db.collection("langdb").find().toArray()
    fetch("https://api.crowdin.com/api/v2/projects/369653/languages/progress?limit=500", settings)
        .then(res => res.json())
        .then(json => {
            const langStatus: LanguageStatus[] = json.data.map((status: LanguageStatus) => {
                status.data.language = langdb.find((l: LangDbEntry) => l.code === status.data.languageId || l.id === status.data.languageId)
                return status
            })
            const sortedStatus = Array.from(langStatus).sort((currentStatus: LanguageStatus, nextStatus: LanguageStatus) => {
                return nextStatus.data.language.name.localeCompare(currentStatus.data.language.name)
            })
            const channel = client.channels.cache.find(channel => (channel as Discord.TextChannel).name === "quickplay-language-status") as Discord.TextChannel
            channel.messages.fetch()
                .then((messages: Discord.Collection<Discord.Snowflake, Discord.Message>) => {
                    let index = 0
                    const fiMessages = messages.filter(msg => msg.author === client.user)
                    fiMessages.forEach((msg: Discord.Message) => {
                        const langData = sortedStatus[index].data

                        let adapColour: string
                        if (langData.approvalProgress > 89) adapColour = successColor
                        else if (langData.approvalProgress > 49) adapColour = loadingColor
                        else adapColour = errorColor

                        const embed = new Discord.MessageEmbed()
                            .setColor(adapColour)
                            .setTitle(`${langData.language.emoji} | ${langData.language.name}` || "<:icon_question:756582065834688662>" + " | " + langData.language.name)
                            .setThumbnail("https://crowdin.com/images/flags/" + langData.languageId + ".png")
                            .setDescription(`**${langData.translationProgress}% translated (${langData.phrases.translated}/${langData.phrases.total} strings)**\n${langData.approvalProgress}% approved (${langData.phrases.approved}/${langData.phrases.total} strings)\n\nTranslate at https://crowdin.com/translate/quickplay/all/en-${langData.language.code}`)
                            .setTimestamp()
                        msg.edit("", embed)
                        index++
                    })
                })
            const botDev = client.channels.cache.get("730042612647723058") as Discord.TextChannel
            botDev.messages.fetch("782637234322931733") //bot-development Quickplay string count
                .then((stringCount: Discord.Message) => {
                    if (Number(stringCount.content) != langStatus[0].data.phrases.total) {
                        const qpTranslators = client.channels.cache.get("646383292010070016") as Discord.TextChannel
                        const stringDiff = Math.abs(Number(Number(langStatus[0].data.phrases.total) - Number(stringCount.content)))
                        if (Number(stringCount.content) < langStatus[0].data.phrases.total) {
                            if (stringDiff == 1) qpTranslators.send("> <a:partyBlob:769679132317057064> **New String!**\n" + stringDiff + " string has been added to the Quickplay project.\n\nTranslate at <https://crowdin.com/translate/quickplay/all/en>")
                            else qpTranslators.send("> <a:partyBlob:769679132317057064> **New Strings!**\n" + stringDiff + " strings have been added to the Quickplay project.\n\nTranslate at <https://crowdin.com/translate/quickplay/all/en>")
                        } else if (Number(stringCount.content) > langStatus[0].data.phrases.total) {
                            if (stringDiff == 1) qpTranslators.send("> <:vote_no:732298639736570007> **String Removed**\n" + stringDiff + " string has been removed from the Quickplay project.")
                            else qpTranslators.send("> <:vote_no:732298639736570007> **Strings Removed**\n" + stringDiff + " strings have been removed from the Quickplay project.")
                        }
                        stringCount.edit(langStatus[0].data.phrases.total)
                    }
                })
        })
}

export async function bot(client: HTBClient) {
    const langdb = await db.collection("langdb").find().toArray()
    fetch("https://api.crowdin.com/api/v2/projects/436418/languages/progress?limit=500", settings)
        .then(res => res.json())
        .then(json => {
            const langStatus: LanguageStatus[] = json.data.map((status: LanguageStatus) => {
                status.data.language = langdb.find(l => l.code === status.data.languageId || l.id === status.data.languageId)
                return status
            })
            const sortedStatus = Array.from(langStatus).sort((currentStatus: LanguageStatus, nextStatus: LanguageStatus) => {
                return nextStatus.data.language.name.localeCompare(currentStatus.data.language.name)
            })
            const channel = client.channels.cache.find(channel => (channel as Discord.TextChannel).name === "bot-language-status") as Discord.TextChannel
            channel.messages.fetch()
                .then((messages: Discord.Collection<Discord.Snowflake, Discord.Message>) => {
                    let index = 0
                    const fiMessages = messages.filter(msg => msg.author === client.user)
                    fiMessages.forEach(msg => {
                        const langData = sortedStatus[index].data

                        let adapColour: string
                        if (langData.approvalProgress > 89) adapColour = successColor
                        else if (langData.approvalProgress > 49) adapColour = loadingColor
                        else adapColour = errorColor

                        const embed = new Discord.MessageEmbed()
                            .setColor(adapColour)
                            .setTitle(`${langData.language.emoji} | ${langData.language.name}` || "<:icon_question:756582065834688662>" + " | " + langData.language.name)
                            .setThumbnail((langData.language.flag))
                            .setDescription(`**${langData.translationProgress}% translated (${langData.phrases.translated}/${langData.phrases.total} strings)**\n${langData.approvalProgress}% approved (${langData.phrases.approved}/${langData.phrases.total} strings)\n\nTranslate at https://crowdin.com/translate/hypixel-translators-bot/all/en-${langData.language.code}`)
                            .setTimestamp()
                        msg.edit("", embed)
                        index++
                    })
                })
            const botDev = client.channels.cache.get("730042612647723058") as Discord.TextChannel
            botDev.messages.fetch("782637303427497994") //bot-development Bot string count
                .then((stringCount: Discord.Message) => {
                    if (Number(stringCount.content) != langStatus[0].data.phrases.total) {
                        const botTranslators = client.channels.cache.get("749391414600925335") as Discord.TextChannel
                        const stringDiff = Math.abs(Number(Number(langStatus[0].data.phrases.total) - Number(stringCount.content)))
                        if (Number(stringCount.content) < langStatus[0].data.phrases.total) {
                            if (stringDiff == 1) botTranslators.send("> <a:partyBlob:769679132317057064> **New String!**\n" + stringDiff + " string has been added to the Hypixel Translators Bot project.\n\nTranslate at <https://crowdin.com/translate/hypixel-translators-bot/all/en>")
                            else botTranslators.send("> <a:partyBlob:769679132317057064> **New Strings!**\n" + stringDiff + " strings have been added to the Hypixel Translators Bot project.\n\nTranslate at <https://crowdin.com/translate/hypixel-translators-bot/all/en>")
                        } else if (Number(stringCount.content) > langStatus[0].data.phrases.total) {
                            if (stringDiff == 1) botTranslators.send("> <:vote_no:732298639736570007> **String Removed**\n" + stringDiff + " string has been removed from the Hypixel Translators Bot project.")
                            else botTranslators.send("> <:vote_no:732298639736570007> **Strings Removed**\n" + stringDiff + " strings have been removed from the Hypixel Translators Bot project.")
                        }
                        stringCount.edit(langStatus[0].data.phrases.total)
                    }
                })
        })
}

export async function skyblockaddons(client: HTBClient) {
    const langdb = await db.collection("langdb").find().toArray()
    fetch("https://api.crowdin.com/api/v2/projects/369493/languages/progress?limit=500", settings)
        .then(res => res.json())
        .then(json => {
            const langStatus: LanguageStatus[] = json.data.map((status: LanguageStatus) => {
                status.data.language = langdb.find((l: LangDbEntry) => l.code === status.data.languageId || l.id === status.data.languageId)
                return status
            })
            const sortedStatus = Array.from(langStatus).sort((currentStatus: LanguageStatus, nextStatus: LanguageStatus) => {
                return nextStatus.data.language.name.localeCompare(currentStatus.data.language.name)
            })
            const channel = client.channels.cache.find(channel => (channel as Discord.TextChannel).name === "sba-language-status") as Discord.TextChannel
            channel.messages.fetch()
                .then((messages: Discord.Collection<Discord.Snowflake, Discord.Message>) => {
                    let index = 0
                    const fiMessages = messages.filter(msg => msg.author === client.user)
                    fiMessages.forEach(msg => {
                        const langData = sortedStatus[index].data

                        let adapColour: string
                        if (langData.approvalProgress > 89) adapColour = successColor
                        else if (langData.approvalProgress > 49) adapColour = loadingColor
                        else adapColour = errorColor

                        const embed = new Discord.MessageEmbed()
                            .setColor(adapColour)
                            .setTitle(`${langData.language.emoji} | ${langData.language.name}`)
                            .setDescription(`**${langData.translationProgress}% translated (${langData.phrases.translated}/${langData.phrases.total} strings)**\n${langData.approvalProgress}% approved (${langData.phrases.approved}/${langData.phrases.total} strings)\n\nTranslate at https://crowdin.com/translate/skyblockaddons/all/en-${langData.language.code}`)
                            .setThumbnail((langData.language.flag))
                            .setTimestamp()
                        msg.edit("", embed)
                        index++
                    })
                })
            const botDev = client.channels.cache.get("730042612647723058") as Discord.TextChannel
            botDev.messages.fetch("782637265230626836") //bot-development Sba string count
                .then((stringCount: Discord.Message) => {
                    if (Number(stringCount.content) != langStatus[0].data.phrases.total) {
                        const sbaTranslators = client.channels.cache.get("748594964476329994") as Discord.TextChannel
                        const stringDiff = Math.abs(Number(Number(langStatus[0].data.phrases.total) - Number(stringCount.content)))
                        if (Number(stringCount.content) < langStatus[0].data.phrases.total) {
                            if (stringDiff == 1) sbaTranslators.send("> <a:partyBlob:769679132317057064> **New String!**\n" + stringDiff + " string has been added to the SkyblockAddons project.\n\nTranslate at <https://crowdin.com/translate/skyblockaddons/all/en>")
                            else sbaTranslators.send("> <a:partyBlob:769679132317057064> **New Strings!**\n" + stringDiff + " strings have been added to the SkyblockAddons project.\n\nTranslate at <https://crowdin.com/translate/skyblockaddons/all/en>")
                        } else if (Number(stringCount.content) > langStatus[0].data.phrases.total) {
                            if (stringDiff == 1) sbaTranslators.send("> <:vote_no:732298639736570007> **String Removed**\n" + stringDiff + " string has been removed from the SkyblockAddons project.")
                            else sbaTranslators.send("> <:vote_no:732298639736570007> **Strings Removed**\n" + stringDiff + " strings have been removed from the SkyblockAddons project.")
                        }
                        stringCount.edit(langStatus[0].data.phrases.total)
                    }
                })
        })
}

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
        language: LangDbEntry
    },
}

export interface LangDbEntry {
    _id: ObjectId,
    name: string,
    emoji: string,
    colour?: string,
    code: string,
    id: string
    flag: string
}

export default execute

