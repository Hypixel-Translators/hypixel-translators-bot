const { neutralColor } = require("../../config.json")
const Discord = require("discord.js")

module.exports = {
    name: "alert",
    description: "Sends the user a preset alert",
    usage: "+alert <user> <alert>",
    allowTip: false,
    roleWhitelist: ["764442984119795732"], //Discord Administrator
    channelWhitelist: ["569178590697095168"], // verify
    async execute(message, args) {
        await message.delete()
        const userToSend = args[0].replace(/[\\<>@#&!]/g, "")
        const recipient = message.client.users.cache.get(userToSend)
        message.channel.messages.fetch()
            .then(messages => {
                const authorMessages = messages.filter(msgs => msgs.author === message.author)
                message.channel.bulkDelete(authorMessages)
                const userMessages = messages.filter(msgs => msgs.author.id === userToSend)
                message.channel.bulkDelete(userMessages)
            })
        if (!args[1]) throw "noMessage"
        if (!recipient) throw "falseUser"
        const verifyLogs = message.client.channels.cache.get("662660931838410754") //verify-logs
        const embed = new Discord.MessageEmbed()
            .setColor(neutralColor)
            .setAuthor("Received message from staff")
            .setFooter("Any messages you send here will be sent to staff.")
        if (args[1] === "private") {
            embed
                .setDescription("Hey there! We noticed you sent us your Crowdin profile, however, it was private so we couldn't check it. Please make it public, at least until you get verified, and send us your profile again on the channel. If you don't know how to, then go to your Crowdin profile settings (found [here](https://crowdin.com/settings#account)) and make sure the \"Private Profile\" setting is turned off (see the image below)\n\nIf you have any questions, be sure to send them here or in the <#569178590697095168> channel!") //verify
                .setImage("https://i.imgur.com/YX8VLeu.png")
            verifyLogs.send(`${recipient}'s profile was private, I let them know about that.`)
        } else if (args[1] === "projects") {
            embed.setDescription("Hey there! We noticed you sent us your Crowdin profile, however, you haven't joined neither the Hypixel, SkyblockAddons nor the Quickplay projects. You must join at least one of those so we can verify you. Once you've sent a request, please send us your profile again.\n\nIf you have any questions, be sure to send them here or in the <#569178590697095168> channel!") //verify
            verifyLogs.send(`${recipient} hadn't joined any projects. Hope they fix that with the message I just sent them.`)
        } else if (args[1] === "profile") {
            embed
                .setDescription("Hey there! We noticed you tried to send us your Crowdin profile but the link you sent was invalid. This may have happened because you either typed the wrong name in the link or you sent us the generic Crowdin profile link. If you don't know how to obtain the profile URL, make sure it follows the format `https://crowdin.com/profile/<username>` and replace <username> with your username like shown below.\n\nIf you have any questions, be sure to send them here or in the <#569178590697095168> channel!") //verify
                .setImage("https://i.imgur.com/7FVOSfT.png")
            verifyLogs.send(`${recipient} sent the wrong profile link. Let’s hope they work their way around with the message I just sent them.`)
        } else if (args[1] === "discord") {
            embed
                .setDescription(`Hey there! We noticed you sent us your Crowdin profile, however, you forgot to add your Discord tag to it! Just add ${recipient.tag} to your about section like shown in the image below. Once you've done so, send us the profile link again.\n\nIf you have any questions, be sure to send them here or in the <#569178590697095168> channel!`) //verify
                .setImage("https://i.imgur.com/BM2bJ4W.png")
            verifyLogs.send(`${recipient} forgot to add their Discord to their profile. Let's hope they fix that with the message I just sent them.`)
        } else throw "noMessage"
        recipient.send(embed)
            .catch(e => {
                message.channel.send(`${recipient}`, embed)
                console.log(`Couldn't send an alert to ${recipient}, here's the error: ${e}`)
            })
    }
}