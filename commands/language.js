const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");
const fs = require("fs")

module.exports = {
    name: "language",
    description: "Saves your language preference.",
    aliases: ["lang"],
    usage: "language [language code]",
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

        if (args[1]) {
            const embed = new Discord.MessageEmbed()
                .setColor(workingColor)
                .setAuthor(strings.moduleName)
                .setTitle(strings.changingTitle)
                .setFooter(executedBy);
            const msg = await message.channel.send(embed)

            const path = './strings/' + args[1] + '/language.json'
            fs.access(path, fs.F_OK, async (err) => {
                if (!err) {
                    oldFiMessages.forEach(async element => {
                        await element.delete()
                        oldMsg = await element.content.split(" ")
                        await oldMsg.splice(oldMsg.indexOf(message.author.id), 1)
                        await message.client.channels.cache.get("748968125663543407").send(oldMsg.join(" "))
                        const newMessages = await message.client.channels.cache.get("748968125663543407").messages.fetch() //languages database
                        const newFiMessages = await newMessages.filter(element => element.content.startsWith(args[1]))
                        newFiMessages.forEach(async element => {
                            exists = true
                            strings = await require(("../strings/" + args[1] + "/language.json"))
                            executedBy = await strings.executedBy.replace("%%user%%", message.author.tag)
                            newMsg = await element.content.split(" ")
                            await newMsg.push(message.author.id)
                            await element.delete()
                            await message.client.channels.cache.get("748968125663543407").send(newMsg.join(" "))
                            const embed = new Discord.MessageEmbed()
                                .setColor(successColor)
                                .setAuthor(strings.moduleName)
                                .setDescription(strings.credits)
                                .setFooter(executedBy);
                            if (strings.changedToTitle === "Changed your language to English!") { embed.setTitle("Changed your language to " + strings[args[1]] + "!") } else { embed.setTitle(strings.changedToTitle) }
                            await msg.edit(embed)
                            const oldMessages = await message.client.channels.cache.get("748968125663543407").messages.fetch() //languages database
                            const oldFiMessages = await oldMessages.filter(element => element.content.includes(message.author.id))
                        })
                    })
                } else {
                    const testFolder = './strings/';
                    await fs.readdir(testFolder, async (err, files) => {
                        const embed = new Discord.MessageEmbed()
                            .setColor(errorColor)
                            .setAuthor(strings.moduleName)
                            .setTitle(strings.errorTitle)
                            .setDescription(strings.errorDescription + "\n" + files.join(", "))
                            .setFooter(executedBy);
                        await msg.edit(embed)
                    });
                    return
                }
            })
        } else {
            const oldMessages = await message.client.channels.cache.get("748968125663543407").messages.fetch() //languages database
            const oldFiMessages = await oldMessages.filter(element => element.content.includes(message.author.id))
            oldFiMessages.forEach(async element => {
                selected = true
                oldMsg = await element.content.split(" ")
                const testFolder = './strings/';
                await fs.readdir(testFolder, async (err, files) => {
                    const embed = new Discord.MessageEmbed()
                        .setColor(neutralColor)
                        .setAuthor(strings.moduleName)
                        .setDescription(strings.errorDescription + "\n" + files.join(", ") + "\n\n" + strings.credits)
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
                        .setDescription(strings.errorDescription + "\n" + files.join(", ") + "\n\nFound a bug? Execute `+bug <message>`.")
                    await message.channel.send(embed)
                })
                return
            }
        }



        /*if (args[1]) {
            const embed = new Discord.MessageEmbed()
                .setColor(workingColor)
                .setAuthor(strings.moduleName)
                .setTitle(strings.changingTitle)
                .setFooter(executedBy);
            message.channel.send(embed)
                .then(msg => {
                    message.client.channels.cache.get("748968125663543407").messages.fetch() //languages database
                        .then(async messages => {
                            fiMessages = messages.filter(msg => msg.content.startsWith(message.author.id))
                            var f = 0
                            if (fiMessages) {
                                fiMessages.forEach(element => {
                                    f = 1
                                    const path = './strings/' + args[1] + '/language.json'
                                    fs.access(path, fs.F_OK, async (err) => {
                                        if (err) {
                                            const testFolder = './strings/';
                                            await fs.readdir(testFolder, (err, files) => {
                                                const embed = new Discord.MessageEmbed()
                                                    .setColor(errorColor)
                                                    .setAuthor(strings.moduleName)
                                                    .setTitle(strings.errorTitle)
                                                    .setDescription(strings.errorDescription + "\n" + files.join(", "))
                                                    .setFooter(executedBy);
                                                msg.edit(embed)
                                                return
                                            });
                                            return
                                        }
                                        element.delete()
                                        message.client.channels.cache.get("748968125663543407").send(message.author.id + " " + args[1])
                                        strings = require(("../strings/" + args[1] + "/language.json"))
                                        executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
                                        var currentTime = new Date().getTime(); while (currentTime + 100 >= new Date().getTime()) { };
                                        const embed = new Discord.MessageEmbed()
                                            .setColor(successColor)
                                            .setAuthor(strings.moduleName)
                                            .setDescription(strings.credits)
                                            .setFooter(executedBy);
                                        if (strings.changedToTitle === "Changed your language to English!") { embed.setTitle("Changed your language to " + strings[args[1]] + "!") } else { embed.setTitle(strings.changedToTitle) }
                                        msg.edit(embed)
                                    })
                                });
                            } if (f == 0) {
                                const path = './strings/' + args[1] + '/language.json'
                                fs.access(path, fs.F_OK, async (err) => {
                                    if (err) {
                                        const testFolder = './strings/';
                                        await fs.readdir(testFolder, (err, files) => {
                                            const embed = new Discord.MessageEmbed()
                                                .setColor(errorColor)
                                                .setAuthor(strings.moduleName)
                                                .setTitle(strings.errorTitle)
                                                .setDescription(strings.errorDescription + "\n" + files.join(", "))
                                                .setFooter(executedBy);
                                            msg.edit(embed)
                                            return
                                        });
                                        return
                                    }
                                    message.client.channels.cache.get("748968125663543407").send(message.author.id + " " + args[1])
                                    strings = require(("../strings/" + args[1] + "/language.json"))
                                    executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
                                    var currentTime = new Date().getTime(); while (currentTime + 100 >= new Date().getTime()) { };
                                    const embed = new Discord.MessageEmbed()
                                        .setColor(successColor)
                                        .setAuthor(strings.moduleName)
                                        .setDescription(strings.credits)
                                        .setFooter(executedBy);
                                    if (strings.changedToTitle === "Changed your language to English!") { embed.setTitle("Changed your language to " + strings[args[1]] + "!") } else { embed.setTitle(strings.changedToTitle) }
                                    msg.edit(embed)
                                })
                            }
                        })
                })
        } else {
            const testFolder = './strings/';
            await fs.readdir(testFolder, async (err, files) => {
                await message.client.channels.cache.get("748968125663543407").messages.fetch() //languages database
                    .then(async langDbMessages => {
                        fiMessages = langDbMessages.filter(msg => msg.content.startsWith(message.author.id))
                        if (fiMessages) {
                            await fiMessages.forEach(async element => {
                                const langprefs = element.content.split(" ")
                                const embed = new Discord.MessageEmbed()
                                    .setColor(neutralColor)
                                    .setAuthor(strings.moduleName)
                                    .setDescription(strings.errorDescription + "\n" + files.join(", ") + "\n\n" + strings.credits)
                                    .setFooter(executedBy)
                                if (strings.current === "Your language preference is set to English.") { embed.setTitle("Your language preference is set to " + strings[langprefs[1]] + ".") } else { embed.setTitle(strings.current) }
                                await message.channel.send(embed)
                                return;
                            })
                        } else {
                            const embed = new Discord.MessageEmbed()
                                .setColor(neutralColor)
                                .setAuthor(strings.moduleName)
                                .setTitle("Your language preference is set to English.")
                                .setFooter(executedBy)
                                .setDescription(strings.errorDescription + "\n" + files.join(", ") + "\n\nFound a bug? Execute `+bug <message>`.")
                            await message.channel.send(embed)
                            return;
                        }
                    })
            })
        }*/
    }
}
