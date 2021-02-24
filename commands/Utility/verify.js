const { getDb } = require("../../lib/mongodb")
const { prefix } = require("../../config.json")
const { crowdinVerify } = require("../../lib/crowdinverify")
const { errorColor } = require("../../config.json")
const Discord = require("discord.js")

module.exports = {
    name: "verify",
    description: "Unverifies the user.",
    usage: "+verify",
    aliases: ["unverify"],
    cooldown: 3600,
    allowTip: false,
    channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058"], //bots staff-bots bot-development bot-translators
    async execute(message, args, getString) {
        await message.delete()
        const userDb = await getDb().collection("users").findOne({ id: message.author.id })
        message.member.roles.remove("569194996964786178", "Unverified") //verified
        if (userDb.profile) return crowdinVerify(message)
        else {
            const embed = new Discord.MessageEmbed()
                .setColor(errorColor)
                .setAuthor("Manual verification")
                .setTitle("You were successfully unverified!")
                .setDescription("Since we didn't have your profile registered on our database, we'd like to ask you to kindly send it to us on the %%verify%% channel. Please make sure your profile is public and that you have your Discord tag (%%tag%%) in your \"About me\" section.")
                .setFooter("Any messages you send here will be sent to staff.")
            message.author.send(embed)
        }
    }
}