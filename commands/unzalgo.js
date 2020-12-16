const { loadingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");
const unzalgo = require("../events/unzalgo.js")

module.exports = {
    name: "unzalgo",
    description: "Checks for zalgo characters in member's nicks and changes them",
    usage: "+unzalgo",
    aliases: ["zalgo", "zalgocheck"],
    channelWhiteList: ["624881429834366986", "730042612647723058", "551693960913879071"], // staff-bots bot-development admin-bots
    allowDM: true,
    async execute(strings, message) {
        const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
        if (!message.member.hasPermission("VIEW_AUDIT_LOG")) throw "noAccess";
        const embed = new Discord.MessageEmbed()
            .setColor(loadingColor)
            .setAuthor(strings.moduleName)
            .setTitle(strings.started)
            .setFooter(executedBy, message.author.displayAvatarURL())
        message.channel.send(embed)
            .then(async msg => {
                try {
                    await unzalgo.execute(message.client, true)
                    const embed = new Discord.MessageEmbed()
                        .setColor(successColor)
                        .setAuthor(strings.moduleName)
                        .setTitle(strings.done)
                        .setFooter(executedBy, message.author.displayAvatarURL())
                    msg.edit(embed)
                } catch (err) { throw err }
            })
    }
}