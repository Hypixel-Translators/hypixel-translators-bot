import { ApplicationCommandOptionType } from "discord.js"

import { ids } from "../../config.json"

import type { Command } from "../../lib/imports"

const command: Command = {
	name: "giveaway",
	description: "Gives you the winners of a giveaway.",
	options: [
		{
			type: ApplicationCommandOptionType.String,
			name: "messageid",
			description: "The ID of the message on this channel to fetch winners from",
			required: true,
		},
		{
			type: ApplicationCommandOptionType.Integer,
			name: "winners",
			description: "The amount of winners to pick. defaults to 1",
			required: false,
		},
	],
	roleWhitelist: [ids.roles.admin],
	async execute(interaction) {
		const giveawayMsg = await interaction.channel!.messages.fetch(interaction.options.getString("messageid", true)).catch(async err => {
			return void (await interaction.reply({ content: `Couldn't find that message! Here's the error:\n${err}`, ephemeral: true }))
		})
		if (!giveawayMsg) return
		const users = await giveawayMsg.reactions.cache.get("🎉")?.users.fetch()
		if (!users) return await interaction.reply({ content: "That message doesn't have any 🎉 reactions.", ephemeral: true })
		await interaction.reply(
			`Congratulations to ${users
				.random(interaction.options.getInteger("winners", false) || 1)
				.filter(Boolean)
				.join(", ")}!`,
		)
	},
}

export default command
