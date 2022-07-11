import { ids } from "../config.json"
import { client } from "../index"
import { db } from "../lib/dbclient"

import type { Poll } from "../commands/Utility/poll"
import type { GetStringFunction } from "../lib/imports"
import type { ButtonInteraction, Snowflake } from "discord.js"

export default async function handleButtonInteractions(interaction: ButtonInteraction<"cached">, getString: GetStringFunction) {
	// Staff LOA warning removal system
	if (interaction.channelId === ids.channels.loa && interaction.customId === "done") {
		if (interaction.message.mentions.users.first()!.id !== interaction.user.id)
			return await interaction.reply({ content: "You can only remove your own LOA warning!", ephemeral: true })

		const endDateRaw = interaction.message.embeds[0].fields![1].value.split("/")
		if (new Date(Number(endDateRaw[2]), Number(endDateRaw[1]) - 1, Number(endDateRaw[0])).getTime() > Date.now()) {
			await interaction.reply({
				content: "You can't end this LOA yet! If something changed, please contact the admins.",
				ephemeral: true,
			})
		} else {
			await interaction.message.delete()
			await interaction.reply({ content: "Successfully deleted this LOA! **Welcome back!**", ephemeral: true })
		}
	} else if (interaction.channelId === ids.channels.serverInfo) {
		// Self-roles system
		let roleId: Snowflake
		if (interaction.customId === "polls") roleId = ids.roles.polls
		else if (interaction.customId === "botUpdates") roleId = ids.roles.botUpdates
		else if (interaction.customId === "crowdinUpdates") roleId = ids.roles.crowdinUpdates
		else if (interaction.customId === "giveaways") {
			const userDb = await client.getUser(interaction.user.id)
			if ((userDb.levels?.level ?? 0) < 5) {
				console.log(
					`${interaction.member.user.tag} tried to get the Giveaway pings role but they're level ${userDb.levels?.level ?? 0} lol`,
				)
				return await interaction.reply({
					content: getString("roles.noLevel", { variables: { level: 5, command: "`/rank`", channel: `<#${ids.channels.bots}>` } }),
					ephemeral: true,
				})
			}
			roleId = ids.roles.giveawayPings
		} else return
		if (interaction.member.roles.cache.has(roleId)) {
			await interaction.member.roles.remove(roleId, "Clicked the button in server-info")
			await interaction.reply({ content: getString("roles.successTake", { variables: { role: `<@&${roleId}>` } }), ephemeral: true })
			console.log(`Took the ${interaction.guild!.roles.cache.get(roleId)!.name} role from ${interaction.user.tag}`)
		} else {
			await interaction.member.roles.add(roleId, "Clicked the button in server-info")
			await interaction.reply({ content: getString("roles.successGive", { variables: { role: `<@&${roleId}>` } }), ephemeral: true })
			console.log(`Gave the ${interaction.guild!.roles.cache.get(roleId)!.name} role to ${interaction.user.tag}`)
		}
	} else if (/option[1-8]/g.test(interaction.customId)) {
		// User polls system
		const collection = db.collection<Poll>("polls"),
			pollDb = await collection.findOne({ channelId: interaction.channelId, messageId: interaction.message.id }),
			optionIndex = Number(interaction.customId.at(-1)) - 1

		if (!pollDb) return await interaction.reply({ content: getString("noPollDb", { file: "poll" }), ephemeral: true })

		if (pollDb.options[optionIndex].votes.includes(interaction.user.id))
			return await interaction.reply({ content: getString("alreadyVoted", { file: "poll" }), ephemeral: true })

		for (const option of pollDb.options) {
			const voteIndex = option.votes.indexOf(interaction.user.id)
			// Remove user's votes on other options, if any
			if (~voteIndex) option.votes.splice(voteIndex, 1)
			// Add the new vote to the correct option
			if (option.id === interaction.customId) option.votes.push(interaction.user.id)
		}

		await collection.updateOne(
			{ channelId: interaction.channelId, messageId: interaction.message.id },
			{ $set: { options: pollDb.options } },
		)
		await interaction.reply({ content: getString("successVote", { file: "poll" }), ephemeral: true })
	}
}
