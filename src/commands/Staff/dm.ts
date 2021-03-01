import Discord from "discord.js"
import { errorColor, successColor, neutralColor } from "../../config.json"
import { client } from "../../index"

module.exports = {
    name: "dm",
    description: "Sends the user a private message.",
    usage: "+dm <mention> <message>",
    aliases: ["message", "privatemessage", "pm"],
    roleWhitelist: ["768435276191891456"], //Discord Staff
    async execute(message: Discord.Message, args: string[], getString: (path: string, cmd?: string, lang?: string) => any) {
        if (!args[0]) throw "noUser"
        const userToSend = args[0].replace(/[\\<>@#&!]/g, "")
        const recipient = message.client.users.cache.get(userToSend)
        if (!recipient) throw "falseUser"
        args.splice(0, 1)
        let toSend = args.join(" ")

        const recipientDb = await client.getUser(recipient.id)
        message.channel.startTyping()
        if (toSend) {
            const dm = new Discord.MessageEmbed()
                .setColor(neutralColor)
                .setAuthor(getString("incoming", this.name, recipientDb.lang))
                .setDescription(toSend)
                .setFooter(getString("incomingDisclaimer", this.name, recipientDb.lang))
            recipient.send(dm)
                .then(() => {
                    const embed = new Discord.MessageEmbed()
                        .setColor(successColor)
                        .setAuthor("Direct Message")
                        .setTitle(`Sent message to ${recipient.tag}`)
                        .setDescription(toSend)
                        .setFooter(`Executed by ${message.author.tag}`, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                    message.channel.stopTyping()
                    message.channel.send(embed)
                })
                .catch(error => {
                    const errorEmbed = new Discord.MessageEmbed()
                        .setColor(errorColor)
                        .setAuthor("Direct Message")
                        .setTitle(`An error occured while trying to message ${recipient.tag}`)
                        .setDescription(error)
                        .setFooter(`Executed by ${message.author.tag}`, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                    message.channel.stopTyping()
                    message.channel.send(errorEmbed)
                })
        } else {
            const errorEmbed = new Discord.MessageEmbed()
                .setColor(errorColor)
                .setAuthor("Direct Message")
                .setTitle(`An error occured while trying to message ${recipient.tag}`)
                .setDescription("You need to specify what message you want to send to this person!")
                .setFooter(`Executed by ${message.author.tag}`, message.author.displayAvatarURL({ format: "png", dynamic: true }))
            message.channel.stopTyping()
            message.channel.send(errorEmbed)
        }
    }
}
