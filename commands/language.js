const { loadingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");
const fs = require("fs")

module.exports = {
    name: "language",
    description: "Saves your language preference.",
    aliases: ["lang"],
    usage: "+language [language code]",
    channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058", "749391414600925335"],
    allowDM: true,
    cooldown: 5,
    async execute(strings, message) {
        var executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
        const msgL = String(message).toLowerCase()
        const args = msgL.split(" ")
        var oldMsg = {}
        var newMsg = {}
        var exists = false
        var selected = false
        var saved = false

        if (args[1]) {
            if (args[1] === "list") {
                const testFolder = './strings/';
                await fs.readdir(testFolder, async (err, files) => {
                    var listD = ""
                    files.forEach(async (element, index, array) => {
                        listD = listD + "\n" + strings.listElement.replace("%%code%%", element).replace("%%language%%", strings[element] || "Unknown")
                        if (index === array.length - 1) {
                            const embed = new Discord.MessageEmbed()
                                .setColor(neutralColor)
                                .setAuthor(strings.moduleName)
                                .setTitle(strings.listTitle)
                                .setDescription(listD)
                                .setFooter(executedBy)
                            await message.channel.send(embed)
                        }
                    })
                })
                return
            } else {
                const embed = new Discord.MessageEmbed()
                    .setColor(loadingColor)
                    .setAuthor(strings.moduleName)
                    .setTitle(strings.loading)
                    .setDescription(strings.changing)
                    .setFooter(executedBy);
                const msg = await message.channel.send(embed)

                const path = './strings/' + args[1] + '/language.json'
                fs.access(path, fs.F_OK, async (err) => {
                    if (!err) {
                        const oldMessages = await message.client.channels.cache.get("782635440054206504").messages.fetch() //language-database
                        const oldFiMessages = await oldMessages.filter(element => element.content.includes(message.author.id))
                        oldFiMessages.forEach(async element => {
                            console.log("Old old message: " + element.content)
                            await element.delete()
                            oldMsg = await element.content.split(" ")
                            await oldMsg.splice(oldMsg.indexOf(message.author.id), 1)
                            console.log("New old message: " + oldMsg)
                            await message.client.channels.cache.get("782635440054206504").send(oldMsg.join(" ")) //language-database
                        })
                        const newMessages = await message.client.channels.cache.get("782635440054206504").messages.fetch() //language-database
                        const newFiMessages = await newMessages.filter(element => (element.content.split(" ")[0] === args[1]))
                        await newFiMessages.forEach(async element => {
                            exists = true
                            strings = await require(("../strings/" + args[1] + "/language.json"))
                            executedBy = await strings.executedBy.replace("%%user%%", message.author.tag)
                            newMsg = await element.content.split(" ")
                            console.log("Old new message: " + element.content)
                            if (!element.content.includes(message.author.id)) { await newMsg.push(message.author.id) }
                            console.log("New new message: " + newMsg)
                            await element.delete()
                            await message.client.channels.cache.get("782635440054206504").send(newMsg.join(" ")) //language-database
                            saved = true
                            const embed = new Discord.MessageEmbed()
                                .setColor(successColor)
                                .setAuthor(strings.moduleName)
                                .setDescription(strings.credits)
                                .setFooter(executedBy);
                            if (strings.changedToTitle === "Changed your language to English!") { embed.setTitle("Changed your language to " + strings[args[1]] + "!") } else { embed.setTitle(strings.changedToTitle) }
                            await msg.edit(embed)
                            return
                        })
                        await setTimeout(async () => {
                            if (!saved) {
                                const embed = new Discord.MessageEmbed()
                                    .setColor(successColor)
                                    .setAuthor("Language")
                                    .setTitle("Reset your language to English!")
                                    .setDescription("This happened because you chose a language that already was your language preference.")
                                    .setFooter("Executed by " + message.author.tag);
                                await msg.edit(embed)
                                return
                            }
                        }, 1000)
                    } else {
                        const testFolder = './strings/';
                        await fs.readdir(testFolder, async (err, files) => {
                            const embed = new Discord.MessageEmbed()
                                .setColor(errorColor)
                                .setAuthor(strings.moduleName)
                                .setTitle(strings.errorTitle)
                                .setDescription(strings.errorDescription + "\n`" + files.join("`, `") + "`\n" + strings.suggestAdd)
                                .setFooter(executedBy);
                            await msg.edit(embed)
                        });
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
                const testFolder = './strings/';
                await fs.readdir(testFolder, async (err, files) => {
                    const embed = new Discord.MessageEmbed()
                        .setColor(neutralColor)
                        .setAuthor(strings.moduleName)
                        .setDescription(strings.errorDescription + "\n`" + files.join("`, `") + "`\n\n" + strings.credits)
                        .setFooter(executedBy)
                    if (strings.current === "Your language preference is set to English.") { embed.setTitle("Your language preference is set to " + strings[oldMsg[0]] + ".") } else { embed.setTitle(strings.current) }
                    await message.channel.send(embed)
                })
                return
            })
            if (!selected) {
                const testFolder = './strings/';
                await fs.readdir(testFolder, async (err, files) => {
                    const embed = new Discord.MessageEmbed()
                        .setColor(neutralColor)
                        .setAuthor(strings.moduleName)
                        .setTitle("Your language preference is set to English.")
                        .setFooter(executedBy)
                        .setDescription(strings.errorDescription + "\n`" + files.join("`, `") + "`\n\nFound an issue? Report it using `+issue`.")
                    await message.channel.send(embed)
                })
                return
            }
        }
    }
}
