const { workingColor, errorColor, successColor, neutralColor, quotes, names } = require("../config.json");
const Discord = require("discord.js");
const { GoogleSpreadsheet } = require('google-spreadsheet')
const creds = require('../service-account.json')

module.exports = {
    name: "quote",
    description: "Get a funny/weird/wise quote from the server.",
    usage: "quote",
    cooldown: 10,
    allowDM: true,
    channelBlackList: "621298919535804426",
    execute(message) {
        const embed = new Discord.MessageEmbed()
            .setColor(workingColor)
            .setTitle("Quote")
            .setDescription("One second...")
            .setFooter("Asked for by " + message.author.tag);
        message.channel.send(embed).then(msg => {
            accessSpreadsheet(message, msg)
        })
    }
};

async function accessSpreadsheet(message, msg) {
    const doc = new GoogleSpreadsheet('16ZCwOE3Wsfd39-NcEB6QJJZXVyFPEWIWITg0aThcDZ8')
    await doc.useServiceAccountAuth(creds)

    await doc.loadInfo()
    console.log(doc.title)

    const sheet = doc.sheetsByIndex[0]
    console.log(sheet.title)

    const rows = await sheet.getRows()

    const rowNum = Math.floor(Math.random() * Math.floor(sheet.rowCount))
    console.log(rowNum)

    const correctRow = rows[rowNum]
    const embed = new Discord.MessageEmbed()
        .setColor(successColor)
        .setTitle(correctRow.quote)
        .setDescription("_      - " + correctRow.user + "_")
        .setFooter("Asked for by " + message.author.tag);
    msg.edit(embed)
}