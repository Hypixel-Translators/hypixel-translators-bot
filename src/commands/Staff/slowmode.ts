import { ids } from "../../config.json"
import Discord from "discord.js"
import type { Command } from "../../index"

const command: Command = {
	name: "slowmode",
	description: "Sets the slowmode for the current channel",
	options: [{
		type: "INTEGER",
		name: "seconds",
		description: "The value to set the slowmode to, in seconds. Maximum 21600 (6 hours)",
		required: true
	}],
	roleWhitelist: [ids.roles.mod, ids.roles.admin],
	async execute(interaction) {
		const slowmode = interaction.options.getInteger("seconds", true)
		if (slowmode > 21_600 || slowmode < 0) return await interaction.reply({ content: "You must give a number between 0 and 21.600!", ephemeral: true })
		if (!(interaction.channel instanceof Discord.TextChannel)) return await interaction.reply({ content: "You can only set a slowmode in a text channel!", ephemeral: true })
		await interaction.channel.setRateLimitPerUser(slowmode, `Set by ${interaction.user.tag}`)
		await interaction.reply({ content: `Successfully set the slowmode to ${slowmode}`, ephemeral: true })
	}
}

export default command
