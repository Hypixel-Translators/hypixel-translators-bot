const { successColor } = require("../config.json")
const Discord = require("discord.js")
const unzalgo = require("../events/unzalgo.js")

module.exports = {
    name: "unzalgo",
    description: "Checks for zalgo characters in member's nicks and changes them",
    usage: "+unzalgo",
    aliases: ["zalgo", "zalgocheck"],
    roleWhitelist: ["768435276191891456"], //Discord Staff
    channelWhitelist: ["624881429834366986", "730042612647723058", "551693960913879071"], // staff-bots bot-development admin-bots
    async execute(message, strings) {
        const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
        if (!message.member.hasPermission("VIEW_AUDIT_LOG")) throw "noAccess"
        message.channel.startTyping()
        try {
            await unzalgo.execute(message.client, true)
            const embed = new Discord.MessageEmbed()
                .setColor(successColor)
                .setAuthor(strings.moduleName)
                .setTitle(strings.done)
                .setFooter(executedBy, message.author.displayAvatarURL())
            message.channel.stopTyping()
            message.channel.send(embed)
        } catch (err) { throw err }
    }
}
