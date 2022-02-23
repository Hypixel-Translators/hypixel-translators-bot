import { ApplicationCommandOptionType, TextChannel } from "discord.js"

import { ids } from "../../config.json"

import type { Command } from "../../lib/imports"

const command: Command = {
	name: "slowmode",
	description: "Sets the slowmode for the current channel",
	options: [
		{
			type: ApplicationCommandOptionType.Integer,
			name: "seconds",
			description: "The value to set the slowmode to, in seconds. Maximum 21600 (6 hours)",
			required: true,
			minValue: 0,
			maxValue: 21_600,
		},
	],
	roleWhitelist: [ids.roles.mod, ids.roles.admin],
	async execute(interaction) {
		const slowmode = interaction.options.getInteger("seconds", true)
		if (!(interaction.channel instanceof TextChannel))
			return await interaction.reply({ content: "You can only set a slowmode in a text channel!", ephemeral: true })
		await interaction.channel.setRateLimitPerUser(slowmode, `Set by ${interaction.user.tag}`)
		await interaction.reply({ content: `Successfully set the slowmode to ${slowmode}`, ephemeral: true })
	},
}

export default command
