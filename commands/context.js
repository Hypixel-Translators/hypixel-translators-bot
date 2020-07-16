const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");
const { GoogleSpreadsheet } = require('google-spreadsheet')
const creds = require('../service-account.json')

module.exports = {
    name: "context",
    description: "",
    usage: "context <string ID> ['edit'] ['context'|'screenshot'|note language code] [new value]",
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
                if (args[1]) {
                    editRow(message, args, msg)
                } else { accessSpreadsheet(message, args, msg) }
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

    const embed = new Discord.MessageEmbed()
        .setColor(successColor)
        .setTitle("Context for " + args[0])
        .setDescription("This system is in the testing phase. No actual data can be written.")
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

async function editRow(message, args, msg) {
    var arguments = args
    arguments.splice(0, 3)

    const doc = new GoogleSpreadsheet('1tVLWskn4InBeopmRdQyrDumr1H6STqyidcEwoL4a8ts')
    await doc.useServiceAccountAuth(creds)

    await doc.loadInfo()
    console.log(doc.title)

    const sheet = doc.sheetsByIndex[0]
    console.log(sheet.title)

    const rows = await sheet.getRows()

    const correctRow = rows.find(r => r.id === args[0])
    console.log(correctRow)

    const newRow = correctRow
    const oldRowNumber = Number(correctRow.rowNumber.substring(1)) - 2
    rows[oldRowNumber].delete()
    if (args[2] === "context") { newRow.context = arguments }
    sheet.addRows(newRow)
}