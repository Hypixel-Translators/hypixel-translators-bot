import { loadingColor, errorColor, successColor } from "../config.json"
import Discord from "discord.js"
import fetch from "node-fetch"
import { HTBClient } from "../lib/dbclient"
import { db } from "../lib/dbclient"
import { ObjectId } from "mongodb"
const settings = { headers: { "Content-Type": "application/json", "Authorization": "Bearer " + process.env.CTOKEN_V2, "User-Agent": "Hypixel Translators Bot" }, timeout: 10000 }

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
        .then(async json => {
            if (!json.data) throw `We got no data from the API when trying to update Hypixel! Here's the response:\n${json}`
            const langStatus: LanguageStatus[] = json.data.map((status: LanguageStatus) => {
                status.data.language = langdb.find(l => l.code === status.data.languageId || l.id === status.data.languageId)
                return status
            }).sort((a: LanguageStatus, b: LanguageStatus) => b.data.phrases.total - a.data.phrases.total)
            const sortedSatus = Array.from(langStatus).sort((currentStatus: LanguageStatus, nextStatus: LanguageStatus) => {
                return nextStatus.data.language.name.localeCompare(currentStatus.data.language.name)
            })
            const channel = client.channels.cache.find(channel => (channel as Discord.TextChannel).name === "hypixel-language-status") as Discord.TextChannel
            channel.messages.fetch()
                .then(messages => {
                    let index = 0
                    const fiMessages = messages.filter(msg => msg.author.id === client.user!.id)
                    fiMessages.forEach(async msg => {
                        const langData = sortedSatus[index].data

                        const embed = new Discord.MessageEmbed()
                            .setColor(langData.language.colour!)
                            .setTitle(`${langData.language.emoji} | ${langData.language.name}` || "<:icon_question:756582065834688662>" + " | " + langData.language.name)
                            .setThumbnail("https://crowdin.com/images/flags/" + langData.languageId + ".png")
                            .setDescription(`**${langData.translationProgress}% translated (${langData.phrases.translated}/${langData.phrases.total} strings)**\n${langData.approvalProgress}% approved (${langData.phrases.approved}/${langData.phrases.total} strings)\n\nTranslate at https://crowdin.com/translate/hypixel/all/en-${langData.language.code}`)
                            .setFooter("Last update")
                            .setTimestamp()
                        index++
                        await msg.edit({ content: null, embeds: [embed] })
                    })
                })
            const { stringCount } = await db.collection("crowdin").findOne({ project: "hypixel" }) as StringCount
            if (stringCount != langStatus[0].data.phrases.total) {
                const hypixelTranslators = client.channels.cache.get("549503328472530976") as Discord.TextChannel,
                    stringDiff = Math.abs(langStatus[0].data.phrases.total - stringCount)
                if (stringCount < langStatus[0].data.phrases.total)
                    await hypixelTranslators.send(`> <a:partyBlob:769679132317057064> **New ${stringDiff == 1 ? "String" : "Strings"}!**\n${stringDiff} ${stringDiff == 1 ? "string has" : "strings have"} been added to the Hypixel project.\n\nTranslate at <https://crowdin.com/translate/hypixel/all/en>`)
                else if (stringCount > langStatus[0].data.phrases.total)
                    await hypixelTranslators.send(`> <:vote_no:732298639736570007> **${stringDiff == 1 ? "String" : "Strings"} Removed**\n${stringDiff} ${stringDiff == 1 ? "string has" : "strings have"} been removed from the Hypixel project.`)
                await db.collection("crowdin").updateOne({ project: "hypixel" }, { $set: { stringCount: langStatus[0].data.phrases.total } })
            }
        })
        .catch(err => console.error(`Crowdin API is down, couldn't update Hypixel language statistics. Here's the error:\n${err.stack}`))
}

export async function quickplay(client: HTBClient) {
    const langdb = await db.collection("langdb").find().toArray()
    fetch("https://api.crowdin.com/api/v2/projects/369653/languages/progress?limit=500", settings)
        .then(res => res.json())
        .then(async json => {
            if (!json.data) throw `We got no data from the API when trying to update Quickplay! Here's the response:\n${json}`
            const langStatus: LanguageStatus[] = json.data.map((status: LanguageStatus) => {
                status.data.language = langdb.find((l: LangDbEntry) => l.code === status.data.languageId || l.id === status.data.languageId)
                return status
            }).sort((a: LanguageStatus, b: LanguageStatus) => b.data.phrases.total - a.data.phrases.total)
            const sortedStatus = Array.from(langStatus).sort((currentStatus: LanguageStatus, nextStatus: LanguageStatus) => {
                return nextStatus.data.language.name.localeCompare(currentStatus.data.language.name)
            })
            const channel = client.channels.cache.find(channel => (channel as Discord.TextChannel).name === "quickplay-language-status") as Discord.TextChannel
            channel.messages.fetch()
                .then(messages => {
                    let index = 0
                    const fiMessages = messages.filter(msg => msg.author.id === client.user!.id)
                    fiMessages.forEach(async (msg: Discord.Message) => {
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
                            .setFooter("Last update")
                            .setTimestamp()
                        index++
                        await msg.edit({ content: null, embeds: [embed] })
                    })
                })
            const { stringCount } = await db.collection("crowdin").findOne({ project: "quickplay" }) as StringCount
            if (stringCount != langStatus[0].data.phrases.total) {
                const quickplayTranslators = client.channels.cache.get("646383292010070016") as Discord.TextChannel,
                    stringDiff = Math.abs(langStatus[0].data.phrases.total - stringCount)
                if (stringCount < langStatus[0].data.phrases.total)
                    await quickplayTranslators.send(`> <a:partyBlob:769679132317057064> **New ${stringDiff == 1 ? "String" : "Strings"}!**\n${stringDiff} ${stringDiff == 1 ? "string has" : "strings have"} been added to the Quickplay project.\n\nTranslate at <https://crowdin.com/translate/quickplay/all/en>`)
                else if (stringCount > langStatus[0].data.phrases.total)
                    await quickplayTranslators.send(`> <:vote_no:732298639736570007> **${stringDiff == 1 ? "String" : "Strings"} Removed**\n${stringDiff} ${stringDiff == 1 ? "string has" : "strings have"} been removed from the Quickplay project.`)
                await db.collection("crowdin").updateOne({ project: "quickplay" }, { $set: { stringCount: langStatus[0].data.phrases.total } })
            }
        })
        .catch(err => console.error(`Crowdin API is down, couldn't update Quickplay language statistics. Here's the error:\n${err.stack}`))
}

export async function bot(client: HTBClient) {
    const langdb = await db.collection("langdb").find().toArray()
    fetch("https://api.crowdin.com/api/v2/projects/436418/languages/progress?limit=500", settings)
        .then(res => res.json())
        .then(async json => {
            if (!json.data) throw `We got no data from the API when trying to update the Bot! Here's the response:\n${json}`
            const langStatus: LanguageStatus[] = json.data.map((status: LanguageStatus) => {
                status.data.language = langdb.find(l => l.code === status.data.languageId || l.id === status.data.languageId)
                return status
            }).sort((a: LanguageStatus, b: LanguageStatus) => b.data.phrases.total - a.data.phrases.total)
            const sortedStatus = Array.from(langStatus).sort((currentStatus: LanguageStatus, nextStatus: LanguageStatus) => {
                return nextStatus.data.language.name.localeCompare(currentStatus.data.language.name)
            })
            const channel = client.channels.cache.find(channel => (channel as Discord.TextChannel).name === "bot-language-status") as Discord.TextChannel
            channel.messages.fetch()
                .then(messages => {
                    let index = 0
                    const fiMessages = messages.filter(msg => msg.author.id === client.user!.id)
                    fiMessages.forEach(async msg => {
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
                            .setFooter("Last update")
                            .setTimestamp()
                        index++
                        await msg.edit({ content: null, embeds: [embed] })
                    })
                })
            const { stringCount } = await db.collection("crowdin").findOne({ project: "bot" }) as StringCount
            if (stringCount != langStatus[0].data.phrases.total) {
                const botTranslators = client.channels.cache.get("749391414600925335") as Discord.TextChannel,
                    stringDiff = Math.abs(langStatus[0].data.phrases.total - stringCount)
                if (stringCount < langStatus[0].data.phrases.total)
                    await botTranslators.send(`> <a:partyBlob:769679132317057064> **New ${stringDiff == 1 ? "String" : "Strings"}!**\n${stringDiff} ${stringDiff == 1 ? "string has" : "strings have"} been added to the Hypixel Translators Bot project.\n\nTranslate at <https://crowdin.com/translate/hypixel-translators-bot/all/en>`)
                else if (stringCount > langStatus[0].data.phrases.total)
                    await botTranslators.send(`> <:vote_no:732298639736570007> **${stringDiff == 1 ? "String" : "Strings"} Removed**\n${stringDiff} ${stringDiff == 1 ? "string has" : "strings have"} been removed from the Hypixel Translators Bot project.`)
                await db.collection("crowdin").updateOne({ project: "bot" }, { $set: { stringCount: langStatus[0].data.phrases.total } })
            }
        })
        .catch(err => console.error(`Crowdin API is down, couldn't update Bot language statistics. Here's the error:\n${err.stack}`))
}

export async function skyblockaddons(client: HTBClient) {
    const langdb = await db.collection("langdb").find().toArray()
    fetch("https://api.crowdin.com/api/v2/projects/369493/languages/progress?limit=500", settings)
        .then(res => res.json())
        .then(async json => {
            if (!json.data) throw `We got no data from the API when trying to update SkyblockAddons! Here's the response:\n${json}`
            const langStatus: LanguageStatus[] = json.data.map((status: LanguageStatus) => {
                status.data.language = langdb.find((l: LangDbEntry) => l.code === status.data.languageId || l.id === status.data.languageId)
                return status
            }).sort((a: LanguageStatus, b: LanguageStatus) => b.data.phrases.total - a.data.phrases.total)
            const sortedStatus = Array.from(langStatus).sort((currentStatus: LanguageStatus, nextStatus: LanguageStatus) => {
                return nextStatus.data.language.name.localeCompare(currentStatus.data.language.name)
            })
            const channel = client.channels.cache.find(channel => (channel as Discord.TextChannel).name === "sba-language-status") as Discord.TextChannel
            channel.messages.fetch()
                .then(messages => {
                    let index = 0
                    const fiMessages = messages.filter(msg => msg.author.id === client.user!.id)
                    fiMessages.forEach(async msg => {
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
                            .setFooter("Last update")
                            .setTimestamp()
                        index++
                        await msg.edit({ content: null, embeds: [embed] })
                    })
                })
            const { stringCount } = await db.collection("crowdin").findOne({ project: "sba" }) as StringCount
            if (stringCount != langStatus[0].data.phrases.total) {
                const sbaTranslators = client.channels.cache.get("549503328472530976") as Discord.TextChannel,
                    stringDiff = Math.abs(langStatus[0].data.phrases.total - stringCount)
                if (stringCount < langStatus[0].data.phrases.total)
                    await sbaTranslators.send(`> <a:partyBlob:769679132317057064> **New ${stringDiff == 1 ? "String" : "Strings"}!**\n${stringDiff} ${stringDiff == 1 ? "string has" : "strings have"} been added to the SkyblockAddons project.\n\nTranslate at <https://crowdin.com/translate/skyblockaddons/all/en>`)
                else if (stringCount > langStatus[0].data.phrases.total)
                    await sbaTranslators.send(`> <:vote_no:732298639736570007> **${stringDiff == 1 ? "String" : "Strings"} Removed**\n${stringDiff} ${stringDiff == 1 ? "string has" : "strings have"} been removed from the SkyblockAddons project.`)
                await db.collection("crowdin").updateOne({ project: "sba" }, { $set: { stringCount: langStatus[0].data.phrases.total } })
            }
        })
        .catch(err => console.error(`Crowdin API is down, couldn't update SkyblockAddons language statistics. Here's the error:\n${err.stack}`))
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

interface StringCount {
    _id: ObjectId
    project: string
    stringCount: number
}

export default execute

