const { errorColor, successColor, neutralColor } = require("../../config.json")
const Discord = require("discord.js")

module.exports = {
    name: "dm",
    description: "Sends the user a private message.",
    usage: "+dm <mention> <message>",
    aliases: ["message", "privatemessage", "pm"],
    roleWhitelist: ["768435276191891456"], //Discord Staff
    async execute(message, strings, args) {
        let userToSend = args[0].replace(/[\\<>@#&!]/g, "")
        args.splice(0, 1)
        let toSend = args.join(" ")
        const recipient = message.client.users.cache.get(userToSend)
        if (!recipient) throw "falseUser"
        
        let rStrings = require("../../strings/en/dm.json")
        const oldMessages = await message.client.channels.cache.get("782635440054206504").messages.fetch() //language-database
        const oldFiMessages = oldMessages.filter(element => element.content.includes(recipient.id))
        oldFiMessages.forEach(element => {
            let oldMsg = element.content.split(" ")
            oldMsg.splice(oldMsg.indexOf(recipient.id), 1)
            rStrings = require(`../../strings/${oldMsg[0]}/dm.json`)
        })
        message.channel.startTyping()
        if (toSend) {
            const dm = new Discord.MessageEmbed()
                .setColor(neutralColor)
                .setAuthor(rStrings.incoming)
                .setDescription(toSend)
                .setFooter(rStrings.incomingDisclaimer)
            recipient.send(dm)
                .then(() => {
                    const embed = new Discord.MessageEmbed()
                        .setColor(successColor)
                        .setAuthor("Direct Message")
                        .setTitle(`Sent message to ${recipient.tag}`)
                        .setDescription(toSend)
                        .setFooter(`Executed by ${message.author.tag}`, message.author.displayAvatarURL())
                    message.channel.stopTyping()
                    message.channel.send(embed)
                })
                .catch(error => {
                    const errorEmbed = new Discord.MessageEmbed()
                        .setColor(errorColor)
                        .setAuthor("Direct Message")
                        .setTitle(`An error occured while trying to message ${recipient.tag}`)
                        .setDescription(error)
                        .setFooter(`Executed by ${message.author.tag}`, message.author.displayAvatarURL())
                    message.channel.stopTyping()
                    message.channel.send(errorEmbed)
                })
        } else {
            const errorEmbed = new Discord.MessageEmbed()
                .setColor(errorColor)
                .setAuthor("Direct Message")
                .setTitle(`An error occured while trying to message ${recipient.tag}`)
                .setDescription("You need to specify what message you want to send to this person!")
                .setFooter(`Executed by ${message.author.tag}`, message.author.displayAvatarURL())
            message.channel.stopTyping()
            message.channel.send(errorEmbed)
        }
    }
}
