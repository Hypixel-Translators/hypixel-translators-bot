const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
    name: "bug",
    description: "Report a bug present in the bot.",
    usage: "bug <message>",
    aliases: ["bugreport", "reportbug"],
    cooldown: 320,
    allowDM: true,
    channelBlackList: "621298919535804426",
    execute(strings, message, args) {
        const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
        var toSend = args.join(" ")

        if (!args[0]) {
            const embed = new Discord.MessageEmbed()
                .setColor(errorColor)
                .setAuthor(strings.moduleName)
                .setTitle(strings.addMessage)
                .setFooter(executedBy);
            message.channel.send(embed)
            return;
        }


        //message.delete();
        const embed = new Discord.MessageEmbed()
            .setColor(workingColor)
            .setAuthor(strings.moduleName)
            .setTitle(strings.sendingTitle)
            .setDescription(toSend)
            .setFooter(executedBy);
        message.channel.send(embed)
            .then(msg => {
                const sendTo = msg.client.channels.cache.get("730042612647723058")
                const report = new Discord.MessageEmbed()
                    .setColor(neutralColor)
                    .setAuthor("Bug report")
                    .setTitle("A fresh bug report has arrived. Time to fix stuff!")
                    .setDescription(toSend)
                    .addFields({ name: "To reply", value: "\`+dm " + message.author.id + " \`" })
                    .setFooter("Reported by " + message.author.tag);
                sendTo.send(report)
                const embed = new Discord.MessageEmbed()
                    .setColor(successColor)
                    .setAuthor(strings.moduleName)
                    .setTitle(strings.sentTitle)
                    .setDescription(toSend)
                    .setFooter(executedBy);
                msg.edit(embed)
            })
    }
};
