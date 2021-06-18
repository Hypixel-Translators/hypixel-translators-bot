import { successColor } from "../../config.json"
import Discord from "discord.js"
import crowdin from "../../events/crowdinverify"
import { client, Command } from "../../index"

const command: Command = {
    name: "crowdinverify",
    description: "Goes through all the stored profiles and updates the user's roles accordingly",
    allowDM: true,
    roleWhitelist: ["764442984119795732"], //Discord Administrator
    async execute(interaction: Discord.CommandInteraction) {
        await interaction.defer()
        await crowdin(client, true)
        const embed = new Discord.MessageEmbed()
            .setColor(successColor)
            .setAuthor("Role updater")
            .setTitle("All verified users had their roles updated!")
            .setDescription("Check the console for any errors that may have occured in the process")
            .setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
        await interaction.editReply({ embeds: [embed] })
            .catch(async (err: Error) => {
                embed.addField("Error", err.stack || err.toString())
                await interaction.channel.send({ content: "The interaction expired, so here's the embed so you don't feel sad", embeds: [embed] })
            })
    }
}

export default command
