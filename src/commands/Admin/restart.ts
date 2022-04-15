import process from "node:process"

import { EmbedBuilder } from "discord.js"

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
		const embed = new EmbedBuilder({
			color: colors.success,
			author: { name: "Restart" },
			title: "Restarting...",
			footer: { text: generateTip(), iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
		})
		await interaction.reply({ embeds: [embed] })
		if (process.env.NODE_ENV === "production") await restart(interaction)
		else process.exit()
	},
}

export default command
