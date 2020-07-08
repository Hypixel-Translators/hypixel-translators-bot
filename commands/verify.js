const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
    name: "verify",
    description: "Verifies the user on the Hypixel project.",
    usage: "verify <mention> <language> <role> <profile>",
    cooldown: 3,
    execute(message) {
        if (message.member.hasPermission("ADMINISTRATOR")) {
            var userToSend = args[0].replace(/[\\<>@#&!]/g, "");
            var type = args[1]
            const lowerArg = args[0].toLowerCase()
            var toLook = lowerArg.charAt(0).toUpperCase() + lowerArg.slice(1)

            //message.delete();
            const embed = new Discord.MessageEmbed()
                .setColor(workingColor)
                .setTitle("Verify")
                .setDescription("One second... ")
                .addFields(
                    { name: "Message", value: toSend },
                    { name: "Recipient", value: "<@" + userToSend + ">" }
                )
                .setFooter("Executed by " + message.author.tag);
            message.channel.send(embed)
                .then(msg => {
                    const recipient = msg.client.users.cache.get(userToSend)
                })
        }
    }
};