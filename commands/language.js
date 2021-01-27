const { loadingColor, errorColor, successColor, neutralColor, langdb } = require("../config.json")
const Discord = require("discord.js")
const fs = require("fs")
const { name, code } = require('country-emoji')

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
        let oldMsg = {}
        let newMsg = {}
        let selected = false

        if (args[0]) {
            if (args[0] === "add") {
                args.splice(0, 1)
                const newLang = args.join(" ")
                if (message.channel.type === "dm" || !message.member.hasPermission("MANAGE_ROLES")) {
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
                } else {
                    const embed = new Discord.MessageEmbed()
                        .setColor(successColor)
                        .setAuthor(strings.moduleName)
                        .setTitle(strings.add)
                        .setDescription(`\`${newLang}\``)
                        .setFooter(executedBy, message.author.displayAvatarURL())
                    message.channel.send(embed)
                    message.client.channels.cache.get("782635440054206504").send(newLang) //language-database
                }
            } else if (args[0] === "list") {
                const stringsFolder = "./strings/"
                await fs.readdir(stringsFolder, async (err, files) => {
                    let langList = ""
                    files.forEach(async (element, index, array) => {
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
                let newLang = args[0].toLowerCase()
                const langdbEntry = langdb.find(l => l.name.toLowerCase() === newLang)
                if (langdbEntry) newLang = langdbEntry.code
                const path = `./strings/${newLang}/language.json`
                fs.access(path, fs.F_OK, async (err) => {
                    if (!err) {
                        const oldMessages = await message.client.channels.cache.get("782635440054206504").messages.fetch() //language-database
                        const oldFiMessage = await oldMessages.filter(element => element.content.includes(message.author.id))
                        oldFiMessage.forEach(async element => {
                            console.log("Old old message: " + element.content)
                            oldMsg = await element.content.split(" ")
                            await oldMsg.splice(oldMsg.indexOf(message.author.id), 1)
                            console.log("New old message: " + oldMsg.join(" "))
                            await element.edit(oldMsg.join(" ")) //language-database
                        })
                        const newMessages = await message.client.channels.cache.get("782635440054206504").messages.fetch() //language-database
                        const newFiMessage = await newMessages.filter(element => (element.content.split(" ")[0] === newLang))
                        await newFiMessage.forEach(async element => {
                            const oldNewMsg = element.content
                            strings = await require(("../strings/" + newLang + "/language.json"))
                            executedBy = await strings.executedBy.replace("%%user%%", message.author.tag)
                            newMsg = await oldNewMsg.split(" ")
                            console.log("Old new message: " + oldNewMsg)
                            if (!oldNewMsg.includes(message.author.id)) await newMsg.push(message.author.id)
                            console.log("New new message: " + newMsg.join(" "))
                            await element.edit(newMsg.join(" ")) //language-database
                            if (oldNewMsg === newMsg.join(" ")) {
                                const embed = new Discord.MessageEmbed()
                                    .setColor(errorColor)
                                    .setAuthor(strings.moduleName)
                                    .setTitle(strings.didntChange)
                                    .setDescription(strings.alreadyThis)
                                    .setFooter(executedBy, message.author.displayAvatarURL())
                                message.channel.stopTyping()
                                message.channel.send(embed)
                            } else {
                                const embed = new Discord.MessageEmbed()
                                    .setColor(successColor)
                                    .setAuthor(strings.moduleName)
                                    .setDescription(strings.credits)
                                    .setFooter(executedBy, message.author.displayAvatarURL())
                                if (strings.changedToTitle === "Changed your language to English!") { embed.setTitle("Changed your language to " + strings[newLang] + "!") } else { embed.setTitle(strings.changedToTitle) }
                                message.channel.stopTyping()
                                message.channel.send(embed)
                                return
                            }
                        })
                    } else {
                        const stringsFolder = "./strings/"
                        await fs.readdir(stringsFolder, async (err, files) => {
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
            const oldMessages = await message.client.channels.cache.get("782635440054206504").messages.fetch() //language-database
            const oldFiMessages = await oldMessages.filter(element => element.content.includes(message.author.id))
            oldFiMessages.forEach(async element => {
                selected = true
                oldMsg = await element.content.split(" ")
                const stringsFolder = "./strings/"
                await fs.readdir(stringsFolder, async (err, files) => {
                    const embed = new Discord.MessageEmbed()
                        .setColor(neutralColor)
                        .setAuthor(strings.moduleName)
                        .setTitle(strings.current)
                        .setDescription(strings.errorDescription + "\n`" + files.join("`, `") + "`\n\n" + strings.credits)
                        .setFooter(executedBy, message.author.displayAvatarURL())
                    await message.channel.send(embed)
                })
                return
            })
        }
    }
}
