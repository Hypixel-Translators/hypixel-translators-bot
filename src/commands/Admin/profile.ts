import { client } from "../../index"
import { successColor, errorColor, neutralColor } from "../../config.json"
import Discord from "discord.js"

module.exports = {
    name: "profile",
    description: "Gets the profile of a user",
    usage: "+profile [user]",
    allowTip: false,
    roleWhitelist: ["764442984119795732"], //Discord Administrator
    channelWhitelist: ["569178590697095168"], // verify
    async execute(message: Discord.Message, args: string[]) {
        let user = message.author
        if (args[0]) {
            let userRaw = args[0].replace(/[\\<>@#&!]/g, "")
            user = message.client.users.cache.find(m => m.id === userRaw || m.tag === userRaw || m.username === userRaw || m.tag.toLowerCase().includes(userRaw.toLowerCase()))
            if (!user) throw "falseUser"
        }
        const collection = client.db.collection("users")
        if (!args[1]) {
            const userDb = await collection.findOne({ id: user.id })
            if (userDb.profile) {
                const embed = new Discord.MessageEmbed()
                    .setColor(neutralColor)
                    .setAuthor("User Profile")
                    .setTitle(`Here's ${user.tag}'s Crowdin profile`)
                    .setDescription(userDb.profile)
                    .setFooter(`Executed by ${message.author.tag}`, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                return message.channel.send(embed)
            } else {
                const embed = new Discord.MessageEmbed()
                    .setColor(errorColor)
                    .setAuthor("User Profile")
                    .setTitle(`Couldn't find ${user.tag}'s Crowdin profile on the database!`)
                    .setFooter(`Executed by ${message.author.tag}`, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                return message.channel.send(embed)
            }
        } else {
            if (/(https:\/\/)?(www\.)?crowdin\.com\/profile\/\S{1,}/gi.test(args[1])) {
                await collection.updateOne({ id: user.id }, { $set: { profile: args[1] } })
                    .then(r => {
                        if (r.result.nModified) {
                            const embed = new Discord.MessageEmbed()
                                .setColor(successColor)
                                .setAuthor("User Profile")
                                .setTitle(`Successfully updated ${user.tag}'s Crowdin profile!`)
                                .setDescription(`New profile: ${args[1]}`)
                                .setFooter(`Executed by ${message.author.tag}`, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                            return message.channel.send(embed)
                        } else {
                            const embed = new Discord.MessageEmbed()
                                .setColor(errorColor)
                                .setAuthor("User Profile")
                                .setTitle(`Couldn't update ${user.tag}'s Crowdin profile!`)
                                .setDescription(`Their current profile is the same as the one you tried to add.`)
                                .setFooter(`Executed by ${message.author.tag}`, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                            return message.channel.send(embed)
                        }
                    })
            } else throw "wrongLink"
        }
    }
}