const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
    name: "poll",
    description: "Creates a poll in the current channel.",
    usage: "poll <role to ping|'none'>/<question>/<a1 emoji>-<a1 text>/<a2 emoji>-<a2 text>[/...-...]",
    cooldown: 30,
    execute(message) {
        const args = message.content.slice(6).split("/");
        const pingRole = args[0]
        const question = args[1]
        var remove = args.shift()
        remove = args.shift()

        const embed = new Discord.MessageEmbed()
            .setColor(neutralColor)
            .setTitle(question)
            .setDescription("To vote, react below.")
            .setFooter("Poll created by " + message.author.tag + " | This message will update to reflect the poll's status.");

        args.forEach(arg => {
            const option = arg.split("-")
            const emoji = option[0]
            const text = option[1]
            embed.addField(emoji, text)
        })
        message.channel.send(embed)
    }
}