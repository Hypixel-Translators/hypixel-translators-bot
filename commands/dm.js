const { loadingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
    name: "dm",
    description: "Sends the user a private message.",
    usage: "+dm <mention> <message>",
    aliases: ["message", "privatemessage"],
    allowDM: true,
    async execute(strings, message, args) {
        const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
        var allowed = false
        var userToSend = args[0].replace(/[\\<>@#&!]/g, "");
        args.splice(0, 1)
        var toSend = args.join(" ")
        if (strings, message.channel.type !== "dm") { if (strings, message.member.roles.cache.has("768435276191891456")) { allowed = true } } // Discord Staff
        if (!allowed) return;

        const recipient = message.client.users.cache.get(userToSend)
        var rStrings = require(("../strings/en/dm.json"))
        const oldMessages = await message.client.channels.cache.get("782635440054206504").messages.fetch() //language-database
        const oldFiMessages = await oldMessages.filter(element => element.content.includes(message.author.id))
        oldFiMessages.forEach(async element => {
            oldMsg = await element.content.split(" ")
            await oldMsg.splice(oldMsg.indexOf(message.author.id), 1)
            rStrings = await require(("../strings/" + oldMsg[0] + "/dm.json"))
        })
        setTimeout(() => {
            const report = new Discord.MessageEmbed()
                .setColor(neutralColor)
                .setAuthor(rStrings.incoming)
                .setDescription(toSend)
                .setFooter(rStrings.incomingDisclaimer);
            recipient.send(report)
                .catch(err => { throw err })
                .then(() => {
                    const embed = new Discord.MessageEmbed()
                        .setColor(successColor)
                        .setAuthor(strings.outgoing.replace("%%recipient%%", recipient.tag))
                        .setDescription(toSend)
                        .setFooter(executedBy, message.author.displayAvatarURL)
                    message.channel.send(embed)
                })
        }, 50)
    }
}
