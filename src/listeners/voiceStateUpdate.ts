import { EmbedBuilder, type TextChannel } from "discord.js"

import { ids } from "../config.json"
import { client } from "../index"

client.on("voiceStateUpdate", async (oldState, newState) => {
	if (newState.guild.id === ids.guilds.main && !newState.member?.user.bot) {
		const logs = client.channels.cache.get(ids.channels.logs) as TextChannel,
			successColor = 0x43b581,
			errorColor = 0xff470f

		// Convert to boolean to prevent null !== false from triggering the condition
		if (!!oldState.serverMute !== !!newState.serverMute) {
			const embed = new EmbedBuilder({
				color: newState.serverMute ? errorColor : successColor,
				author: {
					name: newState.member!.user.tag,
					iconURL: newState.member!.displayAvatarURL({ extension: "png" }),
				},
				description: `**${newState.member} was server ${newState.serverMute ? "muted" : "unmuted"} in ${newState.channel?.name}**`,
				timestamp: Date.now(),
				footer: { text: `ID: ${newState.member!.id}` },
			})
			await logs.send({ embeds: [embed] })
		} else if (!!oldState.serverDeaf !== !!newState.serverDeaf) {
			const embed = new EmbedBuilder({
				color: newState.serverDeaf ? errorColor : successColor,
				author: { name: newState.member!.user.tag, iconURL: newState.member!.displayAvatarURL({ extension: "png" }) },
				description: `**${newState.member} was server ${newState.serverDeaf ? "deafened" : "undeafened"} in ${newState.channel?.name}**`,
				timestamp: Date.now(),
				footer: { text: `ID: ${newState.member!.id}` },
			})
			await logs.send({ embeds: [embed] })
		}
	}
})
