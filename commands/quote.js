const { workingColor, errorColor, successColor, neutralColor, quotes, names } = require("../config.json");
const Discord = require("discord.js");
const { GoogleSpreadsheet } = require('google-spreadsheet')
const creds = { "type": process.env.type, "project_id": process.env.project_id, "private_key_id": process.env.private_key_id, "private_key": process.env.private_key.replace(/\\n/gm, '\n'), "client_email": process.env.client_email, "client_id": process.env.client_id, "auth_uri": process.env.auth_uri, "token_uri": process.env.token_uri, "auth_provider_x509_cert_url": process.env.auth_provider_x509_cert_url, "client_x509_cert_url": process.env.client_x509_cert_url }

module.exports = {
    name: "quote",
    description: "Gets (or adds) a funny/weird/wise quote from the server.",
    usage: "quote [index] | quote add <quote> / <user mention>",
    cooldown: 5,
    allowDM: true,
    channelWhitelist: ["549894938712866816", "619662798133133312", "624881429834366986", "730042612647723058", "749391414600925335"],
    execute(strings, message, args) {
        const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
        const embed = new Discord.MessageEmbed()
            .setColor(workingColor)
            .setAuthor(strings.moduleName)
            .setTitle(strings.loading)
            .setDescription(strings.loadingModule)
            .setThumbnail("https://i.pinimg.com/originals/eb/73/8b/eb738bda5d55e818644809e93385620a.gif")
            .setFooter(executedBy);
        message.channel.send(embed).then(msg => {
            if (args[0] === "add") {
                allowed = false
                if (strings, message.author.id == "722738307477536778") { allowed = true }
                if (strings, message.channel.type !== "dm") { if (strings, message.member.roles.cache.has("621071221462663169") || message.member.roles.cache.has("549885657749913621") || message.member.roles.cache.has("241926666400563203")) { allowed = true } }
                if (!allowed) {
                    args.splice(0, 1)
                    var toSend = args.join(" ")
                    const sendTo = msg.client.channels.cache.get("730042612647723058")
                    const report = new Discord.MessageEmbed()
                        .setColor(neutralColor)
                        .setAuthor("Quote")
                        .setTitle("A quote request has been submitted!")
                        .setDescription(toSend)
                        .addFields({ name: "To add it", value: "`+quote add <quote> / <quoted user mention>`" })
                        .setFooter("Suggested by " + message.author.tag);
                    sendTo.send(report)
                    const embed = new Discord.MessageEmbed()
                        .setColor(successColor)
                        .setAuthor(strings.moduleName)
                        .setTitle(strings.reqSub)
                        .setDescription(toSend)
                        .setFooter(executedBy);
                    msg.edit(embed)
                } else {
                    args.splice(0, 1)
                    var toSend = args.join(" ")
                    addToSpreadsheet(executedBy, strings, message, toSend, msg)
                }
            } else {
                accessSpreadsheet(executedBy, strings, message, args, msg)
            }
        })
    }
};

async function accessSpreadsheet(executedBy, strings, message, args, msg) {
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
        var indexArg = strings.indexArg.replace("%%arg%%", args[0])
        indexArg = indexArg.replace("%%max%%", rows.length)
        const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setAuthor(strings.moduleName)
            .setTitle(strings.invalidArg)
            .setDescription(indexArg)
            .setFooter(executedBy);
        msg.edit(embed)
        return;
    }
    const embed = new Discord.MessageEmbed()
        .setColor(successColor)
        .setAuthor(strings.moduleName)
        .setTitle(correctRow.quote)
        .setDescription("      - " + correctRow.user)
        .setFooter(executedBy);
    msg.edit(embed)
}

async function addToSpreadsheet(executedBy, strings, message, toSend, msg) {
    const doc = new GoogleSpreadsheet('16ZCwOE3Wsfd39-NcEB6QJJZXVyFPEWIWITg0aThcDZ8')
    await doc.useServiceAccountAuth(creds)

    await doc.loadInfo()
    console.log(doc.title)

    const sheet = doc.sheetsByIndex[0]
    console.log(sheet.title)

    const rows = await sheet.getRows()
    const newLength = Number(rows.length) + 1

    const args = toSend.split(" / ")
    const quote = args[0]
    const user = args[1]
    if (!user) {
        throw "noUserQuote";
        /*const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setAuthor(strings.moduleName)
            .setTitle(strings.invalidArg)
            .setDescription(strings.specUser)
            .setFooter(executedBy);
        msg.edit(embed)
        return;*/
    }

    const result = await sheet.addRow({ quote, user })

    const embed = new Discord.MessageEmbed()
        .setColor(successColor)
        .setAuthor(strings.moduleName)
        .setTitle(strings.reqAdd)
        .setDescription(result.quote)
        .addFields({ name: strings.user, value: result.user }, { name: strings.index, value: newLength })
        .setFooter(executedBy);
    msg.edit(embed)
}
