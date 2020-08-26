const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");
const fetch = require("fetch");

module.exports = {
    name: "bug",
    description: "Report a bug present in the bot.",
    usage: "bug <message>",
    aliases: ["bugreport", "reportbug"],
    cooldown: 480,
    allowDM: true,
    channelBlackList: "621298919535804426",
    execute(message, args) {
        fetch(message, args)
    }
}

async function fetch(message, args) {
    const embed = new Discord.MessageEmbed()
        .setColor(successColor)
        .setTitle("Language status")
        .setFooter("Executed by " + message.author.tag);
    let url = "https://api.crowdin.com/api/project/hypixel/language-status?login=qkeleq10&account-key=8205d22af119c4233b1940265bdd77d9&json"
    result = await fetch.url
    result.forEach(r => {
        embed.addFields({ name: r.name, value: (r.translated + "translated _(" + ((100 * r.translated) / r.phrases) + "% from " + r.phrases + ")_, " + r.approved + " approved _(" + ((100 * r.translated) / r.phrases) + "% from " + r.phrases + ")_") })
    });
}