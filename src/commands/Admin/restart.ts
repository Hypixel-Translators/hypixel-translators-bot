import { MessageEmbed } from "discord.js"
import { colors, ids } from "../../config.json"
import { generateTip, restart } from "../../lib/util"

import type { Command } from "../../lib/imports"

const command: Command = {
	name: "restart",
	description: "Refresh the bot to apply changes and to fix errors.",
	roleWhitelist: [ids.roles.admin],
	channelWhitelist: [ids.channels.staffBots, ids.channels.botDev, ids.channels.adminBots],
	async execute(interaction) {
		if (!interaction.inCachedGuild()) return
		const member = interaction.member,
			embed = new MessageEmbed()
				.setColor(colors.success)
				.setAuthor("Restart")
				.setTitle("Restarting...")
				.setFooter(generateTip(), member.displayAvatarURL({ format: "png", dynamic: true }))
		await interaction.reply({ embeds: [embed] })
		setTimeout(async () => {
			if (process.env.NODE_ENV === "production") await restart(interaction)
			else process.exit()
		}, 1000)
	}
}

export default command
