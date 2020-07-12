const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");
const ContextModel = require('../models/Context')
const { connect } = require('mongoose')

module.exports = {
    name: "context",
    description: "Does nothing for now!",
    usage: "context <link/ID>",
    channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058"],
    cooldown: 3,
    execute(message, args) {
        const req = ContextModel.findOne({ id: args[0] })

        console.log(message + "\n" + args)
        console.log(req)
        if (!req.id) {
            const embed = new Discord.MessageEmbed()
                .setColor(neutralColor)
                .setTitle("Context")
                .setDescription("This string wasn't found. To create a new context entry, react with ✅ within 10 seconds.")
                .setFooter("Executed by " + message.author.tag);
            message.channel.send(embed).then(msg => {
                const filter = (reaction, reacter) => {
                    return (reaction.emoji.name === "✅") && reacter.id === message.author.id;
                };

                const collector = msg.createReactionCollector(filter, { time: 10000 });

                collector.on('collect', (reaction, reacter) => {
                    if (reaction.emoji.name === "✅") {
                        const doc = new ContextModel({ id: args[0] })
                        const embed = new Discord.MessageEmbed()
                            .setColor(successColor)
                            .setTitle("Context")
                            .setDescription("A new context entry has been made!\n\n> " + doc)
                            .setFooter("Executed by " + message.author.tag);
                        msg.edit(embed)
                    }
                })
                collector.on('end', collected => {
                    const embed = new Discord.MessageEmbed()
                        .setColor(neutralColor)
                        .setTitle("Context")
                        .setDescription("This string wasn't found. To create a new context entry, re-run this command.")
                        .setFooter("Executed by " + message.author.tag);
                    msg.edit(embed)
                })
            })
        } else {
            const embed = new Discord.MessageEmbed()
                .setColor(successColor)
                .setTitle("Context")
                .setDescription("This entry has been found!\n\n> " + req)
                .setFooter("Executed by " + message.author.tag);
            message.channel.send(embed)
        }
    }
}
