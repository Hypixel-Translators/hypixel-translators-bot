const { errorColor, successColor } = require("../../config.json")
const Discord = require("discord.js")
const { execute, hypixel, quickplay, skyblockaddons, bot } = require("../../events/stats.js")

module.exports = {
    name: "stats",
    description: "Updates statistics channels and notifies members of new strings (if applicable).",
    usage: "+stats",
    aliases: ["statistics", "progress"],
    roleWhitelist: ["764442984119795732"], //Discord Administrator
    async execute(message, args) {
        const client = message.client
        if (!args[0] || args[0].toLowerCase() === "all") {
            await execute(client, true)
                .then(() => {
                    const allEmbed = new Discord.MessageEmbed()
                        .setColor(successColor)
                        .setAuthor("Statistics updater")
                        .setTitle("All language statistics have been updated!")
                        .setDescription(`Check them out at ${message.guild.channels.cache.find(c => c.name === "hypixel-language-status")}, ${message.guild.channels.cache.find(c => c.name === "sba-language-status")}, ${message.guild.channels.cache.find(c => c.name === "bot-language-status")} and ${message.guild.channels.cache.find(c => c.name === "quickplay-language-status")}`)
                        .setFooter(`Executed by ${message.author.tag}`, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                    message.channel.send(allEmbed)
                })
                .catch(err => { throw err })
        } else if (args[0]) {
            let project = args[0].toLowerCase()
            let channel
            if (project === "hypixel" || project === "hp") {
                await hypixel(client)
                project = "Hypixel"
                channel = "hypixel"
            }
            else if (project === "quickplay" || project === "qp") {
                await quickplay(client)
                project = "Quickplay"
                channel = "quickplay"
            }
            else if (project === "skyblockaddons" || project === "sba") {
                await skyblockaddons(client)
                project = "SkyblockAddons"
                channel = "sba"
            }
            else if (project === "bot") {
                await bot(client)
                project = "Bot"
                channel = "bot"
            } else {
                const errorEmbed = new Discord.MessageEmbed()
                    .setColor(errorColor)
                    .setAuthor("Statistics updater")
                    .setTitle(`Couldn't find the project with the name ${args[0]}.`)
                    .setFooter(`Executed by ${message.author.tag}`, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                return message.channel.send(errorEmbed)
            }
            const projectEmbed = new Discord.MessageEmbed()
                .setColor(successColor)
                .setAuthor("Statistics updater")
                .setTitle(`The ${project} language statistics have been updated!`)
                .setDescription(`Check it out at ${message.guild.channels.cache.find(c => c.name === `${channel}-language-status`)}!`)
                .setFooter(`Executed by ${message.author.tag}`, message.author.displayAvatarURL({ format: "png", dynamic: true }))
            message.channel.send(projectEmbed)
            console.log(`Manually updated the ${project} language statistics.`)
        }
    }
}
