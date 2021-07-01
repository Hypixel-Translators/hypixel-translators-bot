import { successColor } from "../../config.json"
import Discord from "discord.js"
import fetch from "node-fetch"
import { Command } from "../../index"

const command: Command = {
    name: "restart",
    description: "Refresh the bot to apply changes and to fix errors.",
    roleWhitelist: ["764442984119795732"], //Discord Administrator
    channelWhitelist: ["624881429834366986", "730042612647723058", "551693960913879071"], //staff-bots bot-dev admin-bots
    async execute(interaction: Discord.CommandInteraction) {
        const embed = new Discord.MessageEmbed()
            .setColor(successColor as Discord.HexColorString)
            .setAuthor("Restart")
            .setTitle("Restarting...")
            .setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
        await interaction.reply({ embeds: [embed] })
        interaction.client.user!.setStatus("invisible")
        setTimeout(async () => {
            if (process.env.NODE_ENV === "production")
                await fetch("https://api.heroku.com/apps/hypixel-translators/dynos", {
                    method: "DELETE",
                    headers: {
                        "User-Agent": `${interaction.user.tag}`,
                        Authorization: `Bearer ${process.env.HEROKU_API}`,
                        Accept: "application/vnd.heroku+json; version=3"
                    }
                })
            else process.exit()
        }, 1000)
    }
}

export default command
