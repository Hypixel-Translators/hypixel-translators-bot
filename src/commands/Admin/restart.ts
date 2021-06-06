import { successColor } from "../../config.json"
import Discord from "discord.js"
import { client, Command } from "../../index"

const command: Command = {
    name: "restart",
    description: "Refresh the bot to apply changes and to fix errors.",
    roleWhitelist: ["764442984119795732"], //Discord Administrator
    channelWhitelist: ["624881429834366986", "730042612647723058", "551693960913879071"], //staff-bots bot-dev admin-bots
    async execute(interaction: Discord.CommandInteraction) {
        const embed = new Discord.MessageEmbed()
            .setColor(successColor)
            .setAuthor("Restart")
            .setTitle("Restarting...")
            .setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
        await interaction.reply(embed)
        interaction.client.user!.setStatus("invisible")
        setTimeout(() => {
            client.destroy()
            process.exit()
        }, 1000)
    }
}

export default command
