import { errorColor, successColor, neutralColor } from "../../config.json"
import Discord from "discord.js"
import { client } from "../../index"
import { Collection } from "mongodb"
import { Command } from "../../lib/dbclient"

const command: Command = {
    name: "quote",
    description: "Gets (or adds) a funny/weird/wise quote from the server.",
    usage: "+quote [index] | quote add <quote> / <author mention>",
    cooldown: 5,
    allowDM: true,
    channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058"], //bots staff-bots bot-development bot-translators
    async execute(message: Discord.Message, args: string[], getString: (path: string, cmd?: string, lang?: string) => any) {
        const executedBy = getString("executedBy", "global").replace("%%user%%", message.author.tag)
        const collection = client.db.collection("quotes")
        let allowed = false
        if (message.member?.hasPermission("VIEW_AUDIT_LOG")) allowed = true
        message.channel.startTyping()
        if (args[0] === "add") {
            args.splice(0, 1)
            const toSend = args.join(" ")
            const fullQuote = toSend.split(" / ")
            let quote = fullQuote[0]
            const author = fullQuote[1]
            if (!quote) {
                throw "noQuote"
            }
            if (!author) {
                throw "noUserQuote"
            }
            if (!allowed) {
                const sendTo = message.client.channels.cache.get("624881429834366986") as Discord.TextChannel //staff-bots
                const report = new Discord.MessageEmbed()
                    .setColor(neutralColor)
                    .setAuthor("Quote")
                    .setTitle("A quote request has been submitted!")
                    .setDescription(quote + "\n       - " + author)
                    .addFields({ name: "To add it", value: "`+quote add " + toSend + "`" })
                    .setFooter("Suggested by " + message.author.tag, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                sendTo.send(report)
                const embed = new Discord.MessageEmbed()
                    .setColor(successColor)
                    .setAuthor(getString("moduleName"))
                    .setTitle(getString("reqSub"))
                    .setDescription(quote + "\n       - " + author)
                    .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                message.channel.stopTyping()
                message.channel.send(embed)
            } else await addQuote(executedBy, message, quote, author, collection)
        } else if (args[0] === "edit" && allowed) await editQuote(executedBy, message, args, collection)
        else if (args[0] === "delete" && allowed) await deleteQuote(executedBy, message, args, collection)
        else await findQuote(executedBy, message, getString, args, collection)
    }
}

async function findQuote(executedBy: string, message: Discord.Message, getString: (path: string, cmd?: string, lang?: string) => any, args: string[], collection: Collection<any>) {

    const all = await collection.find({}).toArray()

    let quoteId
    if (!args[0]) quoteId = Math.ceil(Math.random() * Math.floor(all.length)) //generate random id if no arg is given
    else quoteId = Number(args[0])

    const quote = await collection.findOne({ id: quoteId })
    if (!quote) {
        const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setAuthor(getString("moduleName"))
            .setTitle(getString("invalidArg"))
            .setDescription(getString("indexArg").replace("%%arg%%", args[0]).replace("%%max%%", all.length))
            .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
        message.channel.stopTyping()
        return message.channel.send(embed)
    }
    console.log(`Quote with ID ${quoteId} was requested`)
    const embed = new Discord.MessageEmbed()
        .setColor(successColor)
        .setAuthor(getString("moduleName"))
        .setTitle(quote.quote)
        .setDescription(`      - ${quote.author}`)
        .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
    message.channel.stopTyping()
    return message.channel.send(embed)
}

async function addQuote(executedBy: string, message: Discord.Message, quote: string, author: string, collection: Collection<any>) {

    const all = await collection.find({}).toArray()
    const quoteId = all.length + 1

    await collection.insertOne({ id: quoteId, quote: quote, author: author })
    const embed = new Discord.MessageEmbed()
        .setColor(successColor)
        .setAuthor("Quote")
        .setTitle("Success! The following quote has been added:")
        .setDescription(quote)
        .addFields(
            { name: "User", value: author },
            { name: "Quote number", value: quoteId }
        )
        .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
    message.channel.stopTyping()
    message.channel.send(embed)
}

async function editQuote(executedBy: string, message: Discord.Message, args: string[], collection: Collection<any>) {

    const quoteId = Number(args[1])
    if (isNaN(quoteId)) throw "noQuote"
    args.splice(0, 2)
    const newQuote = args.join(" ")
    if (!quoteId || !newQuote) throw "noQuote"
    await collection.findOneAndUpdate({ id: quoteId }, { $set: { quote: newQuote } }).then(r => {
        const embed = new Discord.MessageEmbed()
            .setColor(successColor)
            .setAuthor("Quote")
            .setTitle(`Successfully edited quote #${quoteId}`)
            .addFields(
                { name: "Old quote", value: r.value.quote },
                { name: "New quote", value: newQuote },
                { name: "Author", value: r.value.author }
            )
            .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
        message.channel.stopTyping()
        message.channel.send(embed)
    })
}

async function deleteQuote(executedBy: string, message: Discord.Message, args: string[], collection: Collection<any>) {

    const quoteId = Number(args[1])
    if (!quoteId) throw "noQuote"
    await collection.findOneAndDelete({ id: quoteId }).then(r => {
        const embed = new Discord.MessageEmbed()
            .setColor(successColor)
            .setAuthor("Quote")
            .setTitle(`Successfully deleted quote #${quoteId}`)
            .addFields(
                { name: "User", value: r.value.author },
                { name: "Quote", value: r.value.quote }
            )
            .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
        message.channel.stopTyping()
        message.channel.send(embed)
    })
}

export default command
