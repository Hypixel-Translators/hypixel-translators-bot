const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");
const { GoogleSpreadsheet } = require('google-spreadsheet')
const creds = require('../service-account.json')

module.exports = {
    name: "context",
    description: "Gets, adds or edits context for the given string ID. `+context help` shows you information about this command.",
    usage: "context get|add|edit|view|help <arguments>",
    channelBlackList: ["621298919535804426", "619662798133133312", "712046319375482910", "550951034332381184", "634101000340504576", "713084081579098152"],
    cooldown: 3,
    execute(strings, message, args) {
        const embed = new Discord.MessageEmbed()
            .setColor(workingColor)
            .setAuthor("Context")
            .setTitle("One second...")
            .setDescription("Loading module...")
            .setFooter("Executed by " + message.author.tag);
        message.channel.send(embed)
            .then(msg => {
                if (!message.member.roles.cache.has("569839580971401236") && !message.member.roles.cache.has("569839517444341771")) {
                    const embed = new Discord.MessageEmbed()
                        .setColor(errorColor)
                        .setTitle("Context")
                        .setDescription("You're not a translator or proofreader, so you can't use this!")
                        .setFooter("Executed by " + message.author.tag);
                    msg.edit(embed)
                    return;
                }
                if (args[0] === "new" || args[0] === "add") { addToSpreadsheet(message, args, msg) }
                else if (args[0] === "get") { getFromSpreadsheet(message, args, msg) }
                else if (args[0] === "edit") { editInSpreadsheet(message, args, msg) }
                else if (args[0] === "info" || args[0] === "help") { showInfo(message, args, msg) }
                else if (args[0] === "view" || args[0] === "link") { viewSheet(message, args, msg) }
                else {
                    const embed = new Discord.MessageEmbed()
                        .setColor(errorColor)
                        .setTitle("Context")
                        .setDescription("Please enter a subcommand as first argument. This can either be `get`, `add`, `edit`, `link` or `help`.\nFor information, run `+context help`.")
                        .setFooter("Executed by " + message.author.tag);
                    msg.edit(embed)
                }
                if (message.channel.id === "549894938712866816") {
                    setTimeout(() => {
                        message.delete()
                    }, 60000)
                }
            })
    }
}

async function getFromSpreadsheet(message, args, msg) {
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
            .setTitle("Context for " + args[1])
            .setDescription("That context entry hasn't been found.")
            .setFooter("Executed by " + message.author.tag);
        msg.edit(embed)
        return;
    }

    const embed = new Discord.MessageEmbed()
        .setColor(successColor)
        .setTitle("Context for " + args[1])
        .setDescription(correctRow.context)
        .setFooter("Executed by " + message.author.tag);
    if (correctRow.bg) { if (correctRow.bg.length > 1) { embed.addFields({ name: "Note for Bulgarian", value: correctRow.bg, inline: true }) } }
    if (correctRow.zhcn) { if (correctRow.zhcn.length > 1) { embed.addFields({ name: "Note for Chinese (Simplified)", value: correctRow.zhcn, inline: true }) } }
    if (correctRow.zhtw) { if (correctRow.zhtw.length > 1) { embed.addFields({ name: "Note for Chinese (Traditional)", value: correctRow.zhtw, inline: true }) } }
    if (correctRow.cs) { if (correctRow.cs.length > 1) { embed.addFields({ name: "Note for Czech", value: correctRow.cs, inline: true }) } }
    if (correctRow.da) { if (correctRow.da.length > 1) { embed.addFields({ name: "Note for Danish", value: correctRow.da, inline: true }) } }
    if (correctRow.nl) { if (correctRow.nl.length > 1) { embed.addFields({ name: "Note for Dutch", value: correctRow.nl, inline: true }) } }
    if (correctRow.fi) { if (correctRow.fi.length > 1) { embed.addFields({ name: "Note for Finnish", value: correctRow.fi, inline: true }) } }
    if (correctRow.fr) { if (correctRow.fr.length > 1) { embed.addFields({ name: "Note for French", value: correctRow.fr, inline: true }) } }
    if (correctRow.de) { if (correctRow.de.length > 1) { embed.addFields({ name: "Note for German", value: correctRow.de, inline: true }) } }
    if (correctRow.el) { if (correctRow.el.length > 1) { embed.addFields({ name: "Note for Greek", value: correctRow.el, inline: true }) } }
    if (correctRow.it) { if (correctRow.it.length > 1) { embed.addFields({ name: "Note for Italian", value: correctRow.it, inline: true }) } }
    if (correctRow.ja) { if (correctRow.ja.length > 1) { embed.addFields({ name: "Note for Japanese", value: correctRow.ja, inline: true }) } }
    if (correctRow.ko) { if (correctRow.ko.length > 1) { embed.addFields({ name: "Note for Korean", value: correctRow.ko, inline: true }) } }
    if (correctRow.no) { if (correctRow.no.length > 1) { embed.addFields({ name: "Note for Norwegian", value: correctRow.no, inline: true }) } }
    if (correctRow.enPT) { if (correctRow.enPT.length > 1) { embed.addFields({ name: "Note for Pirate", value: correctRow.enPT, inline: true }) } }
    if (correctRow.pl) { if (correctRow.pl.length > 1) { embed.addFields({ name: "Note for Polish", value: correctRow.pl, inline: true }) } }
    if (correctRow.ptpt) { if (correctRow.ptpt.length > 1) { embed.addFields({ name: "Note for Portuguese", value: correctRow.ptpt, inline: true }) } }
    if (correctRow.ptbr) { if (correctRow.ptbr.length > 1) { embed.addFields({ name: "Note for Brazilian", value: correctRow.ptbr, inline: true }) } }
    if (correctRow.ru) { if (correctRow.ru.length > 1) { embed.addFields({ name: "Note for Russian", value: correctRow.ru, inline: true }) } }
    if (correctRow.eses) { if (correctRow.eses.length > 1) { embed.addFields({ name: "Note for Spanish", value: correctRow.eses, inline: true }) } }
    if (correctRow.svse) { if (correctRow.svse.length > 1) { embed.addFields({ name: "Note for Swedish", value: correctRow.svse, inline: true }) } }
    if (correctRow.th) { if (correctRow.th.length > 1) { embed.addFields({ name: "Note for Thai", value: correctRow.th, inline: true }) } }
    if (correctRow.tr) { if (correctRow.tr.length > 1) { embed.addFields({ name: "Note for Turkish", value: correctRow.tr, inline: true }) } }
    if (correctRow.uk) { if (correctRow.uk.length > 1) { embed.addFields({ name: "Note for Ukrainian", value: correctRow.uk, inline: true }) } }
    if (correctRow.screenshot) {
        var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
        if (regexp.test(correctRow.screenshot)) {
            embed.setImage(correctRow.screenshot)
        }
        embed.addFields({ name: "Screenshot", value: correctRow.screenshot })
    }
    msg.edit(embed)
}

