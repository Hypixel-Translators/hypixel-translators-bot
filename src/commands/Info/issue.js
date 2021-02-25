const { successColor } = require("../../config.json")
const Discord = require("discord.js")

module.exports = {
    name: "issue",
    description: "Opens the GitHub issues page.",
    usage: "+issue",
    aliases: ["issues", "bug", "feedback"],
    cooldown: 120,
    allowDM: true,
    channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058"], //bots staff-bots bot-dev bot-translators
    execute(message, args, getString) {
        const executedBy = getString("executedBy").replace("%%user%%", message.author.tag)
        const embed = new Discord.MessageEmbed()
            .setColor(successColor)
            .setAuthor(getString("moduleName"))
            .setTitle(getString("bugT"))
            .setDescription(getString("bugD").replace("%%github%%", "(https://github.com/Hypixel-Translators/hypixel-translators-bot/issues)"))
            .addFields({ name: getString("urgentT"), value: getString("urgentD") })
            .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
        message.channel.send(embed)
    }
}
