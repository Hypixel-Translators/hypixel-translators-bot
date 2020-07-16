const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");
const { GoogleSpreadsheet } = require('google-spreadsheet')
const { promisify } = require('util')
const creds = require('../service-account.json')

module.exports = {
    name: "context",
    description: "",
    usage: "context <string ID> [language code]",
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
                accessSpreadsheet(message, args, msg)
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
    console.log(rows)

    const correctRow = rows.find(r => r.id === args[0])

    const embed = new Discord.MessageEmbed()
        .setColor(successColor)
        .setTitle("Context for " + args[0])
        .setDescription("This system is in the testing phase. No actual data can be written.")
        .addFields(
            { name: "String ID", value: correctRow.id },
            { name: "Context", value: correctRow.context }
        )
        .setFooter("Executed by " + message.author.tag);
    if (correctRow.screenshot) { embed.setImage(correctRow.screenshot) }

    if (correctRow.bg.length > 1) { embed.addFields({ name: "Note for Bulgarian", value: correctRow.bg }) }
    if (correctRow.zhCN.length > 1) { embed.addFields({ name: "Note for Chinese (Simplified)", value: correctRow.zhCN }) }
    if (correctRow.zhTW.length > 1) { embed.addFields({ name: "Note for Chinese (Traditional)", value: correctRow.zhTW }) }
    if (correctRow.cs.length > 1) { embed.addFields({ name: "Note for Czech", value: correctRow.cs }) }
    if (correctRow.da.length > 1) { embed.addFields({ name: "Note for Danish", value: correctRow.da }) }
    if (correctRow.nl.length > 1) { embed.addFields({ name: "Note for Dutch", value: correctRow.nl }) }
    if (correctRow.fi.length > 1) { embed.addFields({ name: "Note for Finnish", value: correctRow.fi }) }
    if (correctRow.fr.length > 1) { embed.addFields({ name: "Note for French", value: correctRow.fr }) }
    if (correctRow.de.length > 1) { embed.addFields({ name: "Note for German", value: correctRow.de }) }
    if (correctRow.el.length > 1) { embed.addFields({ name: "Note for Greek", value: correctRow.el }) }
    if (correctRow.it.length > 1) { embed.addFields({ name: "Note for Italian", value: correctRow.it }) }
    if (correctRow.ja.length > 1) { embed.addFields({ name: "Note for Japanese", value: correctRow.ja }) }
    if (correctRow.ko.length > 1) { embed.addFields({ name: "Note for Korean", value: correctRow.ko }) }
    if (correctRow.no.length > 1) { embed.addFields({ name: "Note for Norwegian", value: correctRow.no }) }
    if (correctRow.enPT.length > 1) { embed.addFields({ name: "Note fer Pirate ☠️", value: correctRow.enPT }) }
    if (correctRow.pl.length > 1) { embed.addFields({ name: "Note for Polish", value: correctRow.pl }) }
    if (correctRow.ptPT.length > 1) { embed.addFields({ name: "Note for Portuguese", value: correctRow.ptPT }) }
    if (correctRow.ptBR.length > 1) { embed.addFields({ name: "Note for Brazilian", value: correctRow.ptBR }) }
    if (correctRow.ru.length > 1) { embed.addFields({ name: "Note for Russian", value: correctRow.ru }) }
    if (correctRow.esES.length > 1) { embed.addFields({ name: "Note for Spanish", value: correctRow.esES }) }
    if (correctRow.svSE.length > 1) { embed.addFields({ name: "Note for Swedish", value: correctRow.svSE }) }
    if (correctRow.th.length > 1) { embed.addFields({ name: "Note for Thai", value: correctRow.th }) }
    if (correctRow.tr.length > 1) { embed.addFields({ name: "Note for Turkish", value: correctRow.tr }) }
    if (correctRow.uk.length > 1) { embed.addFields({ name: "Note for Ukrainian", value: correctRow.uk }) }

    msg.edit(embed)
}