const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");
const { GoogleSpreadsheet } = require('google-spreadsheet')
const { promisify } = require('util')
const creds = require('../service-account.json')

module.exports = {
    name: "context",
    description: "Does nothing for now!",
    usage: "context <string ID> [field to edit] [new value]",
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

    const embed = new Discord.MessageEmbed()
        .setColor(successColor)
        .setTitle("Context for " + args[0])
        .setDescription("This system is in the testing phase. No actual data can be written.")
        .addFields(
            { name: "Document title", value: doc.title, inline: true },
            { name: "Sheet title", value: sheet.title, inline: true },
            { name: "Row contents", value: rows[args[0]].id, inline: true }
        )
        .addImage(rows[args[0]].screenshot)
        .setFooter("Executed by " + message.author.tag);
    msg.edit(embed)
}