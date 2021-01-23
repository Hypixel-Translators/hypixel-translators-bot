const { errorColor, successColor } = require("../config.json")
const Discord = require("discord.js")
const { execute, hypixel, quickplay, skyblockaddons, bot } = require("../events/stats.js")

module.exports = {
    name: "stats",
    description: "Updates statistics channels and notifies members of new strings (if applicable).",
    usage: "+stats",
    aliases: ["statistics", "progress"],
    roleWhitelist: ["764442984119795732"], //Discord Administrator
    async execute(message, strings, args) {
        const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
        const client = message.client
        if (!args[0] || args[0].toLowerCase() === "all") {
            await execute(client, true)
                .then(() => {
                    const allEmbed = new Discord.MessageEmbed()
                        .setColor(successColor)
                        .setAuthor(strings.moduleName)
                        .setTitle(strings.done)
                        .setFooter(executedBy, message.author.displayAvatarURL())
                    message.channel.send(allEmbed)
                })
                .catch(err => { throw err })
        } else if (args[0]) {
            let project = args[0].toLowerCase()
            if (project === "hypixel" || project === "hp") {
                await hypixel(client)
                project = "Hypixel"
            }
            else if (project === "quickplay" || project === "qp") {
                await quickplay(client)
                project = "Quickplay"
            }
            else if (project === "skyblockaddons" || project === "sba") {
                await skyblockaddons(client)
                project = "SkyblockAddons"
            }
            else if (project === "bot") {
                await bot(client)
                project = "Bot"
            }
            else {
                const errorEmbed = new Discord.MessageEmbed()
                    .setColor(errorColor)
                    .setAuthor(strings.moduleName)
                    .setTitle(strings.errorNoProject.replace("%%name%%", args[0]))
                    .setFooter(executedBy, message.author.displayAvatarURL())
                message.channel.send(errorEmbed)
                return
            }
            const projectEmbed = new Discord.MessageEmbed()
                .setColor(successColor)
                .setAuthor(strings.moduleName)
                .setTitle(strings.doneProject.replace("%%project%%", project))
                .setFooter(executedBy, message.author.displayAvatarURL())
            message.channel.send(projectEmbed)
            console.log(`Manually updated the ${project} language statistics.`)
        }
    }
}
