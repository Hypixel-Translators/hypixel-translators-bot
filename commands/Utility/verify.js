const { getDb } = require("../../lib/mongodb")
const { crowdinVerify } = require("../../lib/crowdinverify")
const { errorColor } = require("../../config.json")
const Discord = require("discord.js")

module.exports = {
    name: "verify",
    description: "Unverifies the user.",
    usage: "+verify",
    aliases: ["unverify", "reverify"],
    cooldown: 3600,
    allowTip: false,
    channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058"], //bots staff-bots bot-development bot-translators
    async execute(message, args, getString) {
        if (!message.member.roles.cache.has("569194996964786178")) { //Verified
            await message.delete()
            if (!args[0]) {
                message.channel.messages.fetch()
                    .then(messages => {
                        const fiMessages = messages.filter(msgs => msgs.author === message.author)
                        message.channel.bulkDelete(fiMessages)
                    })
                await message.member.roles.add("569194996964786178", "Manually verified through the command")
                    .then(async () => await message.member.roles.remove("756199836470214848", "Manually verified through the command")) //Add Verified and remove Alerted
                message.guild.channels.cache.get("662660931838410754").send(`${message.author} manually verified themselves through the command`) //verify-logs
            } else {
                message.channel.send(`${message.author} please run \`+verify\` with no aditional arguments in order to be verified. If you wish to be verified as a translator, please paste the link to your Crowdin profile on this channel.`)
                    .then(msg => {
                        setTimeout(() => {
                            if (!msg.deleted) msg.delete()
                        }, 10000)
                    })
            }
        } else {
            const userDb = await getDb().collection("users").findOne({ id: message.author.id })
            message.member.roles.remove("569194996964786178", "Unverified") //verified
            if (userDb.profile) {
                message.client.channels.cache.get("662660931838410754").send(`${message.author} was unverified.`)
                return crowdinVerify(message)
            } else {
                if (!message.deleted) message.delete()
                const embed = new Discord.MessageEmbed()
                    .setColor(errorColor)
                    .setAuthor("Manual verification")
                    .setTitle("You were successfully unverified!")
                    .setDescription(`Since we didn't have your profile registered on our database, we'd like to ask you to kindly send it to us on the <#569178590697095168> channel. Please make sure your profile is public and that you have your Discord tag (${message.author.tag}) in your "About me" section.`)
                    .setFooter("Any messages you send here will be sent to staff.")
                message.author.send(embed)
            }
        }
    }
}