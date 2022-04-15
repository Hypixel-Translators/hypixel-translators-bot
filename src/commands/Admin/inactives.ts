import { EmbedBuilder } from "discord.js"

import { colors, ids } from "../../config.json"
import inactives from "../../events/inactives"
import { generateTip } from "../../lib/util"

import type { Command } from "../../lib/imports"

const command: Command = {
	name: "inactives",
	description: "Checks for inactive unverified members (if applicable).",
	roleWhitelist: [ids.roles.admin],
	async execute(interaction) {
		if (!interaction.inCachedGuild()) return

		await inactives()
		const embed = new EmbedBuilder({
			color: colors.success,
			author: { name: "Inactive checker" },
			title: "All inactive members have been notified!",
			footer: { text: generateTip(), iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
		})
		await interaction.reply({ embeds: [embed] })
	},
}

export default command
