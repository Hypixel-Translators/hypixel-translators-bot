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
    cooldown: 10,
    async execute(strings, message) {
        const msgL = message.toLowerCase()
        const args = msgL.split(" ")

        if (args[0]) {
            const embed = new Discord.MessageEmbed()
                .setColor(workingColor)
                .setAuthor(strings.moduleName)
                .setTitle(strings.changingTitle)
                .setFooter(strings.executedBy + message.author.tag);
            message.channel.send(embed)
                .then(msg => {
                    message.client.channels.cache.get("748968125663543407").messages.fetch({ limit: 100 }) //languages database
                        .then(async messages => {
                            fiMessages = messages.filter(msg => msg.content.startsWith(message.author.id))
                            var f = 0
                            if (fiMessages) {
                                fiMessages.forEach(element => {
                                    f = 1
                                    element.delete()
                                    const path = './strings/' + args[0] + '/language.json'
                                    fs.access(path, fs.F_OK, async (err) => {
                                        if (err) {
                                            const testFolder = './strings/';
                                            await fs.readdir(testFolder, (err, files) => {
                                                const embed = new Discord.MessageEmbed()
                                                    .setColor(errorColor)
                                                    .setAuthor(strings.moduleName)
                                                    .setTitle(strings.errorTitle)
                                                    .setDescription(strings.errorDescription + "\n" + files.join(", "))
                                                    .setFooter(strings.executedBy + message.author.tag);
                                                msg.edit(embed)
                                                return
                                            });

                                        }
                                        message.client.channels.cache.get("748968125663543407").send(message.author.id + " " + args[0])
                                        strings = require(("../strings/" + args[0] + "/language.json"))
                                        var currentTime = new Date().getTime(); while (currentTime + 100 >= new Date().getTime()) { };
                                        const embed = new Discord.MessageEmbed()
                                            .setColor(successColor)
                                            .setAuthor(strings.moduleName)
                                            .setTitle(strings.changedToTitle1 + strings[args[0]] + strings.changedToTitle2)
                                            .setFooter(strings.executedBy + message.author.tag);
                                        if (args[0] !== "en") { embed.setDescription(strings.credits) } else { embed.setDescription("For bugs, execute `+bug <message>`.") }
                                        msg.edit(embed)
                                    })
                                });
                            } if (f == 0) {
                                const path = './strings/' + args[0] + '/language.json'
                                fs.access(path, fs.F_OK, async (err) => {
                                    if (err) {
                                        const testFolder = './strings/';
                                        await fs.readdir(testFolder, (err, files) => {
                                            const embed = new Discord.MessageEmbed()
                                                .setColor(errorColor)
                                                .setAuthor(strings.moduleName)
                                                .setTitle(strings.errorTitle)
                                                .setDescription(strings.errorDescription + "\n" + files.join(", "))
                                                .setFooter(strings.executedBy + message.author.tag);
                                            msg.edit(embed)
                                            return
                                        });

                                    }
                                    message.client.channels.cache.get("748968125663543407").send(message.author.id + " " + args[0])
                                    strings = require(("../strings/" + args[0] + "/language.json"))
                                    var currentTime = new Date().getTime(); while (currentTime + 100 >= new Date().getTime()) { };
                                    const embed = new Discord.MessageEmbed()
                                        .setColor(successColor)
                                        .setAuthor(strings.moduleName)
                                        .setTitle(strings.changedToTitle1 + strings[args[0]] + strings.changedToTitle2)
                                        .setFooter(strings.executedBy + message.author.tag);
                                    if (args[0] !== "en") { embed.setDescription(strings.credits) } else { embed.setDescription("For bugs, execute `+bug <message>`.") }
                                    msg.edit(embed)
                                })
                            }
                        })
                })
        } else {
            await fs.readdir(testFolder, async (err, files) => {
                const embed = new Discord.MessageEmbed()
                    .setColor(neutralColor)
                    .setAuthor(strings.moduleName)
                    .setTitle(strings.current1 + strings[args[0]] + strings.current2)
                    .setDescription(strings.errorDescription + "\n" + files.join(", "))
                    .setFooter(strings.executedBy + message.author.tag);
                await message.channel.send(embed)
            })
            return;
        }
    }
}
