import { MessageEmbed } from "discord.js"
import { client } from "../../index"
import { colors, ids } from "../../config.json"
import { db, DbUser } from "../../lib/dbclient"
import { generateTip, updateRoles } from "../../lib/util"

import type { Command, GetStringFunction } from "../../lib/imports"

const command: Command = {
	name: "hypixelunverify",
	description: "Unlinks your Discord account from your Hypixel player",
	cooldown: 60,
	options: [{
		type: "USER",
		name: "user",
		description: "The user to unverify. Admin-only",
		required: false
	}],
	channelWhitelist: [ids.channels.bots, ids.channels.staffBots, ids.channels.botDev],
	async execute(interaction, getString: GetStringFunction) {
		if (!interaction.inCachedGuild()) return
		const randomTip = generateTip(getString),
			memberInput = interaction.options.getMember("user", false),
			collection = db.collection<DbUser>("users")

		if (memberInput && interaction.member.roles.cache.has(ids.roles.admin)) {
			await updateRoles(memberInput)
			const result = await collection.updateOne({ id: memberInput.id }, { $unset: { uuid: true } })
			if (result.modifiedCount) {
				const embed = new MessageEmbed()
					.setColor(colors.success)
					.setAuthor("Hypixel Verification")
					.setTitle(`Successfully unverified ${memberInput.user.tag}`)
					.setFooter(randomTip, interaction.member.displayAvatarURL({ format: "png", dynamic: true }))
				return await interaction.reply({ embeds: [embed] })
			} else {
				const embed = new MessageEmbed()
					.setColor(colors.error)
					.setAuthor("Hypixel Verification")
					.setTitle(`Couldn't unverify ${memberInput.user.tag}!`)
					.setDescription("This happened because this user isn't verified yet.")
					.setFooter(randomTip, interaction.member.displayAvatarURL({ format: "png", dynamic: true }))
				return await interaction.reply({ embeds: [embed], ephemeral: true })
			}
		} else {
			await updateRoles(interaction.member)
			client.cooldowns.get(this.name)!.delete(interaction.user.id)
			const result = await collection.updateOne({ id: interaction.user.id }, { $unset: { uuid: true } })
			if (result.modifiedCount) {
				const embed = new MessageEmbed()
					.setColor(colors.success)
					.setAuthor(getString("moduleName"))
					.setTitle(getString("unverified"))
					.setFooter(randomTip, interaction.member.displayAvatarURL({ format: "png", dynamic: true }))
				return await interaction.reply({ embeds: [embed] })
			} else {
				const embed = new MessageEmbed()
					.setColor(colors.error)
					.setAuthor(getString("moduleName"))
					.setTitle(getString("notUnverified"))
					.setDescription(getString("whyNotUnverified"))
					.setFooter(randomTip, interaction.member.displayAvatarURL({ format: "png", dynamic: true }))
				return await interaction.reply({ embeds: [embed], ephemeral: true })
			}
		}
	}
}

export default command
