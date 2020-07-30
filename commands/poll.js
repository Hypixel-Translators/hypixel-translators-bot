const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");
const { GoogleSpreadsheet } = require('google-spreadsheet')
const creds = require('../service-account.json')

module.exports = {
    name: "poll",
    description: "Creates a poll in the current channel.",
    usage: "poll <role to ping|'none'>/<question>/<a1 emoji>-<a1 text>/<a2 emoji>-<a2 text>[/...-...]",
    cooldown: 30,
    execute(message) {
        const args = message.content.slice(6).split("/")
        message.delete()
        const pingRole = args[0]
        const question = args[1]
        var remove = args.shift()
        remove = args.shift()

        const embed = new Discord.MessageEmbed()
            .setColor(workingColor)
            .setTitle(question)
            .setDescription("One second...")
            .setFooter("Poll created by " + message.author.tag + " | This message will update to reflect the poll's status.");


        args.forEach(arg => {
            const option = arg.split("-")
            const emoji = option[0]
            const text = option[1]
            embed.addField((emoji + " — " + text), "\u200b")
        })

        message.channel.send(embed).then(msg => {
            var emojis = []
            var itemsProcessed = 0

            args.forEach(arg => {
                const option = arg.split("-")
                const emoji = option[0].replace(/\s+/g, '')
                msg.react(emoji).catch(err => {
                    const embedTwo = new Discord.MessageEmbed()
                        .setColor(errorColor)
                        .setTitle("Poll")
                        .setDescription("Couldn't react with  `" + emoji + "`. Make sure to not type the emoji name, but the actual emoji. The emoji needs to either be a default Discord emoji or it needs to be in this server.\n\nError message:\n> " + err)
                        .setFooter("Executed by " + message.author.tag);
                    msg.edit(embedTwo)
                })
                emojis.push(emoji)
                if (itemsProcessed === arg.length) {
                    addToSpreadsheet(msg, emojis)
                        .then(() => {
                            embed
                                .setColor(neutralColor)
                                .setDescription("To vote, react to this message.")
                            msg.edit(embed)
                        })
                }
            })
        })
    }
}

async function addToSpreadsheet(msg, emojis) {
    const doc = new GoogleSpreadsheet('1MYEHIdzLVXVJyzDaNIknYlmSKjg7lxO15prLfAod3kI')
    await doc.useServiceAccountAuth(creds)

    await doc.loadInfo()
    console.log(doc.title)

    const sheet = doc.sheetsByIndex[0]
    console.log(sheet.title)

    const rows = await sheet.getRows()

    var toAdd = { messageID: msg.id, emojis: emojis }
    const result = await sheet.addRow(toAdd)
    console.log(result)
}