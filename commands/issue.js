const { successColor } = require("../config.json")
const Discord = require("discord.js")

module.exports = {
    name: "issue",
    description: "Opens the GitHub issues page.",
    usage: "+issue",
    aliases: ["issues", "bug", "feedback"],
    cooldown: 120,
    allowDM: true,
    channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058", "749391414600925335"], //bots staff-bots bot-dev bot-translators
    execute(message, strings) {
        const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
        const embed = new Discord.MessageEmbed()
            .setColor(successColor)
            .setAuthor(strings.moduleName)
            .setTitle(strings.bugT)
            .setDescription(strings.bugD.replace("%%github%%", "(https://github.com/Hypixel-Translators/hypixel-translators-bot/issues)"))
            .addFields({ name: strings.urgentT, value: strings.urgentD })
            .setFooter(executedBy, message.author.displayAvatarURL())
        message.channel.send(embed)
    }
}
