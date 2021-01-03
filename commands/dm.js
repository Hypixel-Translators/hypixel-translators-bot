const { errorColor, successColor, neutralColor } = require("../config.json")
const Discord = require("discord.js")

module.exports = {
    name: "dm",
    description: "Sends the user a private message.",
    usage: "+dm <mention> <message>",
    aliases: ["message", "privatemessage"],
    roleWhitelist: ["768435276191891456"], //Discord Staff
    async execute(message, strings, args) {
        const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
        let allowed = false
        let userToSend = args[0].replace(/[\\<>@#&!]/g, "")
        args.splice(0, 1)
        let toSend = args.join(" ")
        if (strings, message.channel.type !== "dm") { if (strings, message.member.roles.cache.has("768435276191891456")) { allowed = true } } // Discord Staff
        if (!allowed) return

        const recipient = message.client.users.cache.get(userToSend)
        let rStrings = require("../strings/en/dm.json")
        const oldMessages = await message.client.channels.cache.get("782635440054206504").messages.fetch() //language-database
        const oldFiMessages = oldMessages.filter(element => element.content.includes(recipient.id))
        oldFiMessages.forEach(element => {
            let oldMsg = element.content.split(" ")
            oldMsg.splice(oldMsg.indexOf(recipient.id), 1)
            rStrings = require(`../strings/${oldMsg[0]}/dm.json`)
        })
        message.channel.startTyping()
        if (toSend.length > 0) {
            const dm = new Discord.MessageEmbed()
                .setColor(neutralColor)
                .setAuthor(rStrings.incoming)
                .setDescription(toSend)
                .setFooter(rStrings.incomingDisclaimer)
            recipient.send(dm)
                .then(() => {
                    const embed = new Discord.MessageEmbed()
                        .setColor(successColor)
                        .setAuthor(strings.moduleName)
                        .setTitle(strings.outgoing.replace("%%recipient%%", recipient.tag))
                        .setDescription(toSend)
                        .setFooter(executedBy, message.author.displayAvatarURL())
                    message.channel.stopTyping()
                    message.channel.send(embed)
                })
                .catch(error => {
                    const errorEmbed = new Discord.MessageEmbed()
                        .setColor(errorColor)
                        .setAuthor(strings.moduleName)
                        .setTitle(strings.error.replace("%%recipient%%", recipient.tag))
                        .setDescription(error)
                        .setFooter(executedBy, message.author.displayAvatarURL())
                    message.channel.stopTyping()
                    message.channel.send(errorEmbed)
                })
        } else {
            const errorEmbed = new Discord.MessageEmbed()
                .setColor(errorColor)
                .setAuthor(strings.moduleName)
                .setTitle(strings.error.replace("%%recipient%%", recipient.tag))
                .setDescription(strings.noMsg)
                .setFooter(executedBy, message.author.displayAvatarURL())
            message.channel.stopTyping()
            message.channel.send(errorEmbed)
        }
    }
}
