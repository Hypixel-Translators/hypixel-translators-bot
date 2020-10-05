const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");
const stats = require('../events/stats.js')

module.exports = {
    name: "stats",
    description: "Updates statistics channels and notifies members of new strings (if applicable).",
    usage: "stats",
    aliases: ["statistics", "progress"],
    allowDM: true,
    async execute(strings, message, args) {
        if (!message.member.roles.cache.has("620274909700161556") || !message.member.roles.cache.has("732586582787358781")) throw noAccess; // * and dev
        const embed = new Discord.MessageEmbed()
            .setColor(workingColor)
            .setAuthor(strings.moduleName)
            .setTitle(strings.started)
        message.channel.send(embed)
            .then(msg => {
                stats.execute(message.client, true)
                    .then(() => {
                        const embed = new Discord.MessageEmbed()
                            .setColor(successColor)
                            .setAuthor(strings.moduleName)
                            .setTitle(strings.done)
                        msg.edit(embed)
                    })
                    .catch(err => { throw err })
            })
    }
}
