const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");
const { GoogleSpreadsheet } = require('google-spreadsheet')
const creds = require('../service-account.json')

module.exports = {
    name: "context",
    description: "Gets, adds or edits context for the given string ID. `+context help` shows you information about this command.",
    usage: "context get|add|edit|view|help <arguments>",
    channelBlackList: ["621298919535804426", "619662798133133312", "712046319375482910", "550951034332381184", "634101000340504576", "713084081579098152"],
    cooldown: 10,
    execute(strings, message, args) {
        const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
        const embed = new Discord.MessageEmbed()
            .setColor(workingColor)
            .setAuthor(strings.moduleName)
            .setTitle(strings.loading)
            .setDescription(strings.loadingModule)
            .setFooter(executedBy);
        message.channel.send(embed)
            .then(msg => {
                if (!message.member.roles.cache.has("569839580971401236") && !message.member.roles.cache.has("569839517444341771")) {
                    const embed = new Discord.MessageEmbed()
                        .setColor(errorColor)
                        .setAuthor(strings.moduleName)
                        .setTitle(strings.notAllowed)
                        .setFooter(executedBy);
                    msg.edit(embed)
                    return;
                }
                if (args[0] === "new" || args[0] === "add") { addToSpreadsheet(executedBy, strings, message, args, msg) }
                else if (args[0] === "get") { getFromSpreadsheet(executedBy, strings, message, args, msg) }
                else if (args[0] === "edit") { editInSpreadsheet(executedBy, strings, message, args, msg) }
                else if (args[0] === "info" || args[0] === "help") { showInfo(executedBy, strings, message, args, msg) }
                else if (args[0] === "view" || args[0] === "link") { viewsheet(executedBy, strings, message, args, msg) }
                else {
                    const embed = new Discord.MessageEmbed()
                        .setColor(errorColor)
                        .setAuthor(strings.moduleName)
                        .setTitle(strings.incorrectArgument)
                        .setFooter(executedBy);
                    msg.edit(embed)
                }
                if (strings, message.channel.id === "549894938712866816") {
                    setTimeout(() => {
                        message.delete()
                    }, 60000)
                }
            })
    }
}

async function getFromSpreadsheet(executedBy, strings, message, args, msg) {
    const doc = new GoogleSpreadsheet('1tVLWskn4InBeopmRdQyrDumr1H6STqyidcEwoL4a8ts')
    await doc.useServiceAccountAuth(creds)

    await doc.loadInfo()
    console.log(doc.title)

    const sheet = doc.sheetsByIndex[0]
    console.log(sheet.title)

    const rows = await sheet.getRows()
    const correctRow = rows.find(r => r.id === args[1])

    if (!correctRow) {
        const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setAuthor(strings.moduleName)
            .setTitle(strings.errors.notFound1 + args[1] + strings.errors.notFound2)
            .setFooter(executedBy);
        msg.edit(embed)
        return;
    }

    const embed = new Discord.MessageEmbed()
        .setColor(successColor)
        .setAuthor(strings.moduleName)
        .setTitle(strings.contextFor + args[1])
        .setDescription(correctRow.context)
        .setFooter(executedBy);
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
    if (correctRow.ptpt) { if (correctRow.ptpt.length > 1) { embed.addFields({ name: strings.noteFor + strings.portuguese, value: correctRow.ptpt, inline: true }) } }
    if (correctRow.ptbr) { if (correctRow.ptbr.length > 1) { embed.addFields({ name: strings.noteFor + strings.brazilian, value: correctRow.ptbr, inline: true }) } }
    if (correctRow.ru) { if (correctRow.ru.length > 1) { embed.addFields({ name: strings.noteFor + strings.russian, value: correctRow.ru, inline: true }) } }
    if (correctRow.eses) { if (correctRow.eses.length > 1) { embed.addFields({ name: strings.noteFor + strings.spanish, value: correctRow.eses, inline: true }) } }
    if (correctRow.svse) { if (correctRow.svse.length > 1) { embed.addFields({ name: strings.noteFor + strings.swedish, value: correctRow.svse, inline: true }) } }
    if (correctRow.th) { if (correctRow.th.length > 1) { embed.addFields({ name: strings.noteFor + strings.thai, value: correctRow.th, inline: true }) } }
    if (correctRow.tr) { if (correctRow.tr.length > 1) { embed.addFields({ name: strings.noteFor + strings.turkish, value: correctRow.tr, inline: true }) } }
    if (correctRow.uk) { if (correctRow.uk.length > 1) { embed.addFields({ name: strings.noteFor + strings.ukrainian, value: correctRow.uk, inline: true }) } }
    if (correctRow.screenshot) {
        var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
        if (regexp.test(correctRow.screenshot)) {
            embed.setImage(correctRow.screenshot)
        }
        embed.addFields({ name: strings.screenshot, value: correctRow.screenshot })
    }
    msg.edit(embed)
}

