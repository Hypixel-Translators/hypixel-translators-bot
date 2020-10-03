const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
    name: "bug",
    description: "Opens the GitHub issues page.",
    usage: "bug",
    aliases: ["issue", "issues"],
    cooldown: 320,
    allowDM: true,
    channelBlackList: "621298919535804426",
    execute(strings, message) {
        const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
        const embed = new Discord.MessageEmbed()
            .setColor(successColor)
            .setAuthor(strings.moduleName)
            .setTitle(strings.bugT)
            .setDescription(strings.bugD.replace("%%link%%", "(https://github.com/QkeleQ10/hypixel-translators-bot-discord/issues)"))
            .addFields({ name: strings.urgentT, value: strings.urgentD.replace("%%q10%%", "<@722738307477536778>") })
            .setFooter(executedBy);
        message.channel.send(embed)
    }
};
