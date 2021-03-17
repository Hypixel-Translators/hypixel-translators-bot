import { loadingColor, errorColor, successColor, neutralColor } from "../../config.json"
import Discord from "discord.js"
import { GoogleSpreadsheet, ServiceAccountCredentials } from "google-spreadsheet"
import { Command } from "../../index"
const creds = { "type": process.env.type, "project_id": process.env.project_id, "private_key_id": process.env.private_key_id, "private_key": process.env.private_key!.replace(/\\n/gm, "\n"), "client_email": process.env.client_email, "client_id": process.env.client_id, "auth_uri": process.env.auth_uri, "token_uri": process.env.token_uri, "auth_provider_x509_cert_url": process.env.auth_provider_x509_cert_url, "client_x509_cert_url": process.env.client_x509_cert_url } as ServiceAccountCredentials,
    contextSheet = process.env.context

const command: Command = {
    name: "context",
    description: "Gets, adds or edits context for the given string ID. `+context help` shows you information about this command.",
    usage: "+context get|add|edit|link|help <arguments>",
    roleWhitelist: ["569839580971401236", "569839517444341771"],
    channelBlacklist: ["621298919535804426", "619662798133133312", "712046319375482910", "801904400826105876", "550951034332381184", "713084081579098152"], //off-topic memes pets food suggestions no-mic
    cooldown: 30,
    async execute(message: Discord.Message, args: string[], getString: (path: string, variables?: { [key: string]: string | number }, cmd?: string, lang?: string) => any) {
        const executedBy = getString("executedBy", { user: message.author.tag }, "global")
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

async function getFromSpreadsheet(executedBy: string, message: Discord.Message, getString: (path: string, variables?: { [key: string]: string | number }, cmd?: string, lang?: string) => any, args: string[]) {
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
    if (correctRow.bg) embed.addField(getString("noteFor") + getString("bulgarian"), correctRow.bg, true)
    if (correctRow.zhcn) embed.addField(getString("noteFor") + getString("chineseS"), correctRow.zhcn, true)
    if (correctRow.zhtw) embed.addField(getString("noteFor") + getString("chineseT"), correctRow.zhtw, true)
    if (correctRow.cs) embed.addField(getString("noteFor") + getString("czech"), correctRow.cs, true)
    if (correctRow.da) embed.addField(getString("noteFor") + getString("danish"), correctRow.da, true)
    if (correctRow.nl) embed.addField(getString("noteFor") + getString("dutch"), correctRow.nl, true)
    if (correctRow.fi) embed.addField(getString("noteFor") + getString("finnish"), correctRow.fi, true)
    if (correctRow.fr) embed.addField(getString("noteFor") + getString("french"), correctRow.fr, true)
    if (correctRow.de) embed.addField(getString("noteFor") + getString("german"), correctRow.de, true)
    if (correctRow.el) embed.addField(getString("noteFor") + getString("greek"), correctRow.el, true)
    if (correctRow.it) embed.addField(getString("noteFor") + getString("italian"), correctRow.it, true)
    if (correctRow.ja) embed.addField(getString("noteFor") + getString("japanese"), correctRow.ja, true)
    if (correctRow.ko) embed.addField(getString("noteFor") + getString("korean"), correctRow.ko, true)
    if (correctRow.ms) embed.addField(getString("noteFor") + getString("malay"), correctRow.ms, true)
    if (correctRow.no) embed.addField(getString("noteFor") + getString("norwegian"), correctRow.no, true)
    if (correctRow.enpt) embed.addField(getString("noteFor") + getString("pirate"), correctRow.enpt, true)
    if (correctRow.pl) embed.addField(getString("noteFor") + getString("polish"), correctRow.pl, true)
    if (correctRow.pt) embed.addField(getString("noteFor") + getString("portuguese"), correctRow.pt, true)
    if (correctRow.ptbr) embed.addField(getString("noteFor") + getString("portugueseBr"), correctRow.ptbr, true)
    if (correctRow.ru) embed.addField(getString("noteFor") + getString("russian"), correctRow.ru, true)
    if (correctRow.es) embed.addField(getString("noteFor") + getString("spanish"), correctRow.es, true)
    if (correctRow.sv) embed.addField(getString("noteFor") + getString("swedish"), correctRow.sv, true)
    if (correctRow.th) embed.addField(getString("noteFor") + getString("thai"), correctRow.th, true)
    if (correctRow.tr) embed.addField(getString("noteFor") + getString("turkish"), correctRow.tr, true)
    if (correctRow.uk) embed.addField(getString("noteFor") + getString("ukrainian"), correctRow.uk, true)
    if (correctRow.screenshot) {
        if (/(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/.test(correctRow.screenshot)) embed.setImage(correctRow.screenshot)
        embed.addField(getString("screenshot"), correctRow.screenshot)
    }
    message.channel.stopTyping()
    message.channel.send(embed)
}

async function addToSpreadsheet(executedBy: string, message: Discord.Message, getString: (path: string, variables?: { [key: string]: string | number }, cmd?: string, lang?: string) => any, args: string[]) {
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
        .setDescription(getString("willAdd", { voteNo: "<:vote_no:732298639736570007>", voteYes: "<:vote_yes:732298639749152769>" }))
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
                                .addField(key, value)
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
                            if (result.bg) embed.addField(getString("noteFor") + getString("bulgarian"), result.bg, true)
                            if (result.zhcn) embed.addField(getString("noteFor") + getString("chineseS"), result.zhcn, true)
                            if (result.zhtw) embed.addField(getString("noteFor") + getString("chineseT"), result.zhtw, true)
                            if (result.cs) embed.addField(getString("noteFor") + getString("czech"), result.cs, true)
                            if (result.da) embed.addField(getString("noteFor") + getString("danish"), result.da, true)
                            if (result.nl) embed.addField(getString("noteFor") + getString("dutch"), result.nl, true)
                            if (result.fi) embed.addField(getString("noteFor") + getString("finnish"), result.fi, true)
                            if (result.fr) embed.addField(getString("noteFor") + getString("french"), result.fr, true)
                            if (result.de) embed.addField(getString("noteFor") + getString("german"), result.de, true)
                            if (result.el) embed.addField(getString("noteFor") + getString("greek"), result.el, true)
                            if (result.it) embed.addField(getString("noteFor") + getString("italian"), result.it, true)
                            if (result.ja) embed.addField(getString("noteFor") + getString("japanese"), result.ja, true)
                            if (result.ko) embed.addField(getString("noteFor") + getString("korean"), result.ko, true)
                            if (result.ms) embed.addField(getString("noteFor") + getString("malay"), result.ms, true)
                            if (result.no) embed.addField(getString("noteFor") + getString("norwegian"), result.no, true)
                            if (result.enpt) embed.addField(getString("noteFor") + getString("pirate"), result.enpt, true)
                            if (result.pl) embed.addField(getString("noteFor") + getString("polish"), result.pl, true)
                            if (result.pt) embed.addField(getString("noteFor") + getString("portuguese"), result.pt, true)
                            if (result.ptbr) embed.addField(getString("noteFor") + getString("portugueseBr"), result.ptbr, true)
                            if (result.ru) embed.addField(getString("noteFor") + getString("russian"), result.ru, true)
                            if (result.es) embed.addField(getString("noteFor") + getString("spanish"), result.es, true)
                            if (result.sv) embed.addField(getString("noteFor") + getString("swedish"), result.sv, true)
                            if (result.th) embed.addField(getString("noteFor") + getString("thai"), result.th, true)
                            if (result.tr) embed.addField(getString("noteFor") + getString("turkish"), result.tr, true)
                            if (result.uk) embed.addField(getString("noteFor") + getString("ukrainian"), result.uk, true)
                            if (result.screenshot) {
                                if (/(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/.test(result.screenshot)) embed.setImage(result.screenshot)
                                embed.addField(getString("screenshot"), result.screenshot)
                            }
                            finalMsg.edit(embed)
                            extraMsgs?.forEach(item => {
                                if (!item.deleted) item.delete()
                            })
                            extraReceiveds?.forEach(item => {
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
                        .setDescription(getString("errors.hitReaction", { voteNo: "<:vote_no:732298639736570007>" }) + getString("errors.cancelledPrompt"))
                        .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                    msg.edit(embed)
                    extraMsgs?.forEach(item => {
                        if (!item.deleted) item.delete()
                    })
                    extraReceiveds?.forEach(item => {
                        if (!item.deleted) item.delete()
                    })
                }

            })

            reactionCollector.on("end", () => {
                const embed = new Discord.MessageEmbed()
                    .setColor(errorColor)
                    .setAuthor(getString("moduleName"))
                    .setTitle(getString("addContextFor") + string)
                    .setDescription(getString("errors.hitReaction", { voteNo: "<:vote_no:732298639736570007>" }) + getString("errors.cancelledPrompt"))
                    .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                msg.edit(embed)
                extraMsgs?.forEach(item => {
                    if (!item.deleted) item.delete()
                })
                extraReceiveds?.forEach(item => {
                    if (!item.deleted) item.delete()
                })
                setTimeout(() => {
                    if (!msg.deleted) msg.delete()
                }, 10000)
            })
        })
}

async function editInSpreadsheet(executedBy: string, message: Discord.Message, getString: (path: string, variables?: { [key: string]: string | number }, cmd?: string, lang?: string) => any, args: string[]) {
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
        .setDescription(getString("confirm", { voteNo: "<:vote_no:732298639736570007>", voteYes: "<:vote_yes:732298639749152769>" }))
        .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
    if (correctRow[key]) {
        if (correctRow[key].length > 1) {
            embed.addField(getString("oldVal") + key, correctRow[key])
        }
    }
    embed.addField(getString("newVal") + key, value)
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
                        .setDescription(getString("errors.hitReaction", { voteNo: "<:vote_no:732298639736570007>" }) + getString("errors.cancelledPrompt"))
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
                    if (result.bg) embed.addField(getString("noteFor") + getString("bulgarian"), result.bg, true)
                    if (result.zhcn) embed.addField(getString("noteFor") + getString("chineseS"), result.zhcn, true)
                    if (result.zhtw) embed.addField(getString("noteFor") + getString("chineseT"), result.zhtw, true)
                    if (result.cs) embed.addField(getString("noteFor") + getString("czech"), result.cs, true)
                    if (result.da) embed.addField(getString("noteFor") + getString("danish"), result.da, true)
                    if (result.nl) embed.addField(getString("noteFor") + getString("dutch"), result.nl, true)
                    if (result.fi) embed.addField(getString("noteFor") + getString("finnish"), result.fi, true)
                    if (result.fr) embed.addField(getString("noteFor") + getString("french"), result.fr, true)
                    if (result.de) embed.addField(getString("noteFor") + getString("german"), result.de, true)
                    if (result.el) embed.addField(getString("noteFor") + getString("greek"), result.el, true)
                    if (result.it) embed.addField(getString("noteFor") + getString("italian"), result.it, true)
                    if (result.ja) embed.addField(getString("noteFor") + getString("japanese"), result.ja, true)
                    if (result.ko) embed.addField(getString("noteFor") + getString("korean"), result.ko, true)
                    if (result.ms) embed.addField(getString("noteFor") + getString("malay"), result.ms, true)
                    if (result.no) embed.addField(getString("noteFor") + getString("norwegian"), result.no, true)
                    if (result.enpt) embed.addField(getString("noteFor") + getString("pirate"), result.enpt, true)
                    if (result.pl) embed.addField(getString("noteFor") + getString("polish"), result.pl, true)
                    if (result.pt) embed.addField(getString("noteFor") + getString("portuguese"), result.pt, true)
                    if (result.ptbr) embed.addField(getString("noteFor") + getString("portugueseBr"), result.ptbr, true)
                    if (result.ru) embed.addField(getString("noteFor") + getString("russian"), result.ru, true)
                    if (result.es) embed.addField(getString("noteFor") + getString("spanish"), result.es, true)
                    if (result.sv) embed.addField(getString("noteFor") + getString("swedish"), result.sv, true)
                    if (result.th) embed.addField(getString("noteFor") + getString("thai"), result.th, true)
                    if (result.tr) embed.addField(getString("noteFor") + getString("turkish"), result.tr, true)
                    if (result.uk) embed.addField(getString("noteFor") + getString("ukrainian"), result.uk, true)
                    if (result.screenshot) {
                        if (/(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/.test(result.screenshot)) embed.setImage(result.screenshot)
                        embed.addField(getString("screenshot"), result.screenshot)
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

async function showInfo(executedBy: string, message: Discord.Message, getString: (path: string, variables?: { [key: string]: string | number }, cmd?: string, lang?: string) => any) {
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

async function sheetLink(executedBy: string, message: Discord.Message, getString: (path: string, variables?: { [key: string]: string | number }, cmd?: string, lang?: string) => any) {
    const embed = new Discord.MessageEmbed()
        .setColor(successColor)
        .setTitle(getString("info.sheetT"))
        .setDescription(`[${getString("info.sheetDButton")}](https://docs.google.com/spreadsheets/d/1tVLWskn4InBeopmRdQyrDumr1H6STqyidcEwoL4a8ts)\n\n` + getString("info.sheetD"))
        .setFooter(`${executedBy} | ${getString("info.sheetDel")}`, message.author.displayAvatarURL({ format: "png", dynamic: true }))
    message.channel.send(embed)
        .then(linkMsg => {
            setTimeout(() => {
                if (!linkMsg.deleted) linkMsg.delete()
                if (!message.deleted) message.delete()
            }, 60000)
        })
}

export default command
