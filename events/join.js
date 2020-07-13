const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
    name: "context",
    description: "Does nothing for now!",
    usage: "context <link/ID>",
    channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058"],
    cooldown: 3,
    execute(member) {
        const embed = new Discord.MessageEmbed()
            .setColor(neutralColor)
            .setTitle("Welcome!")
            .setDescription("Hey there, thanks for joining **the Hypixel Translators Community Discord**! Are you a translator for Hypixel or Crowdin?\n\nClick <:q_vote_yes:714091580847554590> if so, or <:q_vote_no:714091580750954556> if you just want to chill in the Discord.")
            .setFooter("Executed by " + message.author.tag);
        member.send(embed)
            .then(msg => {
                msg.react("714091580847554590").then(() => { msg.react("714091580750954556") })

                const filter = (reaction, reacter) => {
                    return (reaction.emoji.name === "714091580847554590" || reaction.emoji.name === "714091580750954556") && reacter.id === member;
                };

                const collector = msg.createReactionCollector(filter, { time: 120000 });

                collector.on('collect', (reaction, reacter) => {
                    if (reaction.emoji.name === "714091580750954556") {
                        const embed = new Discord.MessageEmbed()
                            .setColor(neutralColor)
                            .setTitle("Welcome!")
                            .setDescription("You're not a translator.")
                            .setFooter("Executed by " + message.author.tag);
                    }
                    if (reaction.emoji.name === "714091580847554590") {
                        const embed = new Discord.MessageEmbed()
                            .setColor(neutralColor)
                            .setTitle("Welcome!")
                            .setDescription("You're a translator.")
                            .setFooter("Executed by " + message.author.tag);
                    }
                })
            })
    }
}