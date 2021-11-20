import { HexColorString, MessageEmbed } from "discord.js"
import { successColor, ids } from "../../config.json"
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
		const embed = new MessageEmbed()
			.setColor(successColor as HexColorString)
			.setAuthor("Inactive checker")
			.setTitle("All inactive members have been notified!")
			.setFooter(generateTip(), interaction.member.displayAvatarURL({ format: "png", dynamic: true }))
		await interaction.reply({ embeds: [embed] })
	}
}

export default command
