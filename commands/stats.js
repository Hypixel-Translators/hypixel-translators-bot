const { loadingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");
const stats = require('../events/stats.js')

module.exports = {
    name: "stats",
    description: "Updates statistics channels and notifies members of new strings (if applicable).",
    usage: "+stats",
    aliases: ["statistics", "progress"],
    allowDM: true,
    async execute(strings, message, args) {
        const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
        if (!message.member.hasPermission("ADMINISTRATOR")) throw noAccess;
        const embed = new Discord.MessageEmbed()
            .setColor(loadingColor)
            .setAuthor(strings.moduleName)
            .setTitle(strings.started)
            .setFooter(executedBy)
        message.channel.send(embed)
            .then(msg => {
                stats.execute(message.client, true)
                    .then(() => {
                        const embed = new Discord.MessageEmbed()
                            .setColor(successColor)
                            .setAuthor(strings.moduleName)
                            .setTitle(strings.done)
                            .setFooter(executedBy)
                        msg.edit(embed)
                    })
                    .catch(err => { throw err })
            })
    }
}