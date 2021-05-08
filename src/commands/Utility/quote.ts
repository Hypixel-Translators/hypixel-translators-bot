import { errorColor, successColor, neutralColor } from "../../config.json"
import Discord from "discord.js"
import { db } from "../../lib/dbclient"
import { Collection } from "mongodb"
import { client, Command } from "../../index"

const command: Command = {
    name: "quote",
    description: "Gets (or adds) a funny/weird/wise quote from the server.",
    usage: "+quote [index] | quote add <quote> / <author mention>",
    cooldown: 5,
    allowDM: true,
    channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058"], //bots staff-bots bot-development 
    async execute(interaction: Discord.CommandInteraction, args: string[], getString: (path: string, variables?: { [key: string]: string | number } | string, cmd?: string, lang?: string) => any) {
        const executedBy = getString("executedBy", { user: interaction.user.tag }, "global")
        const collection = db.collection("quotes")
        let allowed = false
        if (interaction.member?.permissions.has("VIEW_AUDIT_LOG")) allowed = true
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
                const sendTo = client.channels.cache.get("624881429834366986") as Discord.TextChannel //staff-bots
                const report = new Discord.MessageEmbed()
                    .setColor(neutralColor)
                    .setAuthor("Quote")
                    .setTitle("A quote request has been submitted!")
                    .setDescription(`${quote}\n       - ${author}`)
                    .addField("To add it", `\`+quote add ${toSend}\``)
                    .setFooter("Suggested by " + interaction.user.tag, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                sendTo.send(report)
                const embed = new Discord.MessageEmbed()
                    .setColor(successColor)
                    .setAuthor(getString("moduleName"))
                    .setTitle(getString("reqSub"))
                    .setDescription(`${quote}\n       - ${author}`)
                    .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                interaction.reply(embed)
            } else await addQuote(message, quote, author, collection)
        } else if (args[0] === "edit" && allowed) await editQuote(message, args, collection)
        else if (args[0] === "delete" && allowed) await deleteQuote(message, args, collection)
        else if (args[0] === "link" && allowed) await linkQuote(message, args, collection)
        else await findQuote(executedBy, message, getString, args, collection)
    }
}

async function findQuote(executedBy: string, interaction: Discord.CommandInteraction, getString: (path: string, variables?: { [key: string]: string | number } | string, cmd?: string, lang?: string) => any, args: string[], collection: Collection<any>) {

    const count = await collection.estimatedDocumentCount()

    let quoteId
    if (!args[0]) quoteId = Math.ceil(Math.random() * Math.floor(count)) //generate random id if no arg is given
    else quoteId = Number(args[0])

    const quote = await collection.findOne({ id: quoteId })
    if (!quote) {
        const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setAuthor(getString("moduleName"))
            .setTitle(getString("invalidArg"))
            .setDescription(getString("indexArg", { arg: args[0], max: count }))
            .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
        return interaction.reply(embed)
    }
    console.log(`Quote with ID ${quoteId} was requested`)
    const embed = new Discord.MessageEmbed()
        .setColor(successColor)
        .setAuthor(getString("moduleName"))
        .setTitle(quote.quote)
        .setDescription(`      - ${quote.author}`)
        .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
    if (quote.url) embed.addField(getString("msgUrl"), quote.url)
    return interaction.reply(embed)
}

async function addQuote(interaction: Discord.CommandInteraction, quote: string, author: string, collection: Collection<any>) {

    const quoteId = await collection.estimatedDocumentCount() + 1

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
        .setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
    interaction.reply(embed)
}

async function editQuote(interaction: Discord.CommandInteraction, args: string[], collection: Collection<any>) {

    const quoteId = Number(args[1])
    if (!quoteId) throw "noQuote"
    args.splice(0, 2)
    const newQuote = args.join(" ")
    if (!quoteId || !newQuote) throw "noQuote"
    await collection.findOneAndUpdate({ id: quoteId }, { $set: { quote: newQuote } }).then(r => {
        if (r.value) {
            const embed = new Discord.MessageEmbed()
                .setColor(successColor)
                .setAuthor("Quote")
                .setTitle(`Successfully edited quote #${quoteId}`)
                .addFields(
                    { name: "Old quote", value: r.value.quote },
                    { name: "New quote", value: newQuote },
                    { name: "Author", value: r.value.author }
                )
                .setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
            interaction.reply(embed)
        } else {
            const embed = new Discord.MessageEmbed()
                .setColor(errorColor)
                .setAuthor("Quote")
                .setTitle("Couldn't find a quote with that ID!")
                .setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
            interaction.reply(embed)
        }
    })
}

async function deleteQuote(interaction: Discord.CommandInteraction, args: string[], collection: Collection<any>) {

    const quoteId = Number(args[1])
    if (!quoteId) throw "noQuote"
    await collection.findOneAndDelete({ id: quoteId }).then(r => {
        if (r.value) {
            const embed = new Discord.MessageEmbed()
                .setColor(successColor)
                .setAuthor("Quote")
                .setTitle(`Successfully deleted quote #${quoteId}`)
                .addFields(
                    { name: "User", value: r.value.author },
                    { name: "Quote", value: r.value.quote }
                )
                .setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
            interaction.reply(embed)
        } else {
            const embed = new Discord.MessageEmbed()
                .setColor(errorColor)
                .setAuthor("Quote")
                .setTitle("Couldn't find a quote with that ID!")
                .setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
            interaction.reply(embed)
        }
    })
}

async function linkQuote(interaction: Discord.CommandInteraction, args: string[], collection: Collection<any>) {
    const quoteId = Number(args[1])
    if (!quoteId) throw "noQuote"
    const urlSplit = args[2].split("/");
    (client.channels.cache.get(urlSplit[5]) as Discord.TextChannel)?.messages.fetch(urlSplit[6])
        .then(async msg => {
            await collection.findOneAndUpdate({ id: quoteId }, { $set: { url: msg.url } }).then(r => {
                if (r.value) {
                    const embed = new Discord.MessageEmbed()
                        .setColor(successColor)
                        .setAuthor("Quote")
                        .setTitle(`Successfully linked quote #${quoteId}`)
                        .addFields(
                            { name: "Old URL", value: r.value.url || "None" },
                            { name: "New URL", value: msg.url },
                            { name: "Quote", value: r.value.quote },
                            { name: "Author", value: r.value.author }
                        )
                        .setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                    interaction.reply(embed)
                } else {
                    const embed = new Discord.MessageEmbed()
                        .setColor(errorColor)
                        .setAuthor("Quote")
                        .setTitle("Couldn't find a quote with that ID!")
                        .setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                    interaction.reply(embed)
                }
            })
        })
        .catch(() => {
            const embed = new Discord.MessageEmbed()
                .setColor(errorColor)
                .setAuthor("Quote")
                .setTitle("Couldn't find a message linked to that URL!")
                .setDescription("Make sure you obtained it by coping the message URL directly and that I have permission to see that interaction.")
                .setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
            interaction.reply(embed)
        })
}

export default command
