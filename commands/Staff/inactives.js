const { successColor } = require("../../config.json")
const Discord = require("discord.js")
const inactives = require("../../actions/inactives.js")

module.exports = {
    name: "inactives",
    description: "Checks for inactive unverified members (if applicable).",
    usage: "+inactives",
    aliases: ["updateinactives", "unverifieds", "inactive"],
    roleWhitelist: ["764442984119795732"], //Discord Administrator
    execute(message, strings) {
            inactives.execute(message.client, true)
            const embed = new Discord.MessageEmbed()
                .setColor(successColor)
                .setAuthor("Inactive checker")
                .setTitle("All inactive members have been notified!")
                .setFooter(`Executed by ${message.author.tag}`, message.author.displayAvatarURL())
            message.channel.send(embed)
    }
}
