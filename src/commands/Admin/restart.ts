import { successColor, ids } from "../../config.json"
import Discord from "discord.js"
import type { Command } from "../../index"
import { generateTip, restart } from "../../lib/util"

const command: Command = {
	name: "restart",
	description: "Refresh the bot to apply changes and to fix errors.",
	roleWhitelist: [ids.roles.admin],
	channelWhitelist: [ids.channels.staffBots, ids.channels.botDev, ids.channels.adminBots],
	async execute(interaction) {
		const member = interaction.member as Discord.GuildMember,
			embed = new Discord.MessageEmbed()
				.setColor(successColor as Discord.HexColorString)
				.setAuthor("Restart")
				.setTitle("Restarting...")
				.setFooter(generateTip(), member.displayAvatarURL({ format: "png", dynamic: true }))
		await interaction.reply({ embeds: [embed] })
		interaction.client.user!.setStatus("invisible")
		setTimeout(async () => {
			if (process.env.NODE_ENV === "production") await restart(interaction)
			else process.exit()
		}, 1000)
	}
}

export default command
