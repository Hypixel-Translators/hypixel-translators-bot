import { errorColor, successColor } from "../../config.json"
import Discord from "discord.js"
import { execute, hypixel, quickplay, skyblockaddons, bot } from "../../events/stats.js"
import { Command, client } from "../../index"

const command: Command = {
    name: "stats",
    description: "Updates statistics channels and notifies members of new strings (if applicable).",
    usage: "+stats",
    aliases: ["statistics", "progress"],
    roleWhitelist: ["764442984119795732"], //Discord Administrator
    async execute(interaction: Discord.CommandInteraction, args: string[]) {
        if (!args[0] || args[0].toLowerCase() === "all") {
            await execute(client, true)
                .then(() => {
                    const allEmbed = new Discord.MessageEmbed()
                        .setColor(successColor)
                        .setAuthor("Statistics updater")
                        .setTitle("All language statistics have been updated!")
                        .setDescription(`Check them out at ${interaction.guild!.channels.cache.find(c => c.name === "hypixel-language-status")}, ${interaction.guild!.channels.cache.find(c => c.name === "sba-language-status")}, ${interaction.guild!.channels.cache.find(c => c.name === "bot-language-status")} and ${interaction.guild!.channels.cache.find(c => c.name === "quickplay-language-status")}`)
                        .setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                    interaction.reply(allEmbed)
                })
                .catch(err => { throw err })
        } else if (args[0]) {
            let project = args[0].toLowerCase()
            let channel: string
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
                    .setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                return interaction.reply(errorEmbed)
            }
            const projectEmbed = new Discord.MessageEmbed()
                .setColor(successColor)
                .setAuthor("Statistics updater")
                .setTitle(`The ${project} language statistics have been updated!`)
                .setDescription(`Check it out at ${interaction.guild!.channels.cache.find(c => c.name === `${channel}-language-status`)}!`)
                .setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
            interaction.reply(projectEmbed)
            console.log(`Manually updated the ${project} language statistics.`)
        }
    }
}

export default command
