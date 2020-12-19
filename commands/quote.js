const { loadingColor, errorColor, successColor, neutralColor, quotes, names } = require("../config.json");
const Discord = require("discord.js");
const { GoogleSpreadsheet } = require("google-spreadsheet")
const creds = { "type": process.env.type, "project_id": process.env.project_id, "private_key_id": process.env.private_key_id, "private_key": process.env.private_key.replace(/\\n/gm, "\n"), "client_email": process.env.client_email, "client_id": process.env.client_id, "auth_uri": process.env.auth_uri, "token_uri": process.env.token_uri, "auth_provider_x509_cert_url": process.env.auth_provider_x509_cert_url, "client_x509_cert_url": process.env.client_x509_cert_url }

module.exports = {
    name: "quote",
    description: "Gets (or adds) a funny/weird/wise quote from the server.",
    usage: "+quote [index] | quote add <quote> / <user mention>",
    cooldown: 5,
    allowDM: true,
    channelWhitelist: ["549894938712866816", "619662798133133312", "624881429834366986", "730042612647723058", "749391414600925335"], //bots memes staff-bots bot-development bot-translators
    execute(strings, message, args) {
        const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
        const embed = new Discord.MessageEmbed()
            .setColor(loadingColor)
            .setAuthor(strings.moduleName)
            .setTitle(strings.loading)
            .setDescription(strings.loadingModule)
            .setFooter(executedBy, message.author.displayAvatarURL());
        message.channel.send(embed).then(msg => {
            if (args[0] === "add") {
                allowed = false
                if (strings, message.channel.type !== "dm") { if (strings, message.member.roles.cache.has("768435276191891456")) { allowed = true } } // Discord Staff
                if (!allowed) {
                    args.splice(0, 1)
                    var toSend = args.join(" ")
                    const sendTo = msg.client.channels.cache.get("730042612647723058") //bot-development
                    const report = new Discord.MessageEmbed()
                        .setColor(neutralColor)
                        .setAuthor("Quote")
                        .setTitle("A quote request has been submitted!")
                        .setDescription(toSend)
                        .addFields({ name: "To add it", value: "`+quote add " + toSend + "`" })
                        .setFooter("Suggested by " + message.author.tag);
                    sendTo.send(report)
                    const embed = new Discord.MessageEmbed()
                        .setColor(successColor)
                        .setAuthor(strings.moduleName)
                        .setTitle(strings.reqSub)
                        .setDescription(toSend)
                        .setFooter(executedBy, message.author.displayAvatarURL());
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
    const doc = new GoogleSpreadsheet("16ZCwOE3Wsfd39-NcEB6QJJZXVyFPEWIWITg0aThcDZ8")
    await doc.useServiceAccountAuth(creds)

    await doc.loadInfo()
    console.log(doc.title)

    const sheet = doc.sheetsByIndex[0]
    console.log(sheet.title)

    const rows = await sheet.getRows()

    var quoteNumCode = 0
    if (!args[0]) quoteNumCode = Math.floor(Math.random() * Math.floor(rows.length)) //generate random 0-base index number if no arg is given
    if (args[0]) quoteNumCode = Number(args[0]) - 1 //subtract 1 from argument in order to create 0-base index number
    var quoteNumUser = quoteNumCode + 1
    var quoteNumSheet = quoteNumCode - 1
    console.log(`Quote #${quoteNumUser} has been requested (0-base number ${quoteNumCode}, sheet position ${quoteNumSheet})`)

    const correctRow = rows[quoteNumCode]
    if (!correctRow) {
        const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setAuthor(strings.moduleName)
            .setTitle(strings.invalidArg)
            .setDescription(strings.indexArg.replace("%%arg%%", args[0]).replace("%%max%%", rows.length))
            .setFooter(executedBy, message.author.displayAvatarURL());
        msg.edit(embed)
        return;
    }
    const embed = new Discord.MessageEmbed()
        .setColor(successColor)
        .setAuthor(strings.moduleName)
        .setTitle(correctRow.quote)
        .setDescription("      - " + correctRow.user)
        .setFooter(executedBy, message.author.displayAvatarURL());
    msg.edit(embed)
}

async function addToSpreadsheet(executedBy, strings, message, toSend, msg) {
    const doc = new GoogleSpreadsheet("16ZCwOE3Wsfd39-NcEB6QJJZXVyFPEWIWITg0aThcDZ8")
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
            .setFooter(executedBy, message.author.displayAvatarURL());
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
        .setFooter(executedBy, message.author.displayAvatarURL());
    msg.edit(embed)
}
