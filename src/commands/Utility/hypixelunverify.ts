import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js"

import { colors, ids } from "../../config.json"
import { client } from "../../index"
import { db, type DbUser } from "../../lib/dbclient"
import { generateTip, updateRoles } from "../../lib/util"

import type { Command, GetStringFunction } from "../../lib/imports"

const command: Command = {
	name: "hypixelunverify",
	description: "Unlinks your Discord account from your Hypixel player",
	cooldown: 60,
	options: [
		{
			type: ApplicationCommandOptionType.User,
			name: "user",
			description: "The user to unverify. Admin-only",
			required: false,
		},
	],
	channelWhitelist: [ids.channels.bots, ids.channels.staffBots, ids.channels.botDev],
	async execute(interaction, getString: GetStringFunction) {
		if (!interaction.inCachedGuild()) return
		const randomTip = generateTip(getString),
			memberInput = interaction.options.getMember("user"),
			collection = db.collection<DbUser>("users")

		if (memberInput && interaction.member.roles.cache.has(ids.roles.admin)) {
			await updateRoles(memberInput)
			const result = await collection.updateOne({ id: memberInput.id }, { $unset: { uuid: true } })
			if (result.modifiedCount) {
				const embed = new EmbedBuilder({
					color: colors.success,
					author: { name: "Hypixel Verification" },
					title: `Successfully unverified ${memberInput.user.tag}`,
					footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
				})
				return await interaction.reply({ embeds: [embed] })
			} else {
				const embed = new EmbedBuilder({
					color: colors.error,
					author: { name: "Hypixel Verification" },
					title: `Couldn't unverify ${memberInput.user.tag}!`,
					description: "This happened because this user isn't verified yet.",
					footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
				})
				return await interaction.reply({ embeds: [embed], ephemeral: true })
			}
		} else {
			await updateRoles(interaction.member)
			client.cooldowns.get(this.name)!.delete(interaction.user.id)
			const result = await collection.updateOne({ id: interaction.user.id }, { $unset: { uuid: true } })
			if (result.modifiedCount) {
				const embed = new EmbedBuilder({
					color: colors.success,
					author: { name: getString("moduleName") },
					title: getString("unverified"),
					footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
				})
				return await interaction.reply({ embeds: [embed] })
			} else {
				const embed = new EmbedBuilder({
					color: colors.error,
					author: { name: getString("moduleName") },
					title: getString("notUnverified"),
					description: getString("whyNotUnverified"),
					footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
				})
				return await interaction.reply({ embeds: [embed], ephemeral: true })
			}
		}
	},
}

export default command
