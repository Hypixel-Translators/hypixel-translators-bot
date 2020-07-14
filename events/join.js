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
            .setDescription("Hey there, thanks for joining **the Hypixel Translators Community Discord**! Are you a translator/proofreader for Hypixel or Quickplay?\n\nClick ✅ if so, or ❎ if you just want to chill in the Discord.")
        member.send(embed)
            .then(msg => {
                const server = msg.client.guilds.cache.get("549503328472530974")
                const user = server.member(member)
                const verifiedRole = server.roles.cache.get("569194996964786178")

                msg.react("✅").then(() => { msg.react("❎") })

                const filter = (reaction, reacter) => {
                    return (reaction.emoji.name === '✅' || reaction.emoji.name === '❎') && reacter.id === member;
                };

                const collector = msg.createReactionCollector(filter, { time: 240000 });

                collector.on('collect', (reaction, reacter) => {
                    if (reaction.emoji.name === '❎') {
                        if (user.lastmessage()) {
                            const embed = new Discord.MessageEmbed()
                                .setColor(neutralColor)
                                .setTitle("Verification")
                                .setDescription("You're not a translator. Because you have been in this server before, you'll need to be manually verified. You'll gain access to the server shortly!")
                            msg.edit(embed)
                            verify.send(member.user.tag + " would like to be verified as a player, but a previous message has been found in the server.")
                            verifylogs.send(member.user.tag + " has requested to be verified as a player, but a previous message has been detected in the server.")
                        } else {
                            const embed = new Discord.MessageEmbed()
                                .setColor(successColor)
                                .setTitle("Verification")
                                .setDescription("You're not a translator. You'll gain access to the server shortly!")
                            msg.edit(embed)
                            user.roles.add(verifiedRole)
                            verify.send(member.user.tag + " was verified as a player.")
                            verifylogs.send(member.user.tag + " has been verified as a player.")
                        }
                    }
                    if (reaction.emoji.name === '✅') {
                        const embed = new Discord.MessageEmbed()
                            .setColor(workingColor)
                            .setTitle("Verification")
                            .setDescription("You're a translator.")
                        msg.edit(embed)
                    }
                })

                collector.on('end', collected => {
                    const receivedEmbed = msg.embeds[0];
                    const embed = new Discord.MessageEmbed(receivedEmbed).setFooter('The timer ended, reacting won\'t trigger anything anymore.');
                    msg.edit(embed)
                })
            })
    }
}