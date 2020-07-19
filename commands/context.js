const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");
const { GoogleSpreadsheet } = require('google-spreadsheet')
const creds = require('../service-account.json')

module.exports = {
    name: "context",
    description: "Gets or adds context for the given string ID.",
    usage: "context get|add <string ID> [context (when adding)]",
    channelBlackList: ["621298919535804426", "619662798133133312", "712046319375482910", "550951034332381184", "634101000340504576", "713084081579098152"],
    cooldown: 3,
    execute(message, args) {
        const embed = new Discord.MessageEmbed()
            .setColor(workingColor)
            .setTitle("Context for " + args[1])
            .setDescription("One second...")
            .setFooter("Executed by " + message.author.tag);
        message.channel.send(embed)
            .then(msg => {
                if (args[0] === "new" || args[0] === "add") { addToSpreadsheet(message, args, msg) }
                if (args[0] === "get" || args[0] === "add") { getFromSpreadsheet(message, args, msg) }
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
    if (correctRow) {
        if (correctRow.bg) { if (correctRow.bg.length > 1) { embed.addFields({ name: "Note for Bulgarian", value: correctRow.bg, inline: true }) } }
        if (correctRow.zhCN) { if (correctRow.zhCN.length > 1) { embed.addFields({ name: "Note for Chinese (Simplified)", value: correctRow.zhCN, inline: true }) } }
        if (correctRow.zhTW) { if (correctRow.zhTW.length > 1) { embed.addFields({ name: "Note for Chinese (Traditional)", value: correctRow.zhTW, inline: true }) } }
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
        if (correctRow.enPT) { if (correctRow.enPT.length > 1) { embed.addFields({ name: "Note fer Pirate ☠️", value: correctRow.enPT, inline: true }) } }
        if (correctRow.pl) { if (correctRow.pl.length > 1) { embed.addFields({ name: "Note for Polish", value: correctRow.pl, inline: true }) } }
        if (correctRow.ptPT) { if (correctRow.ptPT.length > 1) { embed.addFields({ name: "Note for Portuguese", value: correctRow.ptPT, inline: true }) } }
        if (correctRow.ptBR) { if (correctRow.ptBR.length > 1) { embed.addFields({ name: "Note for Brazilian", value: correctRow.ptBR, inline: true }) } }
        if (correctRow.ru) { if (correctRow.ru.length > 1) { embed.addFields({ name: "Note for Russian", value: correctRow.ru, inline: true }) } }
        if (correctRow.esES) { if (correctRow.esES.length > 1) { embed.addFields({ name: "Note for Spanish", value: correctRow.esES, inline: true }) } }
        if (correctRow.svSE) { if (correctRow.svSE.length > 1) { embed.addFields({ name: "Note for Swedish", value: correctRow.svSE, inline: true }) } }
        if (correctRow.th) { if (correctRow.th.length > 1) { embed.addFields({ name: "Note for Thai", value: correctRow.th, inline: true }) } }
        if (correctRow.tr) { if (correctRow.tr.length > 1) { embed.addFields({ name: "Note for Turkish", value: correctRow.tr, inline: true }) } }
        if (correctRow.uk) { if (correctRow.uk.length > 1) { embed.addFields({ name: "Note for Ukrainian", value: correctRow.uk, inline: true }) } }
        if (correctRow.screenshot) {
            embed.setImage(correctRow.screenshot)
                .addFields({ name: "Screenshot", value: correctRow.screenshot, inline: true })
        }
        msg.edit(embed)
    }
}

async function addToSpreadsheet(message, args, msg) {
    if (message.member.roles.cache.has("569839517444341771") || message.member.hasPermission("ADMINISTRATOR")) { } else {
        const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setTitle("Add context for " + string)
            .setDescription("You're not a proofreader, so you can't add context! Soon you'll be able to suggest context though.")
            .setFooter("Executed by " + message.author.tag);
        msg.edit(embed)
        return;
    }

    const string = args[1]
    var toSend = args
    toSend.splice(0, 2)
    toSend = toSend.join(" ")

    const doc = new GoogleSpreadsheet('1tVLWskn4InBeopmRdQyrDumr1H6STqyidcEwoL4a8ts')
    await doc.useServiceAccountAuth(creds)

    await doc.loadInfo()
    console.log(doc.title)

    const sheet = doc.sheetsByIndex[0]
    console.log(sheet.title)

    const rows = await sheet.getRows()


    var toAdd = { id: string, context: toSend }
    const embed = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setTitle("Add context for " + string)
        .setDescription("The following entry will be added. Please react with 📑 if you'd like to add more to the entry or change existing fields (such as a screenshot or a language note). React with ✅ to submit. This will be cancelled in two minutes.")
        .addFields(
            { name: "String ID", value: string },
            { name: "Context", value: toSend }
        )
        .setFooter("Executed by " + message.author.tag);
    msg.edit(embed).then(msg => {
        msg.react("📑").then(() => {
            msg.react("✅")
            const filter = (reaction, reacter) => {
                return (reaction.emoji.name === "📑" || reaction.emoji.name === "✅") && reacter.id === message.author.id;
            };

            const collector = msg.createReactionCollector(filter, { time: 120000 });

            collector.on('collect', async (reaction, reacter) => {
                if (reaction.emoji.name === "📑") {
                    reaction.remove()
                    msg.react("📑")
                    const collector = new Discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: 60000 });
                    const extraEmbed = new Discord.MessageEmbed()
                        .setColor(neutralColor)
                        .setTitle("Add more to context for " + string)
                        .setDescription("Send a message (without the prefix) containing `<field> <content>`. <field> can be `screenshot`, `id`, `context` or a language code. <content> needs to be the (new) content for that string, such as the screenshot link.")
                    msg.channel.send(extraEmbed).then(extraMsg => {

                        collector.on('collect', received => {
                            collector.stop()
                            var key = received.toString()
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

                        collector.on('end'), collected => {
                            if (!collected) {
                                const extraEmbed = new Discord.MessageEmbed()
                                    .setColor(errorColor)
                                    .setTitle("Add more to context for " + string)
                                    .setDescription("You didn't reply in time, so this prompt has been cancelled. Re-add your reaction to try again.")
                                extraMsg.edit(extraEmbed)
                            }
                        }

                    })
                }
                if (reaction.emoji.name === "✅") {
                    msg.reactions.removeAll()
                    collector.stop()
                    const result = await sheet.addRow(toAdd)
                    const embed = new Discord.MessageEmbed()
                        .setColor(successColor)
                        .setTitle("Add context for " + string)
                        .setDescription("The context entry has been added! Execute `+context get " + result.id + "` to view the result.")
                        .setFooter("Executed by " + message.author.tag);
                    msg.edit(embed)
                    msg.channel.send(embed)
                }
            })
            collector.on('end'), collected => {
                if (!collected && !result) {
                    const embed = new Discord.MessageEmbed()
                        .setColor(errorColor)
                        .setTitle("Add context for " + string)
                        .setDescription("You didn't reply in time, so the adding of the entry has been cancelled.")
                    msg.edit(embed)
                }
            }
        })
    })
}