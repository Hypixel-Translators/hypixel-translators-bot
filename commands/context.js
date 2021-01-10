const { loadingColor, errorColor, successColor, neutralColor } = require("../config.json")
const Discord = require("discord.js")
const { GoogleSpreadsheet } = require("google-spreadsheet")
const creds = { "type": process.env.type, "project_id": process.env.project_id, "private_key_id": process.env.private_key_id, "private_key": process.env.private_key.replace(/\\n/gm, "\n"), "client_email": process.env.client_email, "client_id": process.env.client_id, "auth_uri": process.env.auth_uri, "token_uri": process.env.token_uri, "auth_provider_x509_cert_url": process.env.auth_provider_x509_cert_url, "client_x509_cert_url": process.env.client_x509_cert_url }
const contextSheet = process.env.context

module.exports = {
    name: "context",
    description: "Gets, adds or edits context for the given string ID. `+context help` shows you information about this command.",
    usage: "+context get|add|edit|link|help <arguments>",
    channelBlacklist: ["621298919535804426", "619662798133133312", "712046319375482910", "550951034332381184", "634101000340504576", "713084081579098152"],
    cooldown: 30,
    execute(message, strings, args) {
        const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
        const subCmd = args[0].toLowerCase()
        try {
            if (!message.member.roles.cache.has("569839580971401236") && !message.member.roles.cache.has("569839517444341771") && !message.member.hasPermission("ADMINISTRATOR")) throw "noTrPr" //Hypixel Translator and Hypixel Proofreader
            if (subCmd === "add" || subCmd === "new") addToSpreadsheet(executedBy, message, strings, args)
            else if (subCmd === "get" || subCmd === "show") getFromSpreadsheet(executedBy, message, strings, args)
            else if (subCmd === "edit") editInSpreadsheet(executedBy, message, strings, args)
            else if (subCmd === "help" || subCmd === "info") showInfo(executedBy, message, strings, args)
            else if (subCmd === "link" || subCmd === "sheet" || subCmd === "list") sheetLink(executedBy, message, strings, args)
            else throw "contextSubArg"
        } catch (err) { throw err.toString() }
    }
}

