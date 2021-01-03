const { errorColor, successColor, neutralColor } = require("../config.json")
const Discord = require("discord.js")
const { GoogleSpreadsheet } = require("google-spreadsheet")
const creds = { "type": process.env.type, "project_id": process.env.project_id, "private_key_id": process.env.private_key_id, "private_key": process.env.private_key.replace(/\\n/gm, "\n"), "client_email": process.env.client_email, "client_id": process.env.client_id, "auth_uri": process.env.auth_uri, "token_uri": process.env.token_uri, "auth_provider_x509_cert_url": process.env.auth_provider_x509_cert_url, "client_x509_cert_url": process.env.client_x509_cert_url }
const quotesSheet = process.env.quotes

module.exports = {
    name: "quote",
    description: "Gets (or adds) a funny/weird/wise quote from the server.",
    usage: "+quote [index] | quote add <quote> / <author mention>",
    cooldown: 5,
    allowDM: true,
    channelWhitelist: ["549894938712866816", "619662798133133312", "624881429834366986", "730042612647723058", "749391414600925335"], //bots memes staff-bots bot-development bot-translators
    execute(message, strings, args) {
        const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
        let allowed = false
        if (strings, message.channel.type !== "dm" && strings, message.member.roles.cache.has("768435276191891456")) allowed = true // Discord Staff
        message.channel.startTyping()
        if (args[0] === "add") {
            args.splice(0, 1)
            const toSend = args.join(" ")
            const fullQuote = toSend.split(" / ")
            let quote = fullQuote[0]
            if (quote.startsWith("+")) quote = quote.replace("+", "\\+")
            const author = fullQuote[1]
            if (!quote) {
                message.channel.stopTyping()
                throw "noQuote"
            }
            if (!author) {
                message.channel.stopTyping()
                throw "noUserQuote"
            }
            if (!allowed) {
                const sendTo = message.client.channels.cache.get("624881429834366986") //staff-bots
                const report = new Discord.MessageEmbed()
                    .setColor(neutralColor)
                    .setAuthor("Quote")
                    .setTitle("A quote request has been submitted!")
                    .setDescription(quote + "\n       - " + author)
                    .addFields({ name: "To add it", value: "`+quote add " + toSend + "`" })
                    .setFooter("Suggested by " + message.author.tag, message.author.displayAvatarURL())
                sendTo.send(report)
                const embed = new Discord.MessageEmbed()
                    .setColor(successColor)
                    .setAuthor(strings.moduleName)
                    .setTitle(strings.reqSub)
                    .setDescription(quote + "\n       - " + author)
                    .setFooter(executedBy, message.author.displayAvatarURL())
                message.channel.stopTyping()
                message.channel.send(embed)
            } else {
                addToSpreadsheet(executedBy, message, strings, quote, author)
            }
        } else {
            accessSpreadsheet(executedBy, message, strings, args)
        }
    }
}

async function accessSpreadsheet(executedBy, message, strings, args) {
    const doc = new GoogleSpreadsheet(quotesSheet)
    await doc.useServiceAccountAuth(creds)

    await doc.loadInfo()

    const sheet = doc.sheetsByIndex[0]

    const rows = await sheet.getRows()

    let quoteNumCode = 0
    if (!args[0]) quoteNumCode = Math.floor(Math.random() * Math.floor(rows.length)) //generate random 0-base index number if no arg is given
    if (args[0]) quoteNumCode = Number(args[0]) - 1 //subtract 1 from argument in order to create 0-base index number
    let quoteNum = quoteNumCode + 1
    let quoteNumSheet = quoteNumCode + 2

    const correctRow = rows[quoteNumCode]
    if (!correctRow) {
        const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setAuthor(strings.moduleName)
            .setTitle(strings.invalidArg)
            .setDescription(strings.indexArg.replace("%%arg%%", args[0]).replace("%%max%%", rows.length))
            .setFooter(executedBy, message.author.displayAvatarURL())
        message.channel.stopTyping()
        message.channel.send(embed)
        return
    }
    const embed = new Discord.MessageEmbed()
        .setColor(successColor)
        .setAuthor(strings.moduleName)
        .setTitle(correctRow.quote)
        .setDescription("      - " + correctRow.author)
        .setFooter(executedBy, message.author.displayAvatarURL())
    message.channel.stopTyping()
    message.channel.send(embed)
    console.log(`Quote #${quoteNum} has been requested (0-base number ${quoteNumCode}, sheet position ${quoteNumSheet})`)
}

async function addToSpreadsheet(executedBy, message, strings, quote, author) {
    const doc = new GoogleSpreadsheet(quotesSheet)
    await doc.useServiceAccountAuth(creds)

    await doc.loadInfo()

    const sheet = doc.sheetsByIndex[0]

    const rows = await sheet.getRows()
    const newLength = Number(rows.length) + 1

    const result = await sheet.addRow({ quote, author })

    const embed = new Discord.MessageEmbed()
        .setColor(successColor)
        .setAuthor(strings.moduleName)
        .setTitle(strings.reqAdd)
        .setDescription(result.quote)
        .addFields({ name: strings.user, value: result.author }, { name: strings.index, value: newLength })
        .setFooter(executedBy, message.author.displayAvatarURL())
    message.channel.stopTyping()
    message.channel.send(embed)
}
