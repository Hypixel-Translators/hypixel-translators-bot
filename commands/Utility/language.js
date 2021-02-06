const { loadingColor, errorColor, successColor, neutralColor, langdb } = require("../../config.json")
const Discord = require("discord.js")
const fs = require("fs")
const { name, code } = require('country-emoji')
const { getDb } = require("../../lib/mongodb")

module.exports = {
    name: "language",
    description: "Changes your language, shows your current one or a list of available languages. If you would like to request a new language for the bot, execute `+language add <language>`.",
    aliases: ["lang"],
    usage: "+language [<new language> | list | add <language>]",
    channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058", "749391414600925335"], //bots staff-bots bot-dev bot-translators
    allowDM: true,
    cooldown: 5,
    async execute(message, strings, args) {
        let executedBy = strings.executedBy.replace("%%user%%", message.author.tag)

        if (args[0]) {
            if (args[0] === "add") {
                args.splice(0, 1)
                const newLang = args.join(" ")
                let requester = message.author.username
                if (message.channel.type !== "dm") requester = message.member.displayName
                if (name(newLang) || code(newLang)) {
                    const result = new Discord.MessageEmbed()
                        .setColor(neutralColor)
                        .setAuthor(strings.moduleName)
                        .setTitle(strings.request)
                        .setDescription(`\`${newLang}\``)
                        .setFooter(executedBy, message.author.displayAvatarURL())
                    message.channel.send(result)
                    const request = new Discord.MessageEmbed()
                        .setColor(neutralColor)
                        .setAuthor("Language")
                        .setTitle(`${requester} wants the following language to be added to the Bot:`)
                        .setDescription(`${name(newLang) || code(newLang)} (user input: ${newLang})`)
                        .setFooter(`Requested by ${message.author.tag}`, message.author.displayAvatarURL())
                    message.client.channels.cache.get("569595073055162378").send("<@241926666400563203> and <@240875059953139714>", request) //admin tagging Stannya and Rodry
                } else {
                    const errorRequest = new Discord.MessageEmbed()
                        .setColor(errorColor)
                        .setAuthor(strings.moduleName)
                        .setTitle(strings.errorRequest)
                        .setDescription(strings.errorRequestDesc)
                        .setFooter(executedBy, message.author.displayAvatarURL())
                    message.channel.send(errorRequest)
                }
            } else if (args[0] === "list") {
                const stringsFolder = "./strings/"
                await fs.readdir(stringsFolder, async (err, files) => {
                    let langList = ""
                    files.forEach(async (element, index, array) => {
                        if (element === "empty" && !message.member.roles.cache.has("764442984119795732")) return //Discord Administrator
                        if (element === "empty") strings[element] = "Empty"
                        langList = langList + "\n" + strings.listElement.replace("%%code%%", element).replace("%%language%%", strings[element] || "Unknown")
                        if (index === array.length - 1) {
                            const embed = new Discord.MessageEmbed()
                                .setColor(neutralColor)
                                .setAuthor(strings.moduleName)
                                .setTitle(strings.listTitle)
                                .setDescription(langList)
                                .setFooter(executedBy, message.author.displayAvatarURL())
                            await message.channel.send(embed)
                        }
                    })
                })
                return
            } else {
                message.channel.startTyping()
                const collection = getDb().collection("users")
                let newLang = args[0].toLowerCase()
                if (newLang === "se") newLang = "sv"
                const langdbEntry = langdb.find(l => l.name.toLowerCase() === newLang)
                if (langdbEntry) newLang = langdbEntry.code
                if (newLang === "empty" && !message.member.roles.cache.has("764442984119795732")) newLang = "denied" //Discord Administrator
                const path = `./strings/${newLang}/language.json`
                fs.access(path, fs.F_OK, async (err) => {
                    if (!err) {
                        collection.updateOne({ id: message.author.id }, { $set: { lang: newLang } }).then(result => {
                            if (!!result.result.nModified) {
                                strings = require(`../../strings/${newLang}/language.json`)
                                executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
                                const embed = new Discord.MessageEmbed()
                                    .setColor(successColor)
                                    .setAuthor(strings.moduleName)
                                    .setTitle(strings.changedToTitle)
                                    .setDescription(strings.credits)
                                    .setFooter(executedBy, message.author.displayAvatarURL())
                                message.channel.stopTyping()
                                return message.channel.send(embed)
                            } else {
                                const embed = new Discord.MessageEmbed()
                                    .setColor(errorColor)
                                    .setAuthor(strings.moduleName)
                                    .setTitle(strings.didntChange)
                                    .setDescription(strings.alreadyThis)
                                    .setFooter(executedBy, message.author.displayAvatarURL())
                                message.channel.stopTyping()
                                return message.channel.send(embed)
                            }
                        })
                    } else {
                        const stringsFolder = "./strings/"
                        await fs.readdir(stringsFolder, async (err, files) => {
                            const emptyIndex = files.indexOf("empty")
                            if (emptyIndex > -1 && !message.member.roles.cache.has("764442984119795732")) files.splice(emptyIndex, 1) //Discord Administrator
                            const embed = new Discord.MessageEmbed()
                                .setColor(errorColor)
                                .setAuthor(strings.moduleName)
                                .setTitle(strings.errorTitle)
                                .setDescription(strings.errorDescription + "\n`" + files.join("`, `") + "`\n" + strings.suggestAdd)
                                .setFooter(executedBy, message.author.displayAvatarURL())
                            message.channel.stopTyping()
                            message.channel.send(embed)
                        })
                        return
                    }
                })
            }
        } else {
            await fs.readdir("./strings/", async (err, files) => {
                const emptyIndex = files.indexOf("empty")
                if (emptyIndex > -1 && !message.member.roles.cache.has("764442984119795732")) files.splice(emptyIndex, 1) //Discord Administrator
                const embed = new Discord.MessageEmbed()
                    .setColor(neutralColor)
                    .setAuthor(strings.moduleName)
                    .setTitle(strings.current)
                    .setDescription(strings.errorDescription + "\n`" + files.join("`, `") + "`\n\n" + strings.credits)
                    .setFooter(executedBy, message.author.displayAvatarURL())
                await message.channel.send(embed)
            })
        }
    }
}
