const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");
const inactives = require('../events/inactives.js')

module.exports = {
    name: "updateinactives",
    description: "Moderates unverified members (if applicable).",
    usage: "updateinactives",
    aliases: ["inactives"],
    allowDM: true,
    async execute(strings, message, args) {
        if (!message.member.hasPermission("VIEW_AUDIT_LOG")) throw noAccess;
        const embed = new Discord.MessageEmbed()
            .setColor(workingColor)
            .setAuthor(strings.moduleName)
            .setTitle(strings.started)
        message.channel.send(embed)
            .then(msg => {
                inactives.execute(message.client, true)
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