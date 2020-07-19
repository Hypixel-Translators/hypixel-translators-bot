const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");
const { GoogleSpreadsheet } = require('google-spreadsheet')
const creds = require('../service-account.json')

module.exports = {
    name: "context",
    description: "Gets or adds context for the given string ID.",
    usage: "context <string ID>\n+context add <string ID> <context>",
    categoryBlackList: ["549503328472530975"],
    cooldown: 3,
    execute(message, args) {
        const embed = new Discord.MessageEmbed()
            .setColor(workingColor)
            .setTitle("Context for " + args[0])
            .setDescription("One second...")
            .setFooter("Executed by " + message.author.tag);
        message.channel.send(embed)
            .then(msg => {
                if (args[0] === "new" || args[0] === "add") { addToSpreadsheet(message, args, msg) } else { accessSpreadsheet(message, args, msg) }
            })
    }
}

async function accessSpreadsheet(message, args, msg) {
    const doc = new GoogleSpreadsheet('1tVLWskn4InBeopmRdQyrDumr1H6STqyidcEwoL4a8ts')
    await doc.useServiceAccountAuth(creds)

    await doc.loadInfo()
    console.log(doc.title)

    const sheet = doc.sheetsByIndex[0]
    console.log(sheet.title)

    const rows = await sheet.getRows()
    const correctRow = rows.find(r => r.id === args[0])


    if (args[1]) {
        if (args[1] === "delete") {
            if (!message.member.roles.cache.has("Hypixel Proofreader")) {
                const embed = new Discord.MessageEmbed()
                    .setColor(errorColor)
                    .setTitle("Delete context for " + args[0])
                    .setDescription("You can't delete that context entry because you're not a Hypixel Proofreader.")
                    .setFooter("Executed by " + message.author.tag);
                msg.edit(embed)
                return;
            }
            correctRow.delete()
            const embed = new Discord.MessageEmbed()
                .setColor(successColor)
                .setTitle("Delete context for " + args[0])
                .setDescription("The context entry has been deleted!")
                .setFooter("Executed by " + message.author.tag);
            msg.edit(embed)
            return;
        }
    }

    if (!correctRow) {
        const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setTitle("Context for " + args[0])
            .setDescription("That context entry hasn't been found.")
            .setFooter("Executed by " + message.author.tag);
        msg.edit(embed)
        return;
    }

    const embed = new Discord.MessageEmbed()
        .setColor(successColor)
        .setTitle("Context for " + args[0])
        .addFields({ name: "Context", value: correctRow.context })
        .setFooter("Executed by " + message.author.tag);
    if (correctRow) {
        if (correctRow.screenshot) { embed.setImage(correctRow.screenshot) }

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

        msg.edit(embed)
    }
}

async function addToSpreadsheet(message, args, msg) {
    const doc = new GoogleSpreadsheet('1tVLWskn4InBeopmRdQyrDumr1H6STqyidcEwoL4a8ts')
    await doc.useServiceAccountAuth(creds)

    await doc.loadInfo()
    console.log(doc.title)

    const sheet = doc.sheetsByIndex[0]
    console.log(sheet.title)

    const rows = await sheet.getRows()


    var toAdd = { id: args[1], context: args[2] }
    const embed = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setTitle("Add context for " + args[0])
        .setDescription("The following entry will be added. Please react with 📑 if you'd like to add more to the entry or change existing fields (such as a screenshot or a language note). React with ✅ to submit. This will be cancelled in two minutes.")
        .addFields(
            { name: "String ID", value: args[1] },
            { name: "Context", value: args[2] }
        )
        .setFooter("Executed by " + message.author.tag);
    msg.edit(embed).then(msg => {
        msg.react("📑").then(() => {
            msg.react("✅")
            const filter = (reaction, reacter) => {
                return (reaction.emoji.name === "📑" || reaction.emoji.name === "✅") && reacter.id === message.author.id;
            };

            const collector = msg.createReactionCollector(filter, { time: 20000 });

            collector.on('collect', async (reaction, reacter) => {
                if (reaction.emoji.name === "📑") {
                    const collector = new Discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: 10000 });
                    const extraEmbed = new Discord.MessageEmbed()
                        .setColor(neutralColor)
                        .setTitle("Add more to context for " + args[0])
                        .setDescription("Send `screenshot <image link>` to add a screenshot, or send `<language code (e.g. enPT)> <note>` to add a language note. You can also edit existing fields using `<id|context> <new value`.")
                    msg.channel.send(extraEmbed).then(extraMsg => {

                        collector.on('collect', received => {
                            var key = received.toString()
                            key = key.replace(/ .*/, '')
                            var value = received.toString()
                            value = value.substr(value.indexOf(" ") + 1)
                            toAdd[key] = value
                            const extraEmbed = new Discord.MessageEmbed()
                                .setColor(successColor)
                                .setTitle("Add more to context for " + args[0])
                                .setDescription("Added this information to the context entry:")
                                .addFields({ name: key, value: value })
                            extraMsg.edit(extraEmbed)
                        })

                    })
                }
                if (reaction.emoji.name === "✅") {
                    const result = await sheet.addRow(toAdd)
                    const embed = new Discord.MessageEmbed()
                        .setColor(successColor)
                        .setTitle("Add context for " + args[0])
                        .setDescription("The following entry will be added. Please react with 📑 if you'd like to add more to the entry (such as `screenshot` or a language note in the format `enPT`). React with ✅ to submit. This will be cancelled in two minutes.")
                        .addFields(
                            { name: "String ID", value: result.id },
                            { name: "Context", value: result.context }
                        )
                        .setFooter("Executed by " + message.author.tag);
                    if (result.bg) { if (result.bg.length > 1) { embed.addFields({ name: "Note for Bulgarian", value: result.bg, inline: true }) } }
                    if (result.zhCN) { if (result.zhCN.length > 1) { embed.addFields({ name: "Note for Chinese (Simplified)", value: result.zhCN, inline: true }) } }
                    if (result.zhTW) { if (result.zhTW.length > 1) { embed.addFields({ name: "Note for Chinese (Traditional)", value: result.zhTW, inline: true }) } }
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
                    if (result.enPT) { if (result.enPT.length > 1) { embed.addFields({ name: "Note fer Pirate ☠️", value: result.enPT, inline: true }) } }
                    if (result.pl) { if (result.pl.length > 1) { embed.addFields({ name: "Note for Polish", value: result.pl, inline: true }) } }
                    if (result.ptPT) { if (result.ptPT.length > 1) { embed.addFields({ name: "Note for Portuguese", value: result.ptPT, inline: true }) } }
                    if (result.ptBR) { if (result.ptBR.length > 1) { embed.addFields({ name: "Note for Brazilian", value: result.ptBR, inline: true }) } }
                    if (result.ru) { if (result.ru.length > 1) { embed.addFields({ name: "Note for Russian", value: result.ru, inline: true }) } }
                    if (result.esES) { if (result.esES.length > 1) { embed.addFields({ name: "Note for Spanish", value: result.esES, inline: true }) } }
                    if (result.svSE) { if (result.svSE.length > 1) { embed.addFields({ name: "Note for Swedish", value: result.svSE, inline: true }) } }
                    if (result.th) { if (result.th.length > 1) { embed.addFields({ name: "Note for Thai", value: result.th, inline: true }) } }
                    if (result.tr) { if (result.tr.length > 1) { embed.addFields({ name: "Note for Turkish", value: result.tr, inline: true }) } }
                    if (result.uk) { if (result.uk.length > 1) { embed.addFields({ name: "Note for Ukrainian", value: result.uk, inline: true }) } }
                    msg.edit(embed)
                }
            })
        })
    })
}