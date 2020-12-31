const { successColor } = require("../config.json")
const Discord = require("discord.js")
const inactives = require("../events/inactives.js")

module.exports = {
    name: "inactives",
    description: "Checks for inactive unverified members (if applicable).",
    usage: "+inactives",
    aliases: ["updateinactives", "unverifieds", "inactive"],
    allowDM: true,
    async execute(message, strings) {
        const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
        if (!message.member.hasPermission("ADMINISTRATOR")) throw "noAccess"
        message.channel.startTyping()
        try {
            await inactives.execute(message.client, true)
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
