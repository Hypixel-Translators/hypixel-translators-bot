const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
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
    async execute(strings, message, args) {
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
                                const path = './strings/' + args[0] + '/language.json'
                                fs.access(path, fs.F_OK, (err) => {
                                    if (err) {
                                        console.error(err)
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
                            });
                        }
                    })
            })
    }
}