async function addToSpreadsheet(executedBy, strings, message, args, msg) {
    const string = args[1]
    var toSend = [...args]
    toSend.splice(0, 2)
    toSend = toSend.join(" ")

    if (!message.member.roles.cache.has("569839580971401236") && !message.member.hasPermission("ADMINISTRATOR")) {
        const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setAuthor(strings.moduleName)
            .setTitle(strings.addContextFor + string)
            .setDescription(strings.notProofreader)
            .setFooter(executedBy);
        msg.edit(embed)
        return;
    }

    const doc = new GoogleSpreadsheet('1tVLWskn4InBeopmRdQyrDumr1H6STqyidcEwoL4a8ts')
    await doc.useServiceAccountAuth(creds)

    await doc.loadInfo()
    console.log(doc.title)

    const sheet = doc.sheetsByIndex[0]
    console.log(sheet.title)
    const noEmoji = msg.client.emojis.cache.find(emoji => emoji.name === 'vote_no');
    const yesEmoji = msg.client.emojis.cache.find(emoji => emoji.name === 'vote_yes');

    const rows = await sheet.getRows()
    const correctRow = rows.find(r => r.id === args[1])
    if (correctRow) {
        const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setAuthor(strings.moduleName)
            .setTitle(strings.addContextFor + string)
            .setDescription(strings.errors.exists1 + string + strings.errors.exists2)
            .setFooter(executedBy);
        msg.edit(embed)
        return;
    }

    var toAdd = { id: string, context: toSend }
    const embed = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setAuthor(strings.moduleName)
        .setTitle(strings.addContextFor + string)
        .setDescription(strings.willAdd)
        .addFields(
            { name: strings.stringId, value: string },
            { name: strings.moduleName, value: toSend }
        )
        .setFooter(executedBy);
    msg.edit(embed).then(msg => {
        msg.react("📑").then(() => { msg.react(yesEmoji).then(() => { msg.react(noEmoji) }) })
        const filter = (reaction, reacter) => {
            return (reaction.emoji.name === "📑" || reaction.emoji === yesEmoji || reaction.emoji === noEmoji) && reacter.id === message.author.id;
        };

        const collector = msg.createReactionCollector(filter, { time: 120000 });

        var extraMsgs = []
        var extraReceiveds = []

        collector.on('collect', async (reaction, reacter) => {
            console.log(reaction.emoji.name)
            if (reaction.emoji.name === "📑") {
                reaction.remove()
                msg.react("📑")
                const collectorB = new Discord.MessageCollector(strings, message.channel, m => m.author.id === message.author.id, { time: 120000 });
                const extraEmbed = new Discord.MessageEmbed()
                    .setColor(neutralColor)
                    .setAuthor(strings.moduleName)
                    .setTitle(strings.addContextFor + string)
                    .setDescription(strings.promptAddMore)
                msg.channel.send(extraEmbed).then(extraMsg => {

                    extraMsgs.push(extraMsg)

                    collectorB.on('collect', received => {
                        collectorB.stop()
                        extraReceiveds.push(received)
                        var key = received.toString().toLowerCase()
                        key = key.replace(/ .*/, '')
                        var value = received.toString()
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

                    collectorB.on('end', function () {
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
                    .setColor(workingColor)
                    .setAuthor(strings.moduleName)
                    .setTitle(strings.addContextFor + string)
                    .setDescription(strings.added)
                    .setFooter(executedBy);
                msg.channel.send(embed)
                    .then(finalMsg => {
                        msg.delete()

                        if (!result) {
                            const embed = new Discord.MessageEmbed()
                                .setColor(errorColor)
                                .setAuthor(strings.moduleName)
                                .setTitle(strings.addContextFor + string)
                                .setDescription(strings.errors.notFound1 + strings.errors.notFound2)
                                .setFooter(executedBy);
                            finalMsg.edit(embed)
                            return;
                        }

                        embed
                            .setColor(successColor)
                            .setAuthor(strings.moduleName)
                            .setTitle(strings.addContextFor + string)
                            .setDescription(strings.addedResult + result.context)
                            .setFooter(executedBy);
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
                        if (result.ptpt) { if (result.ptpt.length > 1) { embed.addFields({ name: strings.noteFor + strings.portuguese, value: result.ptpt, inline: true }) } }
                        if (result.ptbr) { if (result.ptbr.length > 1) { embed.addFields({ name: strings.noteFor + strings.brazilian, value: result.ptbr, inline: true }) } }
                        if (result.ru) { if (result.ru.length > 1) { embed.addFields({ name: strings.noteFor + strings.russian, value: result.ru, inline: true }) } }
                        if (result.eses) { if (result.eses.length > 1) { embed.addFields({ name: strings.noteFor + strings.spanish, value: result.eses, inline: true }) } }
                        if (result.svse) { if (result.svse.length > 1) { embed.addFields({ name: strings.noteFor + strings.swedish, value: result.svse, inline: true }) } }
                        if (result.th) { if (result.th.length > 1) { embed.addFields({ name: strings.noteFor + strings.thai, value: result.th, inline: true }) } }
                        if (result.tr) { if (result.tr.length > 1) { embed.addFields({ name: strings.noteFor + strings.turkish, value: result.tr, inline: true }) } }
                        if (result.uk) { if (result.uk.length > 1) { embed.addFields({ name: strings.noteFor + strings.ukrainian, value: result.uk, inline: true }) } }
                        if (result.screenshot) {
                            var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
                            if (regexp.test(result.screenshot)) {
                                embed.setImage(result.screenshot)
                            }
                            embed.addFields({ name: strings.screenshot, value: result.screenshot })
                        }
                        finalMsg.edit(embed)
                        extraMsgs.forEach(function (item) {
                            item.delete()
                        })
                        extraReceiveds.forEach(function (item) {
                            item.delete()
                        })
                    })
            }
            if (reaction.emoji.name === "vote_no") {
                msg.reactions.removeAll()
                const embed = new Discord.MessageEmbed()
                    .setColor(errorColor)
                    .setAuthor(strings.moduleName)
                    .setTitle(strings.addContextFor + string)
                    .setDescription(strings.errors.hitReaction + strings.errors.cancelledPrompt)
                    .setFooter(executedBy);
                msg.edit(embed)
                message.delete()
                extraMsgs.forEach(function (item) {
                    item.delete()
                })
                extraReceiveds.forEach(function (item) {
                    item.delete()
                })
                setTimeout(() => {
                    msg.delete()
                }, 5000)
            }

        })

        collector.on('end', () => {
            const embed = new Discord.MessageEmbed()
                .setColor(workingColor)
                .setAuthor(strings.moduleName)
                .setTitle(strings.addContextFor + string)
                .setDescription(strings.errors.hitReaction + strings.errors.cancelledPrompt + strings.loading)
                .setFooter(executedBy);
            msg.edit(embed)
            message.delete()
            extraMsgs.forEach(function (item) {
                item.delete()
            })
            extraReceiveds.forEach(function (item) {
                item.delete()
            })
            setTimeout(() => {
                msg.delete()
            }, 5000)
        })
    })
}

async function editInSpreadsheet(executedBy, strings, message, args, msg) {
    if (!message.member.roles.cache.has("569839580971401236") && !message.member.hasPermission("ADMINISTRATOR")) {
        const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setAuthor(strings.moduleName)
            .setTitle(strings.editContextFor + args[1])
            .setDescription(strings.notProofreader)
            .setFooter(executedBy);
        msg.edit(embed)
        return;
    }

    const doc = new GoogleSpreadsheet('1tVLWskn4InBeopmRdQyrDumr1H6STqyidcEwoL4a8ts')
    await doc.useServiceAccountAuth(creds)

    await doc.loadInfo()
    console.log(doc.title)

    const sheet = doc.sheetsByIndex[0]
    console.log(sheet.title)

    const rows = await sheet.getRows()
    var correctRow = rows.find(r => r.id === args[1])

    if (!correctRow) {
        const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setAuthor(strings.moduleName)
            .setTitle(strings.errors.notFound1 + args[1] + strings.errors.notFound2)
            .setFooter(executedBy);
        msg.edit(embed)
        return;
    }

    if (!args[3]) {
        const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setAuthor(strings.moduleName)
            .setTitle(strings.editContextFor + args[1])
            .setDescription(strings.specifyFieldEdit)
            .setFooter(executedBy);
        msg.edit(embed)
        return;
    }

    var key = args[2].toLowerCase()
    var arguments = [...args]
    arguments.splice(0, 3)
    var value = arguments.join(" ")

    const noEmoji = msg.client.emojis.cache.find(emoji => emoji.name === 'vote_no');
    const yesEmoji = msg.client.emojis.cache.find(emoji => emoji.name === 'vote_yes');

    const embed = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setAuthor(strings.moduleName)
        .setTitle(strings.editContextFor + args[1])
        .setDescription(strings.confirm)
        .setFooter(executedBy);
    if (correctRow[key]) {
        if (correctRow[key].length > 1) {
            embed.addFields({ name: strings.oldVal + key, value: correctRow[key] })
        }
    }
    embed.addFields({ name: strings.newVal + key, value: value })
    msg.edit(embed)
    msg.react(yesEmoji).then(() => { msg.react(noEmoji) })

    const filter = (reaction, reacter) => {
        return (reaction.emoji === yesEmoji || reaction.emoji === noEmoji) && reacter.id === message.author.id;
    };

    const collector = msg.createReactionCollector(filter, { time: 10000 });

    collector.on('collect', async (reaction, reacter) => {
        if (reaction.emoji.name === "vote_no") {
            msg.reactions.removeAll()
            collector.stop()
            const embed = new Discord.MessageEmbed()
                .setColor(errorColor)
                .setAuthor(strings.moduleName)
                .setTitle(strings.editContextFor + args[1])
                .setDescription(strings.hitReaction + strings.cancelledPrompt)
                .setFooter(executedBy);
            msg.edit(embed)
            setTimeout(() => {
                message.delete()
                msg.delete()
            }, 5000)
            return;
        }
        if (reaction.emoji.name === "vote_yes") {
            msg.reactions.removeAll()
            collector.stop()
            correctRow[key] = value
            const save = await correctRow.save()
            const result = rows.find(r => r.id === args[1])

            if (!result) {
                const embed = new Discord.MessageEmbed()
                    .setColor(errorColor)
                    .setAuthor(strings.moduleName)
                    .setTitle(strings.editContextFor + args[1])
                    .setDescription(string.edited + string.tryRunGet)
                    .setFooter(executedBy);
                msg.edit(embed)
                return;
            }

            const embed = new Discord.MessageEmbed()
                .setColor(successColor)
                .setAuthor(strings.moduleName)
                .setTitle(strings.editContextFor + args[1])
                .setDescription(strings.editedResult + result.context)
                .setFooter(executedBy);
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
            if (result.ptpt) { if (result.ptpt.length > 1) { embed.addFields({ name: strings.noteFor + strings.portuguese, value: result.ptpt, inline: true }) } }
            if (result.ptbr) { if (result.ptbr.length > 1) { embed.addFields({ name: strings.noteFor + strings.brazilian, value: result.ptbr, inline: true }) } }
            if (result.ru) { if (result.ru.length > 1) { embed.addFields({ name: strings.noteFor + strings.russian, value: result.ru, inline: true }) } }
            if (result.eses) { if (result.eses.length > 1) { embed.addFields({ name: strings.noteFor + strings.spanish, value: result.eses, inline: true }) } }
            if (result.svse) { if (result.svse.length > 1) { embed.addFields({ name: strings.noteFor + strings.swedish, value: result.svse, inline: true }) } }
            if (result.th) { if (result.th.length > 1) { embed.addFields({ name: strings.noteFor + strings.thai, value: result.th, inline: true }) } }
            if (result.tr) { if (result.tr.length > 1) { embed.addFields({ name: strings.noteFor + strings.turkish, value: result.tr, inline: true }) } }
            if (result.uk) { if (result.uk.length > 1) { embed.addFields({ name: strings.noteFor + strings.ukrainian, value: result.uk, inline: true }) } }
            if (result.screenshot) {
                var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
                if (regexp.test(result.screenshot)) {
                    embed.setImage(result.screenshot)
                }
                embed.addFields({ name: strings.screenshot, value: result.screenshot })
            }
            msg.edit(embed)
        }
    })

    collector.on('end', async (collected) => {
        msg.reactions.removeAll()
        var correctRow = rows.find(r => r.id === args[1])
        if (correctRow[key] !== value) {
            const embed = new Discord.MessageEmbed()
                .setColor(errorColor)
                .setAuthor(strings.moduleName)
                .setTitle(strings.editContextFor + args[1])
                .setDescription(strings.errors.didntReply + strings.errors.cancelledPrompt)
                .setFooter(executedBy);
            msg.edit(embed)
        }
        return;
    })
}

async function showInfo(executedBy, strings, message, args, msg) {
    const embed = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setAuthor(strings.moduleName)
        .setTitle(strings.info.title)
        .setDescription(strings.info.description)
        .addFields(
            { name: "Get", value: strings.info.get },
            { name: "Add", value: strings.info.add },
            { name: "Edit", value: strings.info.edit },
            { name: "View", value: strings.info.view },
            { name: "Help", value: strings.info.help },
            { name: "Fields", value: "id, context, screenshot, bg, zhcn, zhtw, cs, da, nl, fi, fr, de, el, it, ja, ko, no, enpt, pl, ptpt, ptbr, ru, eses, svse, th, tr, uk" }
        )
        .setFooter(executedBy);
    msg.edit(embed)
    return;
}

async function viewsheet(executedBy, strings, message, args, msg) {
    const embed = new Discord.MessageEmbed()
        .setColor(successColor)
        .setTitle(strings.info.sheetT)
        .setDescription(strings.info.sheetD)
        .setFooter(executedBy + strings.info.sheetDel);
    msg.edit(embed)
        .then(linkMsg => {
            setTimeout(() => {
                linkMsg.delete()
            }, 120000)
        })
}