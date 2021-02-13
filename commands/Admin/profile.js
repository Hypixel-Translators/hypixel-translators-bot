const { getDb } = require("../../lib/mongodb")
const { neutralColor, errorColor } = require("../../config.json")
const Discord = require("discord.js")

module.exports = {
    name: "profile",
    description: "Gets the profile of a user",
    usage: "+profile [user]",
    aliases: ["unverify"],
    allowTip: false,
    roleWhitelist: ["764442984119795732"], //Discord Administrator
    channelWhitelist: ["569178590697095168"], // verify
    async execute(message, args) {
        let user = message.author
        if (args[0]) {
            let userRaw = args[0].replace(/[\\<>@#&!]/g, "")
            user = message.client.users.cache.find(m => m.id === userRaw || m.tag === userRaw || m.username === userRaw || m.tag.toLowerCase().includes(userRaw.toLowerCase()))
            if (!user) throw "falseUser"
        }
        const userDb = await getDb().collection("users").findOne({ id: user.id })
        if (userDb.profile) {
            const embed = new Discord.MessageEmbed()
                .setColor(neutralColor)
                .setAuthor("User Profile")
                .setTitle(`Here's ${user.tag}'s Crowdin profile`)
                .setDescription(userDb.profile)
                .setFooter(`Executed by ${message.author.tag}`, message.author.displayAvatarURL())
            return message.channel.send(embed)
        } else {
            const embed = new Discord.MessageEmbed()
                .setColor(errorColor)
                .setAuthor("User Profile")
                .setTitle(`Couldn't find ${user.tag}'s Crowdin profile on the database!`)
                .setFooter(`Executed by ${message.author.tag}`, message.author.displayAvatarURL())
            return message.channel.send(embed)
        }
    }
}