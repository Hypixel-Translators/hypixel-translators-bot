const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
    name: "bug",
    description: "Report a bug present in the bot.",
    usage: "bug <message>",
    aliases: ["bugreport", "reportbug"],
    cooldown: 480,
    allowDM: true,
    channelBlackList: "621298919535804426",
    execute(message, args) {
        var toSend = args.join(" ")

        //message.delete();
        const embed = new Discord.MessageEmbed()
            .setColor(workingColor)
            .setTitle("Report a bug")
            .setDescription("Your bug report is being sent...")
            .addFields({ name: "Bug report", value: toSend })
            .setFooter("Executed by " + message.author.tag);
        message.channel.send(embed)
            .then(msg => {
                const sendTo = msg.client.channels.cache.get("730042612647723058")
                const report = new Discord.MessageEmbed()
                    .setColor(neutralColor)
                    .setTitle("Bug report")
                    .setDescription("A fresh bug report has arrived. Time to fix stuff!")
                    .addFields({ name: "Bug report", value: toSend }, { name: "Reply", value: "\`+dm " + message.author.id + " \`" })
                    .setFooter("Reported by " + message.author.tag);
                sendTo.send(report)
                const embed = new Discord.MessageEmbed()
                    .setColor(successColor)
                    .setTitle("Report a bug")
                    .setDescription("Your bug report has been sent!")
                    .addFields({ name: "Bug report", value: toSend })
                    .setFooter("Executed by " + message.author.tag);
                msg.edit(embed)
            })
    }
};
