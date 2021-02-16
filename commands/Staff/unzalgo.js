const { successColor } = require("../../config.json")
const Discord = require("discord.js")
const unzalgo = require("../../events/unzalgo.js")

module.exports = {
    name: "unzalgo",
    description: "Checks for zalgo characters in member's nicks and changes them",
    usage: "+unzalgo",
    aliases: ["zalgo", "zalgocheck"],
    roleWhitelist: ["768435276191891456"], //Discord Staff
    channelWhitelist: ["624881429834366986", "730042612647723058", "551693960913879071"], // staff-bots bot-development admin-bots
    execute(message) {
        unzalgo.execute(message.client, true)
        const embed = new Discord.MessageEmbed()
            .setColor(successColor)
            .setAuthor("Zalgo checker")
            .setTitle("All zalgo nicknames have been changed!")
            .setFooter(`Executed by ${message.author.tag}`, message.author.displayAvatarURL({ format: "png", dynamic: true }))
        message.channel.send(embed)
    }
}
