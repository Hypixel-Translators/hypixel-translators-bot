const { loadingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");
const inactives = require('../events/inactives.js')

module.exports = {
    name: "inactives",
    description: "Checks for inactive unverified members (if applicable).",
    usage: "+inactives",
    aliases: ["updateinactives", "unverifieds", "inactive"],
    allowDM: true,
    async execute(strings, message, args) {
        if (!message.member.hasPermission("ADMINISTRATOR")) throw noAccess;
        const embed = new Discord.MessageEmbed()
            .setColor(loadingColor)
            .setAuthor(strings.moduleName)
            .setTitle(strings.started)
        message.channel.send(embed)
            .then(async msg => {
                try {
                    await inactives.execute(message.client, true)
                    const embed = new Discord.MessageEmbed()
                        .setColor(successColor)
                        .setAuthor(strings.moduleName)
                        .setTitle(strings.done)
                    msg.edit(embed)
                } catch (err) { throw err }
            })
    }
}