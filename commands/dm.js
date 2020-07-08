const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
    name: "dm",
    description: "Sends the user a private message.",
    usage: "verify <mention> <message>",
    cooldown: 3,
    aliases: ["message", "privatemessage"],
    execute(message, args) {
        if (message.member.hasPermission("ADMINISTRATOR")) {
            var userToSend = args[0].replace(/[\\<>@#&!]/g, "");
            args.splice(0, 1)
            var toSend = args.join(" ")

            //message.delete();
            const embed = new Discord.MessageEmbed()
                .setColor(workingColor)
                .setTitle("DM")
                .setDescription("One second... ")
                .addFields(
                    { name: "Message", value: toSend },
                    { name: "Recipient", value: "<@" + userToSend + ">" }
                )
                .setFooter("Executed by " + message.author.tag);
            message.channel.send(embed)
                .then(msg => {
                    const recipient = msg.client.users.cache.get(userToSend)
                    recipient.send(toSend)
                        .then(() => {
                            const embed = new Discord.MessageEmbed()
                                .setColor(successColor)
                                .setTitle("DM")
                                .setDescription("Message sent!")
                                .addFields(
                                    { name: "Message", value: toSend },
                                    { name: "Recipient", value: "<@" + userToSend + ">" }
                                )
                                .setFooter("Executed by " + message.author.tag);
                        })
                        .catch(err => {
                            const embed = new Discord.MessageEmbed()
                                .setColor(errorColor)
                                .setTitle("DM")
                                .setDescription("Message couldn't be sent.\n\nReason:\n> " + err)
                                .addFields(
                                    { name: "Message", value: toSend },
                                    { name: "Recipient", value: "<@" + userToSend + ">" }
                                )
                                .setFooter("Executed by " + message.author.tag);
                        })
                })
        }
    }
};