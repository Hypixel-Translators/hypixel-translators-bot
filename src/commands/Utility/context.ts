import { loadingColor, errorColor, successColor, neutralColor } from "../../config.json"
import Discord from "discord.js"
import { GoogleSpreadsheet, ServiceAccountCredentials } from "google-spreadsheet"
import { Command } from "../../lib/dbclient"
const creds = { "type": process.env.type, "project_id": process.env.project_id, "private_key_id": process.env.private_key_id, "private_key": process.env.private_key!.replace(/\\n/gm, "\n"), "client_email": process.env.client_email, "client_id": process.env.client_id, "auth_uri": process.env.auth_uri, "token_uri": process.env.token_uri, "auth_provider_x509_cert_url": process.env.auth_provider_x509_cert_url, "client_x509_cert_url": process.env.client_x509_cert_url } as ServiceAccountCredentials,
    contextSheet = process.env.context

const command: Command = {
    name: "context",
    description: "Gets, adds or edits context for the given string ID. `+context help` shows you information about this command.",
    usage: "+context get|add|edit|link|help <arguments>",
    roleWhitelist: ["569839580971401236", "569839517444341771"],
    channelBlacklist: ["621298919535804426", "619662798133133312", "712046319375482910", "801904400826105876", "550951034332381184", "713084081579098152"], //off-topic memes pets food suggestions no-mic
    cooldown: 30,
    async execute(message: Discord.Message, args: string[], getString: (path: string, cmd?: string, lang?: string) => any) {
        const executedBy = getString("executedBy", "global").replace("%%user%%", message.author.tag)
        if (!args[0]) throw "contextSubArg"
        const subCmd = args[0].toLowerCase()
        try {
            if (subCmd === "add" || subCmd === "new") await addToSpreadsheet(executedBy, message, getString, args)
            else if (subCmd === "get" || subCmd === "show") await getFromSpreadsheet(executedBy, message, getString, args)
            else if (subCmd === "edit") await editInSpreadsheet(executedBy, message, getString, args)
            else if (subCmd === "help" || subCmd === "info") await showInfo(executedBy, message, getString)
            else if (subCmd === "link" || subCmd === "sheet" || subCmd === "list") await sheetLink(executedBy, message, getString)
            else throw "contextSubArg"
        } catch (err) { throw err }
    }
}

async function getFromSpreadsheet(executedBy: string, message: Discord.Message, getString: (path: string, cmd?: string, lang?: string) => any, args: string[]) {
    message.channel.startTyping()
    const string = args[1]
    const doc = new GoogleSpreadsheet(contextSheet!)
    await doc.useServiceAccountAuth(creds)

    await doc.loadInfo()

    const sheet = doc.sheetsByIndex[0]

    const rows = await sheet.getRows()
    const correctRow = rows.find(r => r.id === string)

    if (!correctRow) {
        message.channel.stopTyping()
        return message.channel.send(getString("errors.notFound"))
            .then(msg => setTimeout(() => {
                if (!msg.deleted) msg.delete()
                if (!message.deleted) message.delete()
            }, 10000))
    }
    const embed = new Discord.MessageEmbed()
        .setColor(successColor)
        .setAuthor(getString("moduleName"))
        .setTitle(getString("contextFor") + string)
        .setDescription(correctRow.context)
        .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
    if (correctRow.bg) { if (correctRow.bg.length > 1) { embed.addFields({ name: getString("noteFor") + getString("bulgarian"), value: correctRow.bg, inline: true }) } }
    if (correctRow.zhcn) { if (correctRow.zhcn.length > 1) { embed.addFields({ name: getString("noteFor") + getString("chineseS"), value: correctRow.zhcn, inline: true }) } }
    if (correctRow.zhtw) { if (correctRow.zhtw.length > 1) { embed.addFields({ name: getString("noteFor") + getString("chineseT"), value: correctRow.zhtw, inline: true }) } }
    if (correctRow.cs) { if (correctRow.cs.length > 1) { embed.addFields({ name: getString("noteFor") + getString("czech"), value: correctRow.cs, inline: true }) } }
    if (correctRow.da) { if (correctRow.da.length > 1) { embed.addFields({ name: getString("noteFor") + getString("danish"), value: correctRow.da, inline: true }) } }
    if (correctRow.nl) { if (correctRow.nl.length > 1) { embed.addFields({ name: getString("noteFor") + getString("dutch"), value: correctRow.nl, inline: true }) } }
    if (correctRow.fi) { if (correctRow.fi.length > 1) { embed.addFields({ name: getString("noteFor") + getString("finnish"), value: correctRow.fi, inline: true }) } }
    if (correctRow.fr) { if (correctRow.fr.length > 1) { embed.addFields({ name: getString("noteFor") + getString("french"), value: correctRow.fr, inline: true }) } }
    if (correctRow.de) { if (correctRow.de.length > 1) { embed.addFields({ name: getString("noteFor") + getString("german"), value: correctRow.de, inline: true }) } }
    if (correctRow.el) { if (correctRow.el.length > 1) { embed.addFields({ name: getString("noteFor") + getString("greek"), value: correctRow.el, inline: true }) } }
    if (correctRow.it) { if (correctRow.it.length > 1) { embed.addFields({ name: getString("noteFor") + getString("italian"), value: correctRow.it, inline: true }) } }
    if (correctRow.ja) { if (correctRow.ja.length > 1) { embed.addFields({ name: getString("noteFor") + getString("japanese"), value: correctRow.ja, inline: true }) } }
    if (correctRow.ko) { if (correctRow.ko.length > 1) { embed.addFields({ name: getString("noteFor") + getString("korean"), value: correctRow.ko, inline: true }) } }
    if (correctRow.ms) { if (correctRow.ms.length > 1) { embed.addFields({ name: getString("noteFor") + getString("malay"), value: correctRow.ms, inline: true }) } }
    if (correctRow.no) { if (correctRow.no.length > 1) { embed.addFields({ name: getString("noteFor") + getString("norwegian"), value: correctRow.no, inline: true }) } }
    if (correctRow.enpt) { if (correctRow.enpt.length > 1) { embed.addFields({ name: getString("noteFor") + getString("pirate"), value: correctRow.enpt, inline: true }) } }
    if (correctRow.pl) { if (correctRow.pl.length > 1) { embed.addFields({ name: getString("noteFor") + getString("polish"), value: correctRow.pl, inline: true }) } }
    if (correctRow.pt) { if (correctRow.pt.length > 1) { embed.addFields({ name: getString("noteFor") + getString("portuguese"), value: correctRow.pt, inline: true }) } }
    if (correctRow.ptbr) { if (correctRow.ptbr.length > 1) { embed.addFields({ name: getString("noteFor") + getString("portugueseBr"), value: correctRow.ptbr, inline: true }) } }
    if (correctRow.ru) { if (correctRow.ru.length > 1) { embed.addFields({ name: getString("noteFor") + getString("russian"), value: correctRow.ru, inline: true }) } }
    if (correctRow.es) { if (correctRow.es.length > 1) { embed.addFields({ name: getString("noteFor") + getString("spanish"), value: correctRow.es, inline: true }) } }
    if (correctRow.sv) { if (correctRow.sv.length > 1) { embed.addFields({ name: getString("noteFor") + getString("swedish"), value: correctRow.sv, inline: true }) } }
    if (correctRow.th) { if (correctRow.th.length > 1) { embed.addFields({ name: getString("noteFor") + getString("thai"), value: correctRow.th, inline: true }) } }
    if (correctRow.tr) { if (correctRow.tr.length > 1) { embed.addFields({ name: getString("noteFor") + getString("turkish"), value: correctRow.tr, inline: true }) } }
    if (correctRow.uk) { if (correctRow.uk.length > 1) { embed.addFields({ name: getString("noteFor") + getString("ukrainian"), value: correctRow.uk, inline: true }) } }
    if (correctRow.screenshot) {
        if (/(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/.test(correctRow.screenshot)) embed.setImage(correctRow.screenshot)
        embed.addFields({ name: getString("screenshot"), value: correctRow.screenshot })
    }
    message.channel.stopTyping()
    message.channel.send(embed)
}

async function addToSpreadsheet(executedBy: string, message: Discord.Message, getString: (path: string, cmd?: string, lang?: string) => any, args: string[]) {
    message.channel.startTyping()
    const string = args[1]
    let toSend = [...args]
    toSend.splice(0, 2)
    const context = toSend.join(" ")

    if (!context || !string) throw "noContext"

    if (!message.member!.roles.cache.has("569839580971401236") && !message.member!.hasPermission("MANAGE_ROLES")) { //Hypixel Proofreader
        const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setAuthor(getString("moduleName"))
            .setTitle(getString("addContextFor") + string)
            .setDescription(getString("notProofreader"))
            .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
        message.channel.stopTyping()
        return message.channel.send(embed)
    }

    const doc = new GoogleSpreadsheet(contextSheet!)
    await doc.useServiceAccountAuth(creds)

    await doc.loadInfo()

    const sheet = doc.sheetsByIndex[0]
    const noEmoji = "732298639736570007"
    const yesEmoji = "732298639749152769"

    const rows = await sheet.getRows()
    const correctRow = rows.find(r => r.id === string)
    if (correctRow) {
        const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setAuthor(getString("moduleName"))
            .setTitle(getString("addContextFor") + string)
            .setDescription(getString("errors.exists1") + string + getString("errors.exists2"))
            .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
        message.channel.stopTyping()
        return message.channel.send(embed)
    }

    let toAdd: {
        [key: string]: string
    } = { id: string, context: context }
    const embed = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setAuthor(getString("moduleName"))
        .setTitle(getString("addContextFor") + string)
        .setDescription(getString("willAdd").replace("%%voteNo%%", "<:vote_no:732298639736570007>").replace("%%voteYes%%", "<:vote_yes:732298639749152769>"))
        .addFields(
            { name: getString("stringId"), value: string },
            { name: getString("moduleName"), value: context }
        )
        .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
    message.channel.stopTyping()
    message.channel.send(embed)
        .then(async msg => {
            msg.react("📑").then(() => { msg.react(yesEmoji).then(() => { msg.react(noEmoji) }) })
            const filter = (reaction: Discord.MessageReaction, reacter: Discord.User) => {
                return (reaction.emoji.name === "📑" || reaction.emoji.id === yesEmoji || reaction.emoji.id === noEmoji) && reacter.id === message.author.id
            }

            const reactionCollector = msg.createReactionCollector(filter, { time: 120000 })

            let extraMsgs: Discord.Message[]
            let extraReceiveds: Discord.Message[]

            reactionCollector.on("collect", async reaction => {
                if (reaction.emoji.name === "📑") {
                    reaction.users.remove(message.author.id)
                    const messageCollector = new Discord.MessageCollector(<Discord.TextChannel>message.channel, m => m.author.id === message.author.id, { time: 120000 })
                    const extraEmbed = new Discord.MessageEmbed()
                        .setColor(neutralColor)
                        .setAuthor(getString("moduleName"))
                        .setTitle(getString("addContextFor") + string)
                        .setDescription(getString("promptAddMore"))
                    msg.channel.send(extraEmbed).then(extraMsg => {

                        extraMsgs.push(extraMsg)

                        messageCollector.on("collect", received => {
                            messageCollector.stop()
                            extraReceiveds.push(received)
                            let key = received.toString().toLowerCase() as string
                            key = key.replace(/ .*/, "")
                            let value = received.toString()
                            value = value.substr(value.indexOf(" ") + 1)
                            toAdd[key] = value
                            const extraEmbed = new Discord.MessageEmbed()
                                .setColor(successColor)
                                .setAuthor(getString("moduleName"))
                                .setTitle(getString("addContextFor") + string)
                                .setDescription(getString("addedMore"))
                                .addFields({ name: key, value: value })
                            extraMsg.edit(extraEmbed)
                        })

                        messageCollector.on("end", function () {
                            const extraEmbed = new Discord.MessageEmbed()
                                .setColor(errorColor)
                                .setAuthor(getString("moduleName"))
                                .setTitle(getString("addContextFor") + string)
                                .setDescription(getString("errors.didntReply") + getString("errors.cancelledPrompt") + getString("errors.readdTryAgain"))
                            extraMsg.edit(extraEmbed)
                        })

                    })
                }
                if (reaction.emoji.name === "vote_yes") {
                    msg.reactions.removeAll()
                    const result = await sheet.addRow(toAdd)
                    const embed = new Discord.MessageEmbed()
                        .setColor(loadingColor)
                        .setAuthor(getString("moduleName"))
                        .setTitle(getString("addContextFor") + string)
                        .setDescription(getString("added"))
                        .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                    msg.channel.send(embed)
                        .then(finalMsg => {
                            if (!msg.deleted) msg.delete()
                            if (!result) throw "falseContext"

                            embed
                                .setColor(successColor)
                                .setAuthor(getString("moduleName"))
                                .setTitle(getString("addContextFor") + string)
                                .setDescription(getString("addedResult") + result.context)
                                .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                            if (result.bg) { if (result.bg.length > 1) { embed.addFields({ name: getString("noteFor") + getString("bulgarian"), value: result.bg, inline: true }) } }
                            if (result.zhcn) { if (result.zhcn.length > 1) { embed.addFields({ name: getString("noteFor") + getString("chineseS"), value: result.zhcn, inline: true }) } }
                            if (result.zhtw) { if (result.zhtw.length > 1) { embed.addFields({ name: getString("noteFor") + getString("chineseT"), value: result.zhtw, inline: true }) } }
                            if (result.cs) { if (result.cs.length > 1) { embed.addFields({ name: getString("noteFor") + getString("czech"), value: result.cs, inline: true }) } }
                            if (result.da) { if (result.da.length > 1) { embed.addFields({ name: getString("noteFor") + getString("danish"), value: result.da, inline: true }) } }
                            if (result.nl) { if (result.nl.length > 1) { embed.addFields({ name: getString("noteFor") + getString("dutch"), value: result.nl, inline: true }) } }
                            if (result.fi) { if (result.fi.length > 1) { embed.addFields({ name: getString("noteFor") + getString("finnish"), value: result.fi, inline: true }) } }
                            if (result.fr) { if (result.fr.length > 1) { embed.addFields({ name: getString("noteFor") + getString("french"), value: result.fr, inline: true }) } }
                            if (result.de) { if (result.de.length > 1) { embed.addFields({ name: getString("noteFor") + getString("german"), value: result.de, inline: true }) } }
                            if (result.el) { if (result.el.length > 1) { embed.addFields({ name: getString("noteFor") + getString("greek"), value: result.el, inline: true }) } }
                            if (result.it) { if (result.it.length > 1) { embed.addFields({ name: getString("noteFor") + getString("italian"), value: result.it, inline: true }) } }
                            if (result.ja) { if (result.ja.length > 1) { embed.addFields({ name: getString("noteFor") + getString("japanese"), value: result.ja, inline: true }) } }
                            if (result.ko) { if (result.ko.length > 1) { embed.addFields({ name: getString("noteFor") + getString("korean"), value: result.ko, inline: true }) } }
                            if (result.ms) { if (result.ms.length > 1) { embed.addFields({ name: getString("noteFor") + getString("malay"), value: result.ms, inline: true }) } }
                            if (result.no) { if (result.no.length > 1) { embed.addFields({ name: getString("noteFor") + getString("norwegian"), value: result.no, inline: true }) } }
                            if (result.enpt) { if (result.enpt.length > 1) { embed.addFields({ name: getString("noteFor") + getString("pirate"), value: result.enpt, inline: true }) } }
                            if (result.pl) { if (result.pl.length > 1) { embed.addFields({ name: getString("noteFor") + getString("polish"), value: result.pl, inline: true }) } }
                            if (result.pt) { if (result.pt.length > 1) { embed.addFields({ name: getString("noteFor") + getString("portuguese"), value: result.pt, inline: true }) } }
                            if (result.ptbr) { if (result.ptbr.length > 1) { embed.addFields({ name: getString("noteFor") + getString("portugueseBr"), value: result.ptbr, inline: true }) } }
                            if (result.ru) { if (result.ru.length > 1) { embed.addFields({ name: getString("noteFor") + getString("russian"), value: result.ru, inline: true }) } }
                            if (result.es) { if (result.es.length > 1) { embed.addFields({ name: getString("noteFor") + getString("spanish"), value: result.es, inline: true }) } }
                            if (result.sv) { if (result.sv.length > 1) { embed.addFields({ name: getString("noteFor") + getString("swedish"), value: result.sv, inline: true }) } }
                            if (result.th) { if (result.th.length > 1) { embed.addFields({ name: getString("noteFor") + getString("thai"), value: result.th, inline: true }) } }
                            if (result.tr) { if (result.tr.length > 1) { embed.addFields({ name: getString("noteFor") + getString("turkish"), value: result.tr, inline: true }) } }
                            if (result.uk) { if (result.uk.length > 1) { embed.addFields({ name: getString("noteFor") + getString("ukrainian"), value: result.uk, inline: true }) } }
                            if (result.screenshot) {
                                if (/(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/.test(result.screenshot)) embed.setImage(result.screenshot)
                                embed.addFields({ name: getString("screenshot"), value: result.screenshot })
                            }
                            finalMsg.edit(embed)
                            extraMsgs.forEach(item => {
                                if (!item.deleted) item.delete()
                            })
                            extraReceiveds.forEach(item => {
                                if (!item.deleted) item.delete()
                            })
                            console.log("Added a context entry for string " + string)
                        })
                }
                if (reaction.emoji.name === "vote_no") {
                    msg.reactions.removeAll()
                    const embed = new Discord.MessageEmbed()
                        .setColor(errorColor)
                        .setAuthor(getString("moduleName"))
                        .setTitle(getString("addContextFor") + string)
                        .setDescription(getString("errors.hitReaction").replace("%%voteNo%%", "<:vote_no:732298639736570007>") + getString("errors.cancelledPrompt"))
                        .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                    msg.edit(embed)
                    extraMsgs.forEach(item => {
                        if (!item.deleted) item.delete()
                    })
                    extraReceiveds.forEach(item => {
                        if (!item.deleted) item.delete()
                    })
                }

            })

            reactionCollector.on("end", () => {
                const embed = new Discord.MessageEmbed()
                    .setColor(errorColor)
                    .setAuthor(getString("moduleName"))
                    .setTitle(getString("addContextFor") + string)
                    .setDescription(getString("errors.hitReaction").replace("%%voteNo%%", "<:vote_no:732298639736570007>") + getString("errors.cancelledPrompt"))
                    .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                msg.edit(embed)
                extraMsgs.forEach(item => {
                    if (!item.deleted) item.delete()
                })
                extraReceiveds.forEach(item => {
                    if (!item.deleted) item.delete()
                })
                setTimeout(() => {
                    if (!msg.deleted) msg.delete()
                }, 10000)
            })
        })
}

async function editInSpreadsheet(executedBy: string, message: Discord.Message, getString: (path: string, cmd?: string, lang?: string) => any, args: string[]) {
    message.channel.startTyping()
    const string = args[1]
    if (!message.member!.roles.cache.has("569839580971401236") && !message.member!.hasPermission("MANAGE_ROLES")) { //Hypixel Proofreader
        const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setAuthor(getString("moduleName"))
            .setTitle(getString("editContextFor") + string)
            .setDescription(getString("notProofreader"))
            .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
        message.channel.stopTyping()
        return message.channel.send(embed)
    }

    const doc = new GoogleSpreadsheet(contextSheet!)
    await doc.useServiceAccountAuth(creds)

    await doc.loadInfo()

    const sheet = doc.sheetsByIndex[0]

    const rows = await sheet.getRows()
    let correctRow = rows.find(r => r.id === string)

    if (!correctRow) {
        message.channel.stopTyping()
        return message.channel.send(getString("errors.notFound"))
            .then(msg => setTimeout(() => {
                if (!msg.deleted) msg.delete()
                if (!message.deleted) message.delete()
            }, 10000))

    }

    if (!args[3]) {
        const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setAuthor(getString("moduleName"))
            .setTitle(getString("editContextFor") + string)
            .setDescription(getString("specifyFieldEdit"))
            .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
        message.channel.stopTyping()
        return message.channel.send(embed)
    }

    let key = args[2].toLowerCase()
    let newValues = [...args]
    newValues.splice(0, 3)
    let value = newValues.join(" ")

    const noEmoji = "732298639736570007"
    const yesEmoji = "732298639749152769"

    const embed = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setAuthor(getString("moduleName"))
        .setTitle(getString("editContextFor") + string)
        .setDescription(getString("confirm").replace("%%voteNo%%", "<:vote_no:732298639736570007>").replace("%%voteYes%%", "<:vote_yes:732298639749152769>"))
        .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
    if (correctRow[key]) {
        if (correctRow[key].length > 1) {
            embed.addFields({ name: getString("oldVal") + key, value: correctRow[key] })
        }
    }
    embed.addFields({ name: getString("newVal") + key, value: value })
    message.channel.stopTyping()
    message.channel.send(embed)
        .then(msg => {
            msg.react(yesEmoji).then(() => { msg.react(noEmoji) })

            const filter = (reaction: Discord.MessageReaction, reacter: Discord.User) => {
                return (reaction.emoji.id === yesEmoji || reaction.emoji.id === noEmoji) && reacter.id === message.author.id
            }

            const collector = msg.createReactionCollector(filter, { time: 10000 })

            collector.on("collect", async reaction => {
                if (reaction.emoji.name === "vote_no") {
                    msg.reactions.removeAll()
                    collector.stop()
                    const embed = new Discord.MessageEmbed()
                        .setColor(errorColor)
                        .setAuthor(getString("moduleName"))
                        .setTitle(getString("editContextFor") + string)
                        .setDescription(getString("errors.hitReaction").replace("%%voteNo%%", "<:vote_no:732298639736570007>") + getString("errors.cancelledPrompt"))
                        .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                    return msg.edit(embed)
                }
                if (reaction.emoji.name === "vote_yes") {
                    msg.reactions.removeAll()
                    collector.stop()
                    correctRow![key] = value
                    await correctRow!.save()
                    const result = rows.find(r => r.id === string)

                    if (!result) {
                        const embed = new Discord.MessageEmbed()
                            .setColor(errorColor)
                            .setAuthor(getString("moduleName"))
                            .setTitle(getString("editContextFor") + string)
                            .setDescription(getString("tryRunGet"))
                            .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                        return msg.edit(embed)
                    }

                    const embed = new Discord.MessageEmbed()
                        .setColor(successColor)
                        .setAuthor(getString("moduleName"))
                        .setTitle(getString("editContextFor") + string)
                        .setDescription(getString("editedResult") + result.context)
                        .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                    if (result.bg) { if (result.bg.length > 1) { embed.addFields({ name: getString("noteFor") + getString("bulgarian"), value: result.bg, inline: true }) } }
                    if (result.zhcn) { if (result.zhcn.length > 1) { embed.addFields({ name: getString("noteFor") + getString("chineseS"), value: result.zhcn, inline: true }) } }
                    if (result.zhtw) { if (result.zhtw.length > 1) { embed.addFields({ name: getString("noteFor") + getString("chineseT"), value: result.zhtw, inline: true }) } }
                    if (result.cs) { if (result.cs.length > 1) { embed.addFields({ name: getString("noteFor") + getString("czech"), value: result.cs, inline: true }) } }
                    if (result.da) { if (result.da.length > 1) { embed.addFields({ name: getString("noteFor") + getString("danish"), value: result.da, inline: true }) } }
                    if (result.nl) { if (result.nl.length > 1) { embed.addFields({ name: getString("noteFor") + getString("dutch"), value: result.nl, inline: true }) } }
                    if (result.fi) { if (result.fi.length > 1) { embed.addFields({ name: getString("noteFor") + getString("finnish"), value: result.fi, inline: true }) } }
                    if (result.fr) { if (result.fr.length > 1) { embed.addFields({ name: getString("noteFor") + getString("french"), value: result.fr, inline: true }) } }
                    if (result.de) { if (result.de.length > 1) { embed.addFields({ name: getString("noteFor") + getString("german"), value: result.de, inline: true }) } }
                    if (result.el) { if (result.el.length > 1) { embed.addFields({ name: getString("noteFor") + getString("greek"), value: result.el, inline: true }) } }
                    if (result.it) { if (result.it.length > 1) { embed.addFields({ name: getString("noteFor") + getString("italian"), value: result.it, inline: true }) } }
                    if (result.ja) { if (result.ja.length > 1) { embed.addFields({ name: getString("noteFor") + getString("japanese"), value: result.ja, inline: true }) } }
                    if (result.ko) { if (result.ko.length > 1) { embed.addFields({ name: getString("noteFor") + getString("korean"), value: result.ko, inline: true }) } }
                    if (result.ms) { if (result.ms.length > 1) { embed.addFields({ name: getString("noteFor") + getString("malay"), value: result.ms, inline: true }) } }
                    if (result.no) { if (result.no.length > 1) { embed.addFields({ name: getString("noteFor") + getString("norwegian"), value: result.no, inline: true }) } }
                    if (result.enpt) { if (result.enpt.length > 1) { embed.addFields({ name: getString("noteFor") + getString("pirate"), value: result.enpt, inline: true }) } }
                    if (result.pl) { if (result.pl.length > 1) { embed.addFields({ name: getString("noteFor") + getString("polish"), value: result.pl, inline: true }) } }
                    if (result.pt) { if (result.pt.length > 1) { embed.addFields({ name: getString("noteFor") + getString("portuguese"), value: result.pt, inline: true }) } }
                    if (result.ptbr) { if (result.ptbr.length > 1) { embed.addFields({ name: getString("noteFor") + getString("portugueseBr"), value: result.ptbr, inline: true }) } }
                    if (result.ru) { if (result.ru.length > 1) { embed.addFields({ name: getString("noteFor") + getString("russian"), value: result.ru, inline: true }) } }
                    if (result.es) { if (result.es.length > 1) { embed.addFields({ name: getString("noteFor") + getString("spanish"), value: result.es, inline: true }) } }
                    if (result.sv) { if (result.sv.length > 1) { embed.addFields({ name: getString("noteFor") + getString("swedish"), value: result.sv, inline: true }) } }
                    if (result.th) { if (result.th.length > 1) { embed.addFields({ name: getString("noteFor") + getString("thai"), value: result.th, inline: true }) } }
                    if (result.tr) { if (result.tr.length > 1) { embed.addFields({ name: getString("noteFor") + getString("turkish"), value: result.tr, inline: true }) } }
                    if (result.uk) { if (result.uk.length > 1) { embed.addFields({ name: getString("noteFor") + getString("ukrainian"), value: result.uk, inline: true }) } }
                    if (result.screenshot) {
                        if (/(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/.test(result.screenshot)) embed.setImage(result.screenshot)
                        embed.addFields({ name: getString("screenshot"), value: result.screenshot })
                    }
                    msg.edit(embed)
                    console.log("Edited the context entry for string " + string)
                }
            })

            collector.on("end", async () => {
                msg.reactions.removeAll()
                let correctRow = rows.find(r => r.id === string)
                if (correctRow![key] !== value) {
                    const embed = new Discord.MessageEmbed()
                        .setColor(errorColor)
                        .setAuthor(getString("moduleName"))
                        .setTitle(getString("editContextFor") + string)
                        .setDescription(getString("errors.didntReply") + getString("errors.cancelledPrompt"))
                        .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                    msg.edit(embed)
                }
            })
        })
}

async function showInfo(executedBy: string, message: Discord.Message, getString: (path: string, cmd?: string, lang?: string) => any) {
    const embed = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setAuthor(getString("moduleName"))
        .setTitle(getString("info.title"))
        .setDescription(getString("info.description"))
        .addFields(
            { name: "Get", value: getString("info.get") },
            { name: "Add", value: getString("info.add") },
            { name: "Edit", value: getString("info.edit") },
            { name: "Link", value: getString("info.link") },
            { name: "Help", value: getString("info.help") },
            { name: getString("info.fields"), value: "id, context, screenshot, bg, zhcn, zhtw, cs, da, nl, fi, fr, de, el, it, ja, ko, ms, no, enpt, pl, pt, ptbr, ru, es, sv, th, tr, uk" }
        )
        .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
    message.channel.send(embed)
}

async function sheetLink(executedBy: string, message: Discord.Message, getString: (path: string, cmd?: string, lang?: string) => any) {
    const embed = new Discord.MessageEmbed()
        .setColor(successColor)
        .setTitle(getString("info.sheetT"))
        .setDescription(`[${getString("info.sheetDButton")}](https://docs.google.com/spreadsheets/d/1tVLWskn4InBeopmRdQyrDumr1H6STqyidcEwoL4a8ts)\n\n` + getString("info.sheetD"))
        .setFooter(executedBy + " | " + getString("info.sheetDel"), message.author.displayAvatarURL({ format: "png", dynamic: true }))
    message.channel.send(embed)
        .then(linkMsg => {
            setTimeout(() => {
                if (!linkMsg.deleted) linkMsg.delete()
                if (!message.deleted) message.delete()
            }, 60000)
        })
}
