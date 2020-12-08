const { loadingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");
const unzalgo = require('../events/unzalgo.js')

module.exports = {
    name: "unzalgo",
    description: "Checks for zalgo characters in member's nicks and changes them",
    usage: "+unzalgo",
    aliases: ["zalgo", "zalgocheck"],
    allowDM: true,
    async execute(strings, message) {
        if (!message.member.hasPermission("VIEW_AUDIT_LOG")) throw noAccess;
        const embed = new Discord.MessageEmbed()
            .setColor(loadingColor)
            .setAuthor(strings.moduleName)
            .setTitle(strings.started)
        message.channel.send(embed)
            .then(async msg => {
                try {
                    await unzalgo.execute(message.client, true)
                    const embed = new Discord.MessageEmbed()
                        .setColor(successColor)
                        .setAuthor(strings.moduleName)
                        .setTitle(strings.done)
                    msg.edit(embed)
                } catch (err) { throw err }
            })
    }
}