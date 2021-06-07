import { successColor } from "../../config.json"
import Discord from "discord.js"
import { execute, hypixel, quickplay, skyblockaddons, bot } from "../../events/stats"
import { Command, client } from "../../index"

const command: Command = {
    name: "stats",
    description: "Updates statistics channels and notifies members of new strings (if applicable).",
    options: [{
        type: "STRING",
        name: "project",
        description: "The project to update statistics for. Defaults to all projects",
        choices: [{
            name: "Hypixel",
            value: "hypixel"
        },
        {
            name: "Quickplay",
            value: "quickplay"
        },
        {
            name: "SkyblockAddons",
            value: "skyblockaddons"
        },
        {
            name: "Hypixel Translators Bot",
            value: "bot"
        }],
        required: false
    }],
    roleWhitelist: ["764442984119795732"], //Discord Administrator
    async execute(interaction: Discord.CommandInteraction) {
        const projectInput = interaction.options.get("project")?.value as string
        if (!projectInput) {
            await execute(client, true)
                .then(async () => {
                    const allEmbed = new Discord.MessageEmbed()
                        .setColor(successColor)
                        .setAuthor("Statistics updater")
                        .setTitle("All language statistics have been updated!")
                        .setDescription(`Check them out at ${interaction.guild!.channels.cache.find(c => c.name === "hypixel-language-status")}, ${interaction.guild!.channels.cache.find(c => c.name === "sba-language-status")}, ${interaction.guild!.channels.cache.find(c => c.name === "bot-language-status")} and ${interaction.guild!.channels.cache.find(c => c.name === "quickplay-language-status")}`)
                        .setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                    await interaction.reply(allEmbed)
                })
                .catch(err => { throw err })
        } else {
            const project = interaction.options.get("project")!.value as string
            switch (projectInput) {
                case "hypixel": await hypixel(client)
                case "quickplay": await quickplay(client)
                case "skyblockaddons": await skyblockaddons(client)
                case "bot": await bot(client)
            }
            const projectEmbed = new Discord.MessageEmbed()
                .setColor(successColor)
                .setAuthor("Statistics updater")
                .setTitle(`The ${project} language statistics have been updated!`)
                .setDescription(`Check it out at ${interaction.guild!.channels.cache.find(c => c.name === `${projectInput}-language-status`)}!`)
                .setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
            await interaction.reply(projectEmbed)
            console.log(`Manually updated the ${project} language statistics.`)
        }
    }
}

export default command
