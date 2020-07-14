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
            .setDescription("Hey there, thanks for joining **the Hypixel Translators Community Discord**! Are you a translator/proofreader for Hypixel or Quickplay?\n\nClick <:vote_yes:732298639749152769> if so, or <:vote_no:732298639736570007> if you just want to chill in the Discord.")
        member.send(embed)
            .then(msg => {
                const server = msg.client.guilds.cache.get("549503328472530974")
                const user = server.member(member)
                const one = msg.client.emojis.cache.get("714091580847554590"); const two = msg.client.emojis.cache.get("714091580750954556");
                const verify = msg.client.channels.cache.get("569178590697095168")
                const verifylogs = msg.client.channels.cache.get("662660931838410754")

                msg.react(one).then(() => { msg.react(two) })

                const filter = (reaction, reacter) => {
                    return (reaction.emoji === one || reaction.emoji === two) && reacter.id === member;
                };

                const collector = msg.createReactionCollector(filter, { time: 120000 });

                collector.on('collect', (reaction, reacter) => {
                    if (reaction.emoji === two) {
                        if (user.lastmessage()) {
                            const embed = new Discord.MessageEmbed()
                                .setColor(neutralColor)
                                .setTitle("Verification")
                                .setDescription("You're not a translator. Because you have been in this server before, you'll need to be manually verified.")
                            msg.edit(embed)
                            verify.send(member.user.tag + " would like to be verified as a player, but a previous message has been found in the server.")
                            verifylogs.send(member.user.tag + " has requested to be verified as a player, but a previous message has been detected in the server.")
                        } else {
                            const embed = new Discord.MessageEmbed()
                                .setColor(successColor)
                                .setTitle("Verification")
                                .setDescription("You're not a translator. You'll gain access to the server shortly!")
                            msg.edit(embed)
                            verify.send(member.user.tag + " would like to be verified as a player.")
                            verifylogs.send(member.user.tag + " has requested to be verified as a player.")
                        }
                    }
                    if (reaction.emoji === one) {
                        const embed = new Discord.MessageEmbed()
                            .setColor(workingColor)
                            .setTitle("Welcome!")
                            .setDescription("You're a translator.")
                        msg.edit(embed)
                    }
                })
            })
    }
}