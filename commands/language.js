const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const { prefix } = require("../config.json");
var strings = require("../strings/en/language.json")
const Discord = require("discord.js");
const fs = require("fs")

module.exports = {
    name: "language",
    description: "Saves your language preference.",
    aliases: ["lang"],
    usage: "language [language code]",
    channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058"],
    allowDM: true,
    cooldown: 10,
    async execute(message, args) {
        await message.client.channels.cache.get("748968125663543407").messages.fetch({ limit: 100 }) //languages database
            .then(async messages => {
                fiMessages = messages.filter(msg => msg.content.startsWith(message.author.id))
                if (fiMessages) {
                    await fiMessages.forEach(element => {
                        const langprefs = element.content.split(" ")
                        strings = require(("../strings/" + langprefs[1] + "/language.json"))
                    });
                }
            })
        var currentTime = new Date().getTime(); while (currentTime + 100 >= new Date().getTime()) { };
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
                        if (fiMessages) {
                            fiMessages.forEach(element => {
                                element.delete()
                            });
                        }
                        fs.readdir("../strings/en", (err, files) => {
                            const enFileCount = files.length
                        });
                        fs.readdir("../strings/" + args[0], (err, files) => {
                            const enFileCount = files.length
                        });

                        if (enFileCount.length !== langFileCount) {
                            const embed = new Discord.MessageEmbed()
                                .setColor(errorColor)
                                .setAuthor(strings.moduleName)
                                .setTitle(strings.errorTitle)
                                .setDescription(strings.errorDescription)
                                .setFooter(strings.executedBy + message.author.tag);
                            msg.edit(embed)
                            return
                        }

                        message.client.channels.cache.get("748968125663543407").send(message.author.id + " " + args[0])
                        strings = require(("../strings/" + args[0] + "/language.json"))
                        var currentTime = new Date().getTime(); while (currentTime + 100 >= new Date().getTime()) { };
                        const embed = new Discord.MessageEmbed()
                            .setColor(successColor)
                            .setAuthor(strings.moduleName)
                            .setTitle(strings.changedToTitle)
                            .setFooter(strings.executedBy + message.author.tag);
                        msg.edit(embed)
                    })
            })
    }
}