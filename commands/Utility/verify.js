const { getDb } = require("../../lib/mongodb")
const { crowdinVerify } = require("../../lib/crowdinverify")
const { errorColor } = require("../../config.json")
const Discord = require("discord.js")

module.exports = {
    name: "verify",
    description: "Unverifies the user.",
    usage: "+verify [profileURL]",
    aliases: ["unverify", "reverify"],
    cooldown: 3600,
    allowTip: false,
    async execute(message, args) {
        if (!message.member.roles.cache.has("569194996964786178")) { //Verified
            await message.delete()
            message.channel.messages.fetch()
                .then(messages => {
                    const fiMessages = messages.filter(msgs => msgs.author === message.author)
                    message.channel.bulkDelete(fiMessages)
                })
            await message.member.roles.add("569194996964786178", "Manually verified through the command")
            await message.member.roles.remove("756199836470214848", "Manually verified through the command") //Add Verified and remove Alerted
            message.guild.channels.cache.get("662660931838410754").send(`${message.author} manually verified themselves through the command`) //verify-logs
            message.client.cooldowns.get(this.name).delete(message.author.id)
        } else if (!message.member.roles.cache.has("764442984119795732") || /(https:\/\/)([a-z]{2,}\.)?crowdin\.com\/profile?\/?\S{1,}/gi.test(args[0])) { //Discord Administrator
            const userDb = await getDb().collection("users").findOne({ id: message.author.id })
            if (userDb.profile) {
                message.react("798339571531382874") //icon_working
                message.client.channels.cache.get("662660931838410754").send(`${message.author} was unverified.`) //verify-logs
                await crowdinVerify(message.member, message.content.match(/(https:\/\/)([a-z]{2,}\.)?crowdin\.com\/profile\/\S{1,}/gi)?.[0], true)
                message.delete()
            } else {
                await message.member.roles.remove("569194996964786178", "Unverified") //verified
                if (!message.deleted) message.delete()
                const embed = new Discord.MessageEmbed()
                    .setColor(errorColor)
                    .setAuthor("Manual verification")
                    .setTitle("You were successfully unverified!")
                    .setDescription(`Since we didn't have your profile registered on our database, we'd like to ask you to kindly send it to us on the <#569178590697095168> channel. Please make sure your profile is public and that you have your Discord tag (${message.author.tag}) in your "About me" section.`)
                    .setFooter("Any messages you send here will be sent to staff.")
                message.author.send(embed)
                    .then(() => message.client.channels.cache.get("662660931838410754").send(`${message.author} was unverified.`)) //verify-logs
                    .catch(() => {
                        embed
                            .setDescription(`Since we didn't have your profile registered on our database, we'd like to ask you to kindly send it to us here. Please make sure your profile is public and that you have your Discord tag (${message.author.tag}) in your "About me" section.`)
                            .setFooter("")
                        message.client.channels.cache.get("569178590697095168").send(`${message.author} you had DMs disabled, so here's our message,`, embed) //verify
                            .then(msg => {
                                setTimeout(() => {
                                    if (!msg.deleted) msg.delete()
                                }, 30000)
                            })
                        message.client.channels.cache.get("662660931838410754").send(`${message.author} was unverified and had DMs off.`) //verify-logs
                    })
            }
        } else {
            if (!args[0]) throw "noUser"
            const user = args[0].replace(/[\\<>@&!]/g, "").toLowerCase()
            const member = message.guild.members.cache.find(m => m.id === user || m.user.username.toLowerCase() === user || m.user.tag.toLowerCase() === user)
            if (!member) throw "falseUser"
            message.react("798339571531382874") //icon_working
            await crowdinVerify(message.member, message.content.match(/(https:\/\/)([a-z]{2,}\.)?crowdin\.com\/profile\/\S{1,}/gi)?.[0])
            message.delete()
        }
    }
}