async function getFromSpreadsheet(executedBy, message, strings, args) {
    message.channel.startTyping()
    const string = args[1]
    const doc = new GoogleSpreadsheet(contextSheet)
    await doc.useServiceAccountAuth(creds)

    await doc.loadInfo()

    const sheet = doc.sheetsByIndex[0]

    const rows = await sheet.getRows()
    const correctRow = rows.find(r => r.id === string)

    if (!correctRow) {
        message.channel.stopTyping()
        message.channel.send(strings.errors.notFound).then(msg => setTimeout(() => {
            if (!msg.deleted) msg.delete()
            if (!message.deleted) message.delete()
        }, 10000))
        return
    }
        const embed = new Discord.MessageEmbed()
        .setColor(successColor)
        .setAuthor(strings.moduleName)
        .setTitle(strings.contextFor + string)
        .setDescription(correctRow.context)
        .setFooter(executedBy, message.author.displayAvatarURL())
    if (correctRow.bg) { if (correctRow.bg.length > 1) { embed.addFields({ name: strings.noteFor + strings.bulgarian, value: correctRow.bg, inline: true }) } }
    if (correctRow.zhcn) { if (correctRow.zhcn.length > 1) { embed.addFields({ name: strings.noteFor + strings.chineseS, value: correctRow.zhcn, inline: true }) } }
    if (correctRow.zhtw) { if (correctRow.zhtw.length > 1) { embed.addFields({ name: strings.noteFor + strings.chineseT, value: correctRow.zhtw, inline: true }) } }
    if (correctRow.cs) { if (correctRow.cs.length > 1) { embed.addFields({ name: strings.noteFor + strings.czech, value: correctRow.cs, inline: true }) } }
    if (correctRow.da) { if (correctRow.da.length > 1) { embed.addFields({ name: strings.noteFor + strings.danish, value: correctRow.da, inline: true }) } }
    if (correctRow.nl) { if (correctRow.nl.length > 1) { embed.addFields({ name: strings.noteFor + strings.dutch, value: correctRow.nl, inline: true }) } }
    if (correctRow.fi) { if (correctRow.fi.length > 1) { embed.addFields({ name: strings.noteFor + strings.finnish, value: correctRow.fi, inline: true }) } }
    if (correctRow.fr) { if (correctRow.fr.length > 1) { embed.addFields({ name: strings.noteFor + strings.french, value: correctRow.fr, inline: true }) } }
    if (correctRow.de) { if (correctRow.de.length > 1) { embed.addFields({ name: strings.noteFor + strings.german, value: correctRow.de, inline: true }) } }
    if (correctRow.el) { if (correctRow.el.length > 1) { embed.addFields({ name: strings.noteFor + strings.greek, value: correctRow.el, inline: true }) } }
    if (correctRow.it) { if (correctRow.it.length > 1) { embed.addFields({ name: strings.noteFor + strings.italian, value: correctRow.it, inline: true }) } }
    if (correctRow.ja) { if (correctRow.ja.length > 1) { embed.addFields({ name: strings.noteFor + strings.japanese, value: correctRow.ja, inline: true }) } }
    if (correctRow.ko) { if (correctRow.ko.length > 1) { embed.addFields({ name: strings.noteFor + strings.korean, value: correctRow.ko, inline: true }) } }
    if (correctRow.ms) { if (correctRow.ms.length > 1) { embed.addFields({ name: strings.noteFor + strings.malay, value: correctRow.ms, inline: true }) } }
    if (correctRow.no) { if (correctRow.no.length > 1) { embed.addFields({ name: strings.noteFor + strings.norwegian, value: correctRow.no, inline: true }) } }
    if (correctRow.enpt) { if (correctRow.enpt.length > 1) { embed.addFields({ name: strings.noteFor + strings.pirate, value: correctRow.enpt, inline: true }) } }
    if (correctRow.pl) { if (correctRow.pl.length > 1) { embed.addFields({ name: strings.noteFor + strings.polish, value: correctRow.pl, inline: true }) } }
    if (correctRow.pt) { if (correctRow.pt.length > 1) { embed.addFields({ name: strings.noteFor + strings.portuguese, value: correctRow.pt, inline: true }) } }
    if (correctRow.ptbr) { if (correctRow.ptbr.length > 1) { embed.addFields({ name: strings.noteFor + strings.portugueseBr, value: correctRow.ptbr, inline: true }) } }
    if (correctRow.ru) { if (correctRow.ru.length > 1) { embed.addFields({ name: strings.noteFor + strings.russian, value: correctRow.ru, inline: true }) } }
    if (correctRow.es) { if (correctRow.es.length > 1) { embed.addFields({ name: strings.noteFor + strings.spanish, value: correctRow.es, inline: true }) } }
    if (correctRow.sv) { if (correctRow.sv.length > 1) { embed.addFields({ name: strings.noteFor + strings.swedish, value: correctRow.sv, inline: true }) } }
    if (correctRow.th) { if (correctRow.th.length > 1) { embed.addFields({ name: strings.noteFor + strings.thai, value: correctRow.th, inline: true }) } }
    if (correctRow.tr) { if (correctRow.tr.length > 1) { embed.addFields({ name: strings.noteFor + strings.turkish, value: correctRow.tr, inline: true }) } }
    if (correctRow.uk) { if (correctRow.uk.length > 1) { embed.addFields({ name: strings.noteFor + strings.ukrainian, value: correctRow.uk, inline: true }) } }
    if (correctRow.screenshot) {
        let regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
        if (regexp.test(correctRow.screenshot)) {
            embed.setImage(correctRow.screenshot)
        }
        embed.addFields({ name: strings.screenshot, value: correctRow.screenshot })
    }
    message.channel.stopTyping()
    message.channel.send(embed)
}

