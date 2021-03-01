import { loadingColor, errorColor, successColor, neutralColor } from "../../config.json"
import Discord from "discord.js"
import fs from "fs"
import { name, code } from 'country-emoji'
import { client } from "../../index"

module.exports = {
    name: "language",
    description: "Changes your language, shows your current one or a list of available languages. If you would like to request a new language for the bot, execute `+language add <language>`.",
    aliases: ["lang"],
    usage: "+language [<new language> | list | add <language>]",
    channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058"], //bots staff-bots bot-dev bot-translators
    allowDM: true,
    cooldown: 5,
    async execute(message: Discord.Message, args: string[], getString: (path: string, cmd?: string, lang?: string) => any) {
        let executedBy = getString("executedBy", "global").replace("%%user%%", message.author.tag)
        const collection = client.db.collection("users")
        const stringsFolder = "./strings/"

        if (args[0]) {
            if (args[0] === "add") {
                args.splice(0, 1)
                const newLang = args.join(" ")
                let requester = message.author.username
                if (message.channel.type !== "dm") requester = message.member!.displayName
                if (name(newLang) || code(newLang)) {
                    const result = new Discord.MessageEmbed()
                        .setColor(neutralColor)
                        .setAuthor(getString("moduleName"))
                        .setTitle(getString("request"))
                        .setDescription(`\`${newLang}\``)
                        .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                    message.channel.send(result)
                    const request = new Discord.MessageEmbed()
                        .setColor(neutralColor)
                        .setAuthor("Language")
                        .setTitle(`${requester} wants the following language to be added to the Bot:`)
                        .setDescription(`${name(newLang) || code(newLang)} (user input: ${newLang})`)
                        .setFooter(`Requested by ${message.author.tag}`, message.author.displayAvatarURL({ format: "png", dynamic: true }));
                    (message.client.channels.cache.get("801024098116435988") as Discord.TextChannel).send("<@&764442984119795732>", request) //admin tagging Discord Administrator
                } else {
                    const errorRequest = new Discord.MessageEmbed()
                        .setColor(errorColor)
                        .setAuthor(getString("moduleName"))
                        .setTitle(getString("errorRequest"))
                        .setDescription(getString("request"))
                        .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                    message.channel.send(errorRequest)
                }
            } else if (args[0] === "list") {
                const files = fs.readdirSync(stringsFolder)
                let langList = ""
                files.forEach(async (element, index, array) => {
                    if (element === "empty" && !message.member!.roles.cache.has("764442984119795732")) return //Discord Administrator
                    let languageString
                    if (element === "empty") languageString = "Empty"
                    else languageString = getString(element)
                    langList = langList + "\n" + getString("listElement").replace("%%code%%", element).replace("%%language%%", languageString || "Unknown")
                    if (index === array.length - 1) {
                        const embed = new Discord.MessageEmbed()
                            .setColor(neutralColor)
                            .setAuthor(getString("moduleName"))
                            .setTitle(getString("listTitle"))
                            .setDescription(langList)
                            .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                        await message.channel.send(embed)
                    }
                })
            } else if (args[0] === "stats" && message.member!.roles.cache.has("764442984119795732")) { //Discord Administrator
                if (!args[1]) throw "noLang"
                const files = fs.readdirSync(stringsFolder)
                if (!files.includes(args[1])) throw "falseLang"
                const langUsers = await collection.find({ lang: args[1] }).toArray()
                const users: string[] = []
                langUsers.forEach(u => users.push(`<@!${u.id}>`))
                const embed = new Discord.MessageEmbed()
                    .setColor(neutralColor)
                    .setAuthor("Language")
                    .setFooter(`Executed By ${message.author.tag}`, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                if (langUsers.length === 1) embed.setTitle(`There is ${langUsers.length} user using that language at the moment.`)
                else embed.setTitle(`There are ${langUsers.length} users using that language at the moment.`)
                if (args[1] !== "en") embed.setDescription(users.join(", "))
                message.channel.send(embed)
            } else {
                message.channel.startTyping()
                let newLang = args[0].toLowerCase()
                if (newLang === "se") newLang = "sv"
                const langdb = await client.db.collection("langdb").find().toArray()
                const langdbEntry = langdb.find(l => l.name.toLowerCase() === newLang)
                if (langdbEntry) newLang = langdbEntry.code
                if (newLang === "empty" && !message.member!.roles.cache.has("764442984119795732")) newLang = "denied" //Discord Administrator
                const path = `./strings/${newLang}/language.json`
                fs.access(path, fs.constants.F_OK, async (err) => {
                    if (!err) {
                        collection.updateOne({ id: message.author.id }, { $set: { lang: newLang } }).then(result => {
                            if (result.result.nModified) {
                                executedBy = getString("executedBy", "global", newLang).replace("%%user%%", message.author.tag)
                                const embed = new Discord.MessageEmbed()
                                    .setColor(successColor)
                                    .setAuthor(getString("moduleName", this.name, newLang))
                                    .setTitle(getString("changedToTitle", this.name, newLang))
                                    .setDescription(getString("credits", this.name, newLang))
                                    .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                                message.channel.stopTyping()
                                return message.channel.send(embed)
                            } else {
                                const embed = new Discord.MessageEmbed()
                                    .setColor(errorColor)
                                    .setAuthor(getString("moduleName", this.name, newLang))
                                    .setTitle(getString("didntChange", this.name, newLang))
                                    .setDescription(getString("alreadyThis", this.name, newLang))
                                    .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                                message.channel.stopTyping()
                                return message.channel.send(embed)
                            }
                        })
                    } else {
                        await fs.readdir(stringsFolder, async (err, files) => {
                            const emptyIndex = files.indexOf("empty")
                            if (emptyIndex > -1 && !message.member!.roles.cache.has("764442984119795732")) files.splice(emptyIndex, 1) //Discord Administrator
                            const embed = new Discord.MessageEmbed()
                                .setColor(errorColor)
                                .setAuthor(getString("moduleName"))
                                .setTitle(getString("errorTitle"))
                                .setDescription(getString("errorDescription") + "\n`" + files.join("`, `") + "`\n" + getString("suggestAdd"))
                                .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                            message.channel.stopTyping()
                            message.channel.send(embed)
                        })
                    }
                })
            }
        } else {
            await fs.readdir(stringsFolder, async (err, files) => {
                const emptyIndex = files.indexOf("empty")
                if (emptyIndex > -1 && !message.member!.roles.cache.has("764442984119795732")) files.splice(emptyIndex, 1) //Discord Administrator
                const embed = new Discord.MessageEmbed()
                    .setColor(neutralColor)
                    .setAuthor(getString("moduleName"))
                    .setTitle(getString("current"))
                    .setDescription(getString("errorDescription") + "\n`" + files.join("`, `") + "`\n\n" + getString("credits"))
                    .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                await message.channel.send(embed)
            })
        }
    }
}
