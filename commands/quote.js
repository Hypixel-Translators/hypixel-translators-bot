const { workingColor, errorColor, successColor, neutralColor, quotes, names } = require("../config.json");
const Discord = require("discord.js");
const { GoogleSpreadsheet } = require('google-spreadsheet')
const creds = require('../service-account.json')

module.exports = {
    name: "quote",
    description: "Gets (or adds) a funny/weird/wise quote from the server.",
    usage: "quote [index|'add'] [quote]/[user]",
    cooldown: 10,
    allowDM: true,
    channelWhitelist: "549894938712866816", "619662798133133312", "624881429834366986", "730042612647723058",
    execute(message, args) {
        const embed = new Discord.MessageEmbed()
            .setColor(workingColor)
            .setTitle("Quote")
            .setDescription("One second...")
            .setFooter("Executed by " + message.author.tag);
        message.channel.send(embed).then(msg => {
            if (args[0] === "add") {
                if (message.author.id == "722738307477536778") { allowed = true }
                if (message.channel.type !== "dm") { if (message.member.roles.cache.has("621071221462663169") || message.member.roles.cache.has("549885657749913621") || message.member.roles.cache.has("241926666400563203")) { allowed = true } }
                if (!allowed) {
                    args.splice(0, 1)
                    var toSend = args.join(" ")
                    const sendTo = msg.client.channels.cache.get("730042612647723058")
                    const report = new Discord.MessageEmbed()
                        .setColor(neutralColor)
                        .setTitle("Quote request")
                        .setDescription("A quote request has been sent!")
                        .addFields({ name: "Quote", value: toSend }, { name: "Add it (admin and dev)", value: "\`+quote add " + toSend + "\`" })
                        .setFooter("Suggested by " + message.author.tag);
                    sendTo.send(report)
                    const embed = new Discord.MessageEmbed()
                        .setColor(successColor)
                        .setTitle("Add quote")
                        .setDescription("Your quote has been sent!")
                        .addFields({ name: "Quote", value: toSend })
                        .setFooter("Executed by " + message.author.tag);
                    msg.edit(embed)
                } else {
                    args.splice(0, 1)
                    var toSend = args.join(" ")
                    addToSpreadsheet(message, toSend, msg)
                }
            } else {
                accessSpreadsheet(message, args, msg)
            }
        })
    }
};

async function accessSpreadsheet(message, args, msg) {
    const doc = new GoogleSpreadsheet('16ZCwOE3Wsfd39-NcEB6QJJZXVyFPEWIWITg0aThcDZ8')
    await doc.useServiceAccountAuth(creds)

    await doc.loadInfo()
    console.log(doc.title)

    const sheet = doc.sheetsByIndex[0]
    console.log(sheet.title)

    const rows = await sheet.getRows()

    var rowNum = Math.floor(Math.random() * Math.floor(rows.length))
    var number = Number(args[0]) - 1
    if (args[0]) { rowNum = number }
    console.log(rowNum)

    const correctRow = rows[rowNum]
    if (!correctRow) {
        const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setTitle("Quote")
            .setDescription("That's not a valid quote index number! Min 1, max " + rows.length)
            .setFooter("Asked for by " + message.author.tag);
        msg.edit(embed)
        return;
    }
    const embed = new Discord.MessageEmbed()
        .setColor(successColor)
        .setTitle(correctRow.quote)
        .setDescription("_      - " + correctRow.user + "_")
        .setFooter("Asked for by " + message.author.tag);
    msg.edit(embed)
}

async function addToSpreadsheet(message, toSend, msg) {
    const doc = new GoogleSpreadsheet('16ZCwOE3Wsfd39-NcEB6QJJZXVyFPEWIWITg0aThcDZ8')
    await doc.useServiceAccountAuth(creds)

    await doc.loadInfo()
    console.log(doc.title)

    const sheet = doc.sheetsByIndex[0]
    console.log(sheet.title)

    const rows = await sheet.getRows()
    const newLength = Number(rows.length) + 1

    const args = toSend.split("/")
    const quote = args[0]
    const user = args[1]
    if (!user) {
        const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setTitle("Add quote")
            .setDescription("You have to specify a quote and a user, separated by a slash (`/`)!")
            .setFooter("Executed by " + message.author.tag);
        msg.edit(embed)
        return;
    }

    const result = await sheet.addRow({ quote, user })

    const embed = new Discord.MessageEmbed()
        .setColor(successColor)
        .setTitle("Add quote")
        .setDescription("The quote has been added!")
        .addFields({ name: "Quote", value: result.quote }, { name: "User", value: result.user }, { name: "Index", value: newLength })
        .setFooter("Added by " + message.author.tag);
    msg.edit(embed)
}
