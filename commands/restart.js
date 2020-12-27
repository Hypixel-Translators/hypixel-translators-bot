const { successColor } = require("../config.json")
const Discord = require("discord.js")

module.exports = {
    name: "restart",
    description: "Refresh the bot to apply changes and to fix errors.",
    aliases: ["refresh", "reload", "stop"],
    usage: "restart",
    allowDM: true,
    channelWhiteList: ["624881429834366986", "730042612647723058", "551693960913879071"], //staff-bots bot-dev admin-bots
    execute(message, strings) {
        if (!message.member.hasPermission("ADMINISTRATOR")) throw "noAccess"
        const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
        //message.delete()
        const embed = new Discord.MessageEmbed()
            .setColor(successColor)
            .setAuthor(strings.moduleName)
            .setTitle(strings.restarting)
            .setFooter(executedBy, message.author.displayAvatarURL())
        message.channel.send(embed)
        msg.client.user.setStatus("invisible")
        setTimeout(() => { process.exit() }, 1000)
    }
}
