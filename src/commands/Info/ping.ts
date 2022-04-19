import { type GuildMember, EmbedBuilder } from "discord.js"

import { colors, ids } from "../../config.json"
import { generateTip } from "../../lib/util"

import type { Command, GetStringFunction } from "../../lib/imports"

const command: Command = {
	name: "ping",
	description: "Gives you the bot's ping",
	cooldown: 20,
	allowDM: true,
	channelWhitelist: [ids.channels.bots, ids.channels.staffBots, ids.channels.botDev, ids.channels.adminBots],
	async execute(interaction, getString: GetStringFunction) {
		const ping = Date.now() - interaction.createdTimestamp,
			onlineSince = Math.round(interaction.client.readyTimestamp! / 1000)

		// Contributed by marzeq. Original idea by Rodry
		let color: number
		if (ping < 0) {
			color = colors.error
			console.log("Something went terribly wrong and the ping is negative. Come pick me up I'm scared.")
		} else if (ping <= 200) color = colors.success
		else if (ping <= 400) color = colors.loading
		else color = colors.error

		const embed = new EmbedBuilder({
			color,
			author: { name: getString("moduleName") },
			title: getString("pong", { variables: { pingEmote: "<:ping:620954198493888512>" } }),
			description: `${getString("message", { variables: { ping: ping } })}\n\n${getString("onlineSince", {
				variables: {
					timestamp: `<t:${onlineSince}>`,
					timestampRelative: `<t:${onlineSince}:R>`,
				},
			})}`,
			footer: {
				text: generateTip(getString),
				iconURL: ((interaction.member as GuildMember | null) ?? interaction.user).displayAvatarURL({ extension: "png" }),
			},
		})
		await interaction.reply({ embeds: [embed] })
	},
}

export default command
