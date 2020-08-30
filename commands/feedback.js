const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
    name: "feedback",
    description: "Give feedback on the bot.",
    usage: "feedback <message>",
    aliases: ["feature", "idea"],
    cooldown: 480,
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
            .setTitle("Give feedback")
            .setDescription("Your feedback is being sent...")
            .addFields({ name: "Feedback", value: toSend })
            .setFooter(executedBy)
        message.channel.send(embed)
            .then(msg => {
                const sendTo = msg.client.channels.cache.get("730042612647723058")
                const report = new Discord.MessageEmbed()
                    .setColor(neutralColor)
                    .setTitle("Feedback")
                    .setDescription("Some feedback has arrived. Enjoy?")
                    .addFields({ name: "Feedback", value: toSend }, { name: "Reply", value: "\`+dm " + message.author.id + " \`" })
                    .setFooter("Suggested by " + message.author.tag);
                sendTo.send(report)
                const embed = new Discord.MessageEmbed()
                    .setColor(successColor)
                    .setTitle("Give feedback")
                    .setDescription("Your feedback has been sent!")
                    .addFields({ name: "Feedback", value: toSend })
                    .setFooter(executedBy)
                msg.edit(embed)
            })
    }
};
