const { workingColor, errorColor, successColor, neutralColor, quotes, names } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
    name: "quote",
    description: "Get a funny/weird/wise quote from the server.",
    usage: "quote",
    cooldown: 3,
    allowDM: true,
    execute(message, args) {
        var number = Math.floor(Math.random() * quotes.length)
        var quote = quotes[number]
        var name = names[number]

        //message.delete();
        const embed = new Discord.MessageEmbed()
            .setColor(successColor)
            .setTitle(quote)
            .setDescription("_      - By " + name + "_")
            .setFooter("Executed by " + message.author.tag);
        message.channel.send(embed)
    }
};
