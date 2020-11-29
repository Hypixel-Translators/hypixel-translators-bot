const { loadingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
    name: "issue",
    description: "Opens the GitHub issues page.",
    usage: "+issue",
    aliases: ["issues", "bug", "feedback"],
    cooldown: 320,
    allowDM: true,
    channelBlackList: "621298919535804426",
    execute(strings, message) {
        const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
        const embed = new Discord.MessageEmbed()
            .setColor(successColor)
            .setAuthor(strings.moduleName)
            .setTitle(strings.bugT)
            .setDescription(strings.bugD.replace("%%github%%", "(https://github.com/stannya/hypixel-translators-bot-discord/issues)"))
            .addFields({ name: strings.urgentT, value: strings.urgentD.replace("%%QkeleQ10%%", "<@240875059953139714>") })
            .setFooter(executedBy);
        message.channel.send(embed)
    }
};