async function addToSpreadsheet(executedBy, message, strings, args) {
    message.channel.startTyping()
    const string = args[1]
    let toSend = [...args]
    toSend.splice(0, 2)
    toSend = toSend.join(" ")

    if (!toSend || !string) {
        message.channel.stopTyping()
        message.channel.send(strings.errors.noContext).then(msg => setTimeout(() => {
            if (!msg.deleted) msg.delete()
            if (!message.deleted) message.delete()
        }, 10000))
        return
    }

    if (!message.member.roles.cache.has("569839580971401236") && !message.member.hasPermission("ADMINISTRATOR")) { //Hypixel Proofreader
        const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setAuthor(strings.moduleName)
            .setTitle(strings.addContextFor + string)
            .setDescription(strings.notProofreader)
            .setFooter(executedBy, message.author.displayAvatarURL())
        message.channel.stopTyping()
        message.channel.send(embed)
        return
    }

    const doc = new GoogleSpreadsheet(contextSheet)
    await doc.useServiceAccountAuth(creds)

    await doc.loadInfo()

    const sheet = doc.sheetsByIndex[0]
    const noEmoji = message.client.emojis.cache.find(emoji => emoji.name === "vote_no")
    const yesEmoji = message.client.emojis.cache.find(emoji => emoji.name === "vote_yes")

    const rows = await sheet.getRows()
    const correctRow = rows.find(r => r.id === string)
    if (correctRow) {
        const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setAuthor(strings.moduleName)
            .setTitle(strings.addContextFor + string)
            .setDescription(strings.errors.exists1 + string + strings.errors.exists2)
            .setFooter(executedBy, message.author.displayAvatarURL())
        message.channel.stopTyping()
        message.channel.send(embed)
        return
    }

    let toAdd = { id: string, context: toSend }
    const embed = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setAuthor(strings.moduleName)
        .setTitle(strings.addContextFor + string)
        .setDescription(strings.willAdd.replace("%%voteNo%%", "<:vote_no:732298639736570007>").replace("%%voteYes%%", "<:vote_yes:732298639749152769>"))
        .addFields(
            { name: strings.stringId, value: string },
            { name: strings.moduleName, value: toSend }
        )
        .setFooter(executedBy, message.author.displayAvatarURL())
    message.channel.stopTyping()
    message.channel.send(embed)
        .then(async msg => {
            msg.react("📑").then(() => { msg.react(yesEmoji).then(() => { msg.react(noEmoji) }) })
            const filter = (reaction, reacter) => {
                return (reaction.emoji.name === "📑" || reaction.emoji === yesEmoji || reaction.emoji === noEmoji) && reacter.id === message.author.id
            }

            const collector = msg.createReactionCollector(filter, { time: 120000 })

            let extraMsgs = []
            let extraReceiveds = []

            collector.on("collect", async (reaction, reacter) => {
                if (reaction.emoji.name === "📑") {
                    reaction.users.remove(message.author.id)
                    const collectorB = new Discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: 120000 })
                    const extraEmbed = new Discord.MessageEmbed()
                        .setColor(neutralColor)
                        .setAuthor(strings.moduleName)
                        .setTitle(strings.addContextFor + string)
                        .setDescription(strings.promptAddMore)
                    msg.channel.send(extraEmbed).then(extraMsg => {

                        extraMsgs.push(extraMsg)

                        collectorB.on("collect", received => {
                            collectorB.stop()
                            extraReceiveds.push(received)
                            let key = received.toString().toLowerCase()
                            key = key.replace(/ .*/, "")
                            let value = received.toString()
                            value = value.substr(value.indexOf(" ") + 1)
                            toAdd[key] = value
                            const extraEmbed = new Discord.MessageEmbed()
                                .setColor(successColor)
                                .setAuthor(strings.moduleName)
                                .setTitle(strings.addContextFor + string)
                                .setDescription(strings.addedMore)
                                .addFields({ name: key, value: value })
                            extraMsg.edit(extraEmbed)
                        })

                        collectorB.on("end", function () {
                            const extraEmbed = new Discord.MessageEmbed()
                                .setColor(errorColor)
                                .setAuthor(strings.moduleName)
                                .setTitle(strings.addContextFor + string)
                                .setDescription(strings.errors.didntReply + strings.errors.cancelledPrompt + strings.errors.readdTryAgain)
                            extraMsg.edit(extraEmbed)
                        })

                    })
                }
                if (reaction.emoji.name === "vote_yes") {
                    msg.reactions.removeAll()
                    const result = await sheet.addRow(toAdd)
                    const embed = new Discord.MessageEmbed()
                        .setColor(loadingColor)
                        .setAuthor(strings.moduleName)
                        .setTitle(strings.addContextFor + string)
                        .setDescription(strings.added)
                        .setFooter(executedBy, message.author.displayAvatarURL())
                    msg.channel.send(embed)
                        .then(finalMsg => {
                            if (!msg.deleted) msg.delete()
                            if (!result) {
                                message.channel.stopTyping()
                                message.channel.send(strings.errors.notFound).then(msg => setTimeout(() => {
                                    if (!msg.deleted) msg.delete()
                                    if (!message.deleted) message.delete()
                                }, 10000))
                                return
                            }

                            embed
                                .setColor(successColor)
                                .setAuthor(strings.moduleName)
                                .setTitle(strings.addContextFor + string)
                                .setDescription(strings.addedResult + result.context)
                                .setFooter(executedBy, message.author.displayAvatarURL())
                            if (result.bg) { if (result.bg.length > 1) { embed.addFields({ name: strings.noteFor + strings.bulgarian, value: result.bg, inline: true }) } }
                            if (result.zhcn) { if (result.zhcn.length > 1) { embed.addFields({ name: strings.noteFor + strings.chineseS, value: result.zhcn, inline: true }) } }
                            if (result.zhtw) { if (result.zhtw.length > 1) { embed.addFields({ name: strings.noteFor + strings.chineseT, value: result.zhtw, inline: true }) } }
                            if (result.cs) { if (result.cs.length > 1) { embed.addFields({ name: strings.noteFor + strings.czech, value: result.cs, inline: true }) } }
                            if (result.da) { if (result.da.length > 1) { embed.addFields({ name: strings.noteFor + strings.danish, value: result.da, inline: true }) } }
                            if (result.nl) { if (result.nl.length > 1) { embed.addFields({ name: strings.noteFor + strings.dutch, value: result.nl, inline: true }) } }
                            if (result.fi) { if (result.fi.length > 1) { embed.addFields({ name: strings.noteFor + strings.finnish, value: result.fi, inline: true }) } }
                            if (result.fr) { if (result.fr.length > 1) { embed.addFields({ name: strings.noteFor + strings.french, value: result.fr, inline: true }) } }
                            if (result.de) { if (result.de.length > 1) { embed.addFields({ name: strings.noteFor + strings.german, value: result.de, inline: true }) } }
                            if (result.el) { if (result.el.length > 1) { embed.addFields({ name: strings.noteFor + strings.greek, value: result.el, inline: true }) } }
                            if (result.it) { if (result.it.length > 1) { embed.addFields({ name: strings.noteFor + strings.italian, value: result.it, inline: true }) } }
                            if (result.ja) { if (result.ja.length > 1) { embed.addFields({ name: strings.noteFor + strings.japanese, value: result.ja, inline: true }) } }
                            if (result.ko) { if (result.ko.length > 1) { embed.addFields({ name: strings.noteFor + strings.korean, value: result.ko, inline: true }) } }
                            if (result.ms) { if (result.ms.length > 1) { embed.addFields({ name: strings.noteFor + strings.malay, value: result.ms, inline: true }) } }
                            if (result.no) { if (result.no.length > 1) { embed.addFields({ name: strings.noteFor + strings.norwegian, value: result.no, inline: true }) } }
                            if (result.enpt) { if (result.enpt.length > 1) { embed.addFields({ name: strings.noteFor + strings.pirate, value: result.enpt, inline: true }) } }
                            if (result.pl) { if (result.pl.length > 1) { embed.addFields({ name: strings.noteFor + strings.polish, value: result.pl, inline: true }) } }
                            if (result.pt) { if (result.pt.length > 1) { embed.addFields({ name: strings.noteFor + strings.portuguese, value: result.pt, inline: true }) } }
                            if (result.ptbr) { if (result.ptbr.length > 1) { embed.addFields({ name: strings.noteFor + strings.portugueseBr, value: result.ptbr, inline: true }) } }
                            if (result.ru) { if (result.ru.length > 1) { embed.addFields({ name: strings.noteFor + strings.russian, value: result.ru, inline: true }) } }
                            if (result.es) { if (result.es.length > 1) { embed.addFields({ name: strings.noteFor + strings.spanish, value: result.es, inline: true }) } }
                            if (result.sv) { if (result.sv.length > 1) { embed.addFields({ name: strings.noteFor + strings.swedish, value: result.sv, inline: true }) } }
                            if (result.th) { if (result.th.length > 1) { embed.addFields({ name: strings.noteFor + strings.thai, value: result.th, inline: true }) } }
                            if (result.tr) { if (result.tr.length > 1) { embed.addFields({ name: strings.noteFor + strings.turkish, value: result.tr, inline: true }) } }
                            if (result.uk) { if (result.uk.length > 1) { embed.addFields({ name: strings.noteFor + strings.ukrainian, value: result.uk, inline: true }) } }
                            if (result.screenshot) {
                                let regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
                                if (regexp.test(result.screenshot)) {
                                    embed.setImage(result.screenshot)
                                }
                                embed.addFields({ name: strings.screenshot, value: result.screenshot })
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
                        .setAuthor(strings.moduleName)
                        .setTitle(strings.addContextFor + string)
                        .setDescription(strings.errors.hitReaction.replace("%%voteNo%%", "<:vote_no:732298639736570007>") + strings.errors.cancelledPrompt)
                        .setFooter(executedBy, message.author.displayAvatarURL())
                    msg.edit(embed)
                    extraMsgs.forEach(item => {
                        if (!item.deleted) item.delete()
                    })
                    extraReceiveds.forEach(item => {
                        if (!item.deleted) item.delete()
                    })
                }

            })

            collector.on("end", () => {
                const embed = new Discord.MessageEmbed()
                    .setColor(errorColor)
                    .setAuthor(strings.moduleName)
                    .setTitle(strings.addContextFor + string)
                    .setDescription(strings.errors.hitReaction.replace("%%voteNo%%", "<:vote_no:732298639736570007>") + strings.errors.cancelledPrompt)
                    .setFooter(executedBy, message.author.displayAvatarURL())
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

async function editInSpreadsheet(executedBy, message, strings, args) {
    message.channel.startTyping()
    const string = args[1]
    if (!message.member.roles.cache.has("569839580971401236") && !message.member.hasPermission("ADMINISTRATOR")) { //Hypixel Proofreader
        const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setAuthor(strings.moduleName)
            .setTitle(strings.editContextFor + string)
            .setDescription(strings.notProofreader)
            .setFooter(executedBy, message.author.displayAvatarURL())
        message.channel.stopTyping()
        message.channel.send(embed)
        return
    }

    const doc = new GoogleSpreadsheet(contextSheet)
    await doc.useServiceAccountAuth(creds)

    await doc.loadInfo()

    const sheet = doc.sheetsByIndex[0]

    const rows = await sheet.getRows()
    let correctRow = rows.find(r => r.id === string)

    if (!correctRow) {
        message.channel.stopTyping()
        message.channel.send(strings.errors.notFound).then(msg => setTimeout(() => {
            if (!msg.deleted) msg.delete()
            if (!message.deleted) message.delete()
        }, 10000))
        return
    }

    if (!args[3]) {
        const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setAuthor(strings.moduleName)
            .setTitle(strings.editContextFor + string)
            .setDescription(strings.specifyFieldEdit)
            .setFooter(executedBy, message.author.displayAvatarURL())
        message.channel.stopTyping()
        message.channel.send(embed)
        return
    }

    let key = args[2].toLowerCase()
    let arguments = [...args]
    arguments.splice(0, 3)
    let value = arguments.join(" ")

    const noEmoji = msg.client.emojis.cache.find(emoji => emoji.name === "vote_no")
    const yesEmoji = msg.client.emojis.cache.find(emoji => emoji.name === "vote_yes")

    const embed = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setAuthor(strings.moduleName)
        .setTitle(strings.editContextFor + string)
        .setDescription(strings.confirm.replace("%%voteNo%%", "<:vote_no:732298639736570007>").replace("%%voteYes%%", "<:vote_yes:732298639749152769>"))
        .setFooter(executedBy, message.author.displayAvatarURL())
    if (correctRow[key]) {
        if (correctRow[key].length > 1) {
            embed.addFields({ name: strings.oldVal + key, value: correctRow[key] })
        }
    }
    embed.addFields({ name: strings.newVal + key, value: value })
    message.channel.stopTyping()
    message.channel.send(embed)
        .then(msg => {
            msg.react(yesEmoji).then(() => { msg.react(noEmoji) })

            const filter = (reaction, reacter) => {
                return (reaction.emoji === yesEmoji || reaction.emoji === noEmoji) && reacter.id === message.author.id
            }

            const collector = msg.createReactionCollector(filter, { time: 10000 })

            collector.on("collect", async (reaction, reacter) => {
                if (reaction.emoji.name === "vote_no") {
                    msg.reactions.removeAll()
                    collector.stop()
                    const embed = new Discord.MessageEmbed()
                        .setColor(errorColor)
                        .setAuthor(strings.moduleName)
                        .setTitle(strings.editContextFor + string)
                        .setDescription(strings.errors.hitReaction.replace("%%voteNo%%", "<:vote_no:732298639736570007>") + strings.errors.cancelledPrompt)
                        .setFooter(executedBy, message.author.displayAvatarURL())
                    msg.edit(embed)
                    return
                }
                if (reaction.emoji.name === "vote_yes") {
                    msg.reactions.removeAll()
                    collector.stop()
                    correctRow[key] = value
                    const save = await correctRow.save()
                    const result = rows.find(r => r.id === string)

                    if (!result) {
                        const embed = new Discord.MessageEmbed()
                            .setColor(errorColor)
                            .setAuthor(strings.moduleName)
                            .setTitle(strings.editContextFor + string)
                            .setDescription(string.edited + string.tryRunGet)
                            .setFooter(executedBy, message.author.displayAvatarURL())
                        msg.edit(embed)
                        return
                    }

                    const embed = new Discord.MessageEmbed()
                        .setColor(successColor)
                        .setAuthor(strings.moduleName)
                        .setTitle(strings.editContextFor + string)
                        .setDescription(strings.editedResult + result.context)
                        .setFooter(executedBy, message.author.displayAvatarURL())
                    if (result.bg) { if (result.bg.length > 1) { embed.addFields({ name: strings.noteFor + strings.bulgarian, value: result.bg, inline: true }) } }
                    if (result.zhcn) { if (result.zhcn.length > 1) { embed.addFields({ name: strings.noteFor + strings.chineseS, value: result.zhcn, inline: true }) } }
                    if (result.zhtw) { if (result.zhtw.length > 1) { embed.addFields({ name: strings.noteFor + strings.chineseT, value: result.zhtw, inline: true }) } }
                    if (result.cs) { if (result.cs.length > 1) { embed.addFields({ name: strings.noteFor + strings.czech, value: result.cs, inline: true }) } }
                    if (result.da) { if (result.da.length > 1) { embed.addFields({ name: strings.noteFor + strings.danish, value: result.da, inline: true }) } }
                    if (result.nl) { if (result.nl.length > 1) { embed.addFields({ name: strings.noteFor + strings.dutch, value: result.nl, inline: true }) } }
                    if (result.fi) { if (result.fi.length > 1) { embed.addFields({ name: strings.noteFor + strings.finnish, value: result.fi, inline: true }) } }
                    if (result.fr) { if (result.fr.length > 1) { embed.addFields({ name: strings.noteFor + strings.french, value: result.fr, inline: true }) } }
                    if (result.de) { if (result.de.length > 1) { embed.addFields({ name: strings.noteFor + strings.german, value: result.de, inline: true }) } }
                    if (result.el) { if (result.el.length > 1) { embed.addFields({ name: strings.noteFor + strings.greek, value: result.el, inline: true }) } }
                    if (result.it) { if (result.it.length > 1) { embed.addFields({ name: strings.noteFor + strings.italian, value: result.it, inline: true }) } }
                    if (result.ja) { if (result.ja.length > 1) { embed.addFields({ name: strings.noteFor + strings.japanese, value: result.ja, inline: true }) } }
                    if (result.ko) { if (result.ko.length > 1) { embed.addFields({ name: strings.noteFor + strings.korean, value: result.ko, inline: true }) } }
                    if (result.ms) { if (result.ms.length > 1) { embed.addFields({ name: strings.noteFor + strings.malay, value: result.ms, inline: true }) } }
                    if (result.no) { if (result.no.length > 1) { embed.addFields({ name: strings.noteFor + strings.norwegian, value: result.no, inline: true }) } }
                    if (result.enpt) { if (result.enpt.length > 1) { embed.addFields({ name: strings.noteFor + strings.pirate, value: result.enpt, inline: true }) } }
                    if (result.pl) { if (result.pl.length > 1) { embed.addFields({ name: strings.noteFor + strings.polish, value: result.pl, inline: true }) } }
                    if (result.pt) { if (result.pt.length > 1) { embed.addFields({ name: strings.noteFor + strings.portuguese, value: result.pt, inline: true }) } }
                    if (result.ptbr) { if (result.ptbr.length > 1) { embed.addFields({ name: strings.noteFor + strings.portugueseBr, value: result.ptbr, inline: true }) } }
                    if (result.ru) { if (result.ru.length > 1) { embed.addFields({ name: strings.noteFor + strings.russian, value: result.ru, inline: true }) } }
                    if (result.es) { if (result.es.length > 1) { embed.addFields({ name: strings.noteFor + strings.spanish, value: result.es, inline: true }) } }
                    if (result.sv) { if (result.sv.length > 1) { embed.addFields({ name: strings.noteFor + strings.swedish, value: result.sv, inline: true }) } }
                    if (result.th) { if (result.th.length > 1) { embed.addFields({ name: strings.noteFor + strings.thai, value: result.th, inline: true }) } }
                    if (result.tr) { if (result.tr.length > 1) { embed.addFields({ name: strings.noteFor + strings.turkish, value: result.tr, inline: true }) } }
                    if (result.uk) { if (result.uk.length > 1) { embed.addFields({ name: strings.noteFor + strings.ukrainian, value: result.uk, inline: true }) } }
                    if (result.screenshot) {
                        let regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
                        if (regexp.test(result.screenshot)) {
                            embed.setImage(result.screenshot)
                        }
                        embed.addFields({ name: strings.screenshot, value: result.screenshot })
                    }
                    msg.edit(embed)
                    console.log("Edited the context entry for string " + string)
                }
            })

            collector.on("end", async (collected) => {
                msg.reactions.removeAll()
                let correctRow = rows.find(r => r.id === string)
                if (correctRow[key] !== value) {
                    const embed = new Discord.MessageEmbed()
                        .setColor(errorColor)
                        .setAuthor(strings.moduleName)
                        .setTitle(strings.editContextFor + string)
                        .setDescription(strings.errors.didntReply + strings.errors.cancelledPrompt)
                        .setFooter(executedBy, message.author.displayAvatarURL())
                    msg.edit(embed)
                }
                return
            })
        })
}

async function showInfo(executedBy, message, strings) {
    const embed = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setAuthor(strings.moduleName)
        .setTitle(strings.info.title)
        .setDescription(strings.info.description)
        .addFields(
            { name: "Get", value: strings.info.get },
            { name: "Add", value: strings.info.add },
            { name: "Edit", value: strings.info.edit },
            { name: "Link", value: strings.info.link },
            { name: "Help", value: strings.info.help },
            { name: strings.info.fields, value: "id, context, screenshot, bg, zhcn, zhtw, cs, da, nl, fi, fr, de, el, it, ja, ko, ms, no, enpt, pl, pt, ptbr, ru, es, sv, th, tr, uk" }
        )
        .setFooter(executedBy, message.author.displayAvatarURL())
    message.channel.send(embed)
    return
}

async function sheetLink(executedBy, message, strings) {
    const embed = new Discord.MessageEmbed()
        .setColor(successColor)
        .setTitle(strings.info.sheetT)
        .setDescription(`[${strings.info.sheetDButton}](https://docs.google.com/spreadsheets/d/1tVLWskn4InBeopmRdQyrDumr1H6STqyidcEwoL4a8ts)\n\n` + strings.info.sheetD)
        .setFooter(executedBy + " | " + strings.info.sheetDel, message.author.displayAvatarURL())
    message.channel.send(embed)
        .then(linkMsg => {
            setTimeout(() => {
                if (!linkMsg.deleted) linkMsg.delete()
                if (!message.deleted) message.delete()
            }, 60000)
        })
}