async function addToSpreadsheet(message, args, msg) {
    const string = args[1]
    var toSend = [...args]
    toSend.splice(0, 2)
    toSend = toSend.join(" ")

    if (!message.member.roles.cache.has("569839580971401236") && !message.member.hasPermission("ADMINISTRATOR")) {
        const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setTitle("Add context for " + string)
            .setDescription("You're not a proofreader, so you can't add context! We're working on a way to let you suggest context too.")
            .setFooter("Executed by " + message.author.tag);
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
            .setTitle("Add context for " + string)
            .setDescription("An context entry for " + string + " already exists, so yours wasn't added. Instead, use `+context edit`.")
            .setFooter("Executed by " + message.author.tag);
        msg.edit(embed)
        return;
    }

    var toAdd = { id: string, context: toSend }
    const embed = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setTitle("Add context for " + string)
        .setDescription("The following entry will be added. Please react with 📑 if you'd like to add more to the entry or change existing fields (such as a screenshot or a language note). React with <:vote_yes:732298639749152769> to submit. This will be cancelled in two minutes or when you hit <:vote_no:732298639736570007>.")
        .addFields(
            { name: "String ID", value: string },
            { name: "Context", value: toSend }
        )
        .setFooter("Executed by " + message.author.tag);
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
                const collectorB = new Discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: 120000 });
                const extraEmbed = new Discord.MessageEmbed()
                    .setColor(neutralColor)
                    .setTitle("Add more to context for " + string)
                    .setDescription("Send a message (without the prefix) containing `<field> <content>`. <field> can be `screenshot`, `id`, `context` or a language code. <content> needs to be the (new) content for that string, such as the screenshot link.")
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
                            .setTitle("Add more to context for " + string)
                            .setDescription("Added this information to the context entry. Re-add your reaction to add more info.")
                            .addFields({ name: key, value: value })
                        extraMsg.edit(extraEmbed)
                    })

                    collectorB.on('end', function () {
                        const extraEmbed = new Discord.MessageEmbed()
                            .setColor(errorColor)
                            .setTitle("Add more to context for " + string)
                            .setDescription("You didn't reply in time, so this prompt has been cancelled. Re-add your reaction to try again.")
                        extraMsg.edit(extraEmbed)
                    })

                })
            }
            if (reaction.emoji.name === "vote_yes") {
                msg.reactions.removeAll()
                const result = await sheet.addRow(toAdd)
                const embed = new Discord.MessageEmbed()
                    .setColor(workingColor)
                    .setTitle("Add context for " + string)
                    .setDescription("Added the context entry! Loading the result...")
                    .setFooter("Executed by " + message.author.tag);
                msg.channel.send(embed)
                    .then(finalMsg => {
                        msg.delete()

                        if (!result) {
                            const embed = new Discord.MessageEmbed()
                                .setColor(errorColor)
                                .setTitle("Add context for " + string)
                                .setDescription("The context entry hasn't been found. Try using `+context get` to see the results.")
                                .setFooter("Executed by " + message.author.tag);
                            finalMsg.edit(embed)
                            return;
                        }

                        embed
                            .setColor(successColor)
                            .setTitle("Add context for " + string)
                            .setDescription("Added the context entry! It is shown below.\n\n**Context**\n" + result.context)
                            .setFooter("Executed by " + message.author.tag);
                        if (result.bg) { if (result.bg.length > 1) { embed.addFields({ name: "Note for Bulgarian", value: result.bg, inline: true }) } }
                        if (result.zhcn) { if (result.zhcn.length > 1) { embed.addFields({ name: "Note for Chinese (Simplified)", value: result.zhcn, inline: true }) } }
                        if (result.zhtw) { if (result.zhtw.length > 1) { embed.addFields({ name: "Note for Chinese (Traditional)", value: result.zhtw, inline: true }) } }
                        if (result.cs) { if (result.cs.length > 1) { embed.addFields({ name: "Note for Czech", value: result.cs, inline: true }) } }
                        if (result.da) { if (result.da.length > 1) { embed.addFields({ name: "Note for Danish", value: result.da, inline: true }) } }
                        if (result.nl) { if (result.nl.length > 1) { embed.addFields({ name: "Note for Dutch", value: result.nl, inline: true }) } }
                        if (result.fi) { if (result.fi.length > 1) { embed.addFields({ name: "Note for Finnish", value: result.fi, inline: true }) } }
                        if (result.fr) { if (result.fr.length > 1) { embed.addFields({ name: "Note for French", value: result.fr, inline: true }) } }
                        if (result.de) { if (result.de.length > 1) { embed.addFields({ name: "Note for German", value: result.de, inline: true }) } }
                        if (result.el) { if (result.el.length > 1) { embed.addFields({ name: "Note for Greek", value: result.el, inline: true }) } }
                        if (result.it) { if (result.it.length > 1) { embed.addFields({ name: "Note for Italian", value: result.it, inline: true }) } }
                        if (result.ja) { if (result.ja.length > 1) { embed.addFields({ name: "Note for Japanese", value: result.ja, inline: true }) } }
                        if (result.ko) { if (result.ko.length > 1) { embed.addFields({ name: "Note for Korean", value: result.ko, inline: true }) } }
                        if (result.no) { if (result.no.length > 1) { embed.addFields({ name: "Note for Norwegian", value: result.no, inline: true }) } }
                        if (result.enPT) { if (result.enPT.length > 1) { embed.addFields({ name: "Note for Pirate", value: result.enPT, inline: true }) } }
                        if (result.pl) { if (result.pl.length > 1) { embed.addFields({ name: "Note for Polish", value: result.pl, inline: true }) } }
                        if (result.ptpt) { if (result.ptpt.length > 1) { embed.addFields({ name: "Note for Portuguese", value: result.ptpt, inline: true }) } }
                        if (result.ptbr) { if (result.ptbr.length > 1) { embed.addFields({ name: "Note for Brazilian", value: result.ptbr, inline: true }) } }
                        if (result.ru) { if (result.ru.length > 1) { embed.addFields({ name: "Note for Russian", value: result.ru, inline: true }) } }
                        if (result.eses) { if (result.eses.length > 1) { embed.addFields({ name: "Note for Spanish", value: result.eses, inline: true }) } }
                        if (result.svse) { if (result.svse.length > 1) { embed.addFields({ name: "Note for Swedish", value: result.svse, inline: true }) } }
                        if (result.th) { if (result.th.length > 1) { embed.addFields({ name: "Note for Thai", value: result.th, inline: true }) } }
                        if (result.tr) { if (result.tr.length > 1) { embed.addFields({ name: "Note for Turkish", value: result.tr, inline: true }) } }
                        if (result.uk) { if (result.uk.length > 1) { embed.addFields({ name: "Note for Ukrainian", value: result.uk, inline: true }) } }
                        if (result.screenshot) {
                            var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
                            if (regexp.test(result.screenshot)) {
                                embed.setImage(result.screenshot)
                            }
                            embed.addFields({ name: "Screenshot", value: result.screenshot })
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
                    .setTitle("Add context for " + string)
                    .setDescription("You cancelled this prompt, so nothing was saved.")
                    .setFooter("Executed by " + message.author.tag);
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
                .setTitle("Add context for " + string)
                .setDescription("You cancelled this prompt. Cleaning up...")
                .setFooter("Executed by " + message.author.tag);
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

async function editInSpreadsheet(message, args, msg) {
    if (!message.member.roles.cache.has("569839580971401236") && !message.member.hasPermission("ADMINISTRATOR")) {
        const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setTitle("Edit context for " + args[1])
            .setDescription("You're not a proofreader, so you can't edit context! We're working on a way to let you suggest context too.")
            .setFooter("Executed by " + message.author.tag);
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
            .setTitle("Edit context for " + args[1])
            .setDescription("That context entry hasn't been found.")
            .setFooter("Executed by " + message.author.tag);
        msg.edit(embed)
        return;
    }

    if (!args[3]) {
        const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setTitle("Edit context for " + args[1])
            .setDescription("You forgot to specify what field to edit!\nPlease follow this format: `+context edit " + args[1] + " <field to change> <new value>`.\nTo see all available fields, run `+context help`.")
            .setFooter("Executed by " + message.author.tag);
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
        .setTitle("Edit context for " + args[1])
        .setDescription("Please confirm you want to edit a field of " + args[1] + " by reacting. You have 10 seconds.")
        .setFooter("Executed by " + message.author.tag);
    if (correctRow[key]) {
        if (correctRow[key].length > 1) {
            embed.addFields({ name: "Old value for " + key, value: correctRow[key] })
        }
    }
    embed.addFields({ name: "New value for " + key, value: value })
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
                .setTitle("Edit context for " + args[1])
                .setDescription("You cancelled this prompt, so nothing was saved.")
                .setFooter("Executed by " + message.author.tag);
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
                    .setTitle("Edit context for " + args[1])
                    .setDescription("Edited this context entry, but the resulting context entry hasn't been found. If you edited the string ID, you need to run `+context get <new string ID>` to see the result.")
                    .setFooter("Executed by " + message.author.tag);
                msg.edit(embed)
                return;
            }

            const embed = new Discord.MessageEmbed()
                .setColor(successColor)
                .setTitle("Edit context for " + args[1])
                .setDescription("Edited this context entry! The new data is shown below.\n\n**Context**\n" + result.context)
                .setFooter("Executed by " + message.author.tag);
            if (result.bg) { if (result.bg.length > 1) { embed.addFields({ name: "Note for Bulgarian", value: result.bg, inline: true }) } }
            if (result.zhcn) { if (result.zhcn.length > 1) { embed.addFields({ name: "Note for Chinese (Simplified)", value: result.zhcn, inline: true }) } }
            if (result.zhtw) { if (result.zhtw.length > 1) { embed.addFields({ name: "Note for Chinese (Traditional)", value: result.zhtw, inline: true }) } }
            if (result.cs) { if (result.cs.length > 1) { embed.addFields({ name: "Note for Czech", value: result.cs, inline: true }) } }
            if (result.da) { if (result.da.length > 1) { embed.addFields({ name: "Note for Danish", value: result.da, inline: true }) } }
            if (result.nl) { if (result.nl.length > 1) { embed.addFields({ name: "Note for Dutch", value: result.nl, inline: true }) } }
            if (result.fi) { if (result.fi.length > 1) { embed.addFields({ name: "Note for Finnish", value: result.fi, inline: true }) } }
            if (result.fr) { if (result.fr.length > 1) { embed.addFields({ name: "Note for French", value: result.fr, inline: true }) } }
            if (result.de) { if (result.de.length > 1) { embed.addFields({ name: "Note for German", value: result.de, inline: true }) } }
            if (result.el) { if (result.el.length > 1) { embed.addFields({ name: "Note for Greek", value: result.el, inline: true }) } }
            if (result.it) { if (result.it.length > 1) { embed.addFields({ name: "Note for Italian", value: result.it, inline: true }) } }
            if (result.ja) { if (result.ja.length > 1) { embed.addFields({ name: "Note for Japanese", value: result.ja, inline: true }) } }
            if (result.ko) { if (result.ko.length > 1) { embed.addFields({ name: "Note for Korean", value: result.ko, inline: true }) } }
            if (result.no) { if (result.no.length > 1) { embed.addFields({ name: "Note for Norwegian", value: result.no, inline: true }) } }
            if (result.enPT) { if (result.enPT.length > 1) { embed.addFields({ name: "Note for Pirate", value: result.enPT, inline: true }) } }
            if (result.pl) { if (result.pl.length > 1) { embed.addFields({ name: "Note for Polish", value: result.pl, inline: true }) } }
            if (result.ptpt) { if (result.ptpt.length > 1) { embed.addFields({ name: "Note for Portuguese", value: result.ptpt, inline: true }) } }
            if (result.ptbr) { if (result.ptbr.length > 1) { embed.addFields({ name: "Note for Brazilian", value: result.ptbr, inline: true }) } }
            if (result.ru) { if (result.ru.length > 1) { embed.addFields({ name: "Note for Russian", value: result.ru, inline: true }) } }
            if (result.eses) { if (result.eses.length > 1) { embed.addFields({ name: "Note for Spanish", value: result.eses, inline: true }) } }
            if (result.svse) { if (result.svse.length > 1) { embed.addFields({ name: "Note for Swedish", value: result.svse, inline: true }) } }
            if (result.th) { if (result.th.length > 1) { embed.addFields({ name: "Note for Thai", value: result.th, inline: true }) } }
            if (result.tr) { if (result.tr.length > 1) { embed.addFields({ name: "Note for Turkish", value: result.tr, inline: true }) } }
            if (result.uk) { if (result.uk.length > 1) { embed.addFields({ name: "Note for Ukrainian", value: result.uk, inline: true }) } }
            if (result.screenshot) {
                var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
                if (regexp.test(result.screenshot)) {
                    embed.setImage(result.screenshot)
                }
                embed.addFields({ name: "Screenshot", value: result.screenshot })
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
                .setTitle("Edit context for " + args[1])
                .setDescription("You didn't react, so nothing was saved.")
                .setFooter("Executed by " + message.author.tag);
            msg.edit(embed)
        }
        return;
    })
}

async function showInfo(message, args, msg) {
    const embed = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setTitle("Context information")
        .setDescription("Below is a list of all subcommands for this command and their explanations. **Fields** shows all available fields.")
        .addFields(
            { name: "Get", value: "_Gets context for given string_\n`+context get <string ID>`\n\nReplace <string ID> with the ID of the string, found by copying the string URL. It's the number after the #." },
            { name: "Add", value: "_Adds a context entry_\n`+context add <string ID> <context>`\n\nReplace <string ID> with the ID of the string, found by copying the string URL. It's the number after the #. Replace <context> with the text you want to add. After running, you can add more fields using the reactions." },
            { name: "Edit", value: "_Edits an existing context entry_\n`+context edit <string ID> <field> <new value>`\n\nReplace <string ID> with the ID of the string, found by copying the string URL. It's the number after the #. Replace <field> with the field you want to edit, such as `screenshot` or `enPT`. Replace <new value> with the new value for that field." },
            { name: "View", value: "_Gives you a link to the Google Sheet containing context_\n`+context view`" },
            { name: "Help", value: "_Shows this message!_\n`+context help`" },
            { name: "Fields", value: "id, context, screenshot, bg, zhcn, zhtw, cs, da, nl, fi, fr, de, el, it, ja, ko, no, enPT, pl, ptpt, ptbr, ru, eses, svse, th, tr, uk" }
        )
        .setFooter("Executed by " + message.author.tag);
    msg.edit(embed)
    return;
}

async function viewSheet(message, args, msg) {
    const embed = new Discord.MessageEmbed()
        .setColor(successColor)
        .setTitle("Context sheet")
        .setDescription("[Click here to open the Google Sheet containing context information.](https://docs.google.com/spreadsheets/d/1tVLWskn4InBeopmRdQyrDumr1H6STqyidcEwoL4a8ts)\n\nOnly specific people can open this sheet. You can request access on the page you see when following the link. Please fill in your Crowdin profile link (`.../profile/<username>`) and your Discord username.\nKeep in mind Stannya, Rodry and QkeleQ10 can see your Google profile name and email.")
        .setFooter("Executed by " + message.author.tag + " | Deleting message after 2 minutes");
    msg.edit(embed)
        .then(linkMsg => {
            setTimeout(() => {
                linkMsg.delete()
            }, 120000)
        })
}