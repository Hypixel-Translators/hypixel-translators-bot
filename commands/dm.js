const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
    name: "dm",
    description: "Sends the user a private message.",
    usage: "verify <mention> <message>",
    cooldown: 3,
    aliases: ["message", "privatemessage"],
    allowDM: true,
    execute(message, args) {
        var allowed = false
        if (message.author.id == "722738307477536778") { allowed = true }
        if (message.channel.type !== "dm") { if (message.member.roles.cache.has("621071221462663169") || message.member.roles.cache.has("549885657749913621") || message.member.roles.cache.has("241926666400563203")) { allowed = true } }
        if (!allowed) return;

        var userToSend = args[0].replace(/[\\<>@#&!]/g, "");
        args.splice(0, 1)
        var toSend = args.join(" ")

        //message.delete();
        const embed = new Discord.MessageEmbed()
            .setColor(workingColor)
            .setTitle("📨 Messaging a user...")
            .setDescription("One second... ")
            .addFields(
                { name: "Message", value: toSend }
            )
            .setFooter("Executed by " + message.author.tag);
        message.channel.send(embed)
            .then(msg => {
                const recipient = msg.client.users.cache.get(userToSend)
                const report = new Discord.MessageEmbed()
                    .setColor(neutralColor)
                    .setTitle("📩 Message from staff")
                    .setDescription(toSend)
                    .setFooter("Any message you send here will get sent to staff.");
                recipient.send(report)
                    .catch(err => {
                        const embed = new Discord.MessageEmbed()
                            .setColor(errorColor)
                            .setTitle("📨 Messaging " + recipient.username)
                            .setDescription("Message couldn't be sent.\n\nReason:\n> " + err)
                            .addFields(
                                { name: "Message", value: toSend }
                            )
                            .setFooter("Executed by " + message.author.tag);
                        msg.edit(embed)
                    })
                const embed = new Discord.MessageEmbed()
                    .setColor(successColor)
                    .setTitle("📨 Messaging " + recipient.username)
                    .setDescription(toSend)
                    .setFooter("Executed by " + message.author.tag);
                msg.edit(embed)
            })
    }
}; 