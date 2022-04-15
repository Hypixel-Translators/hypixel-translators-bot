import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js"

import { colors, ids } from "../../config.json"
import { client } from "../../index"
import { db, type DbUser } from "../../lib/dbclient"
import { generateTip } from "../../lib/util"

import type { Command, GetStringFunction } from "../../lib/imports"

const command: Command = {
	name: "profile",
	description: "Gets the profile of a user",
	options: [
		{
			type: ApplicationCommandOptionType.User,
			name: "user",
			description: "The user to find the profile for. Admin only.",
			required: false,
		},
		{
			type: ApplicationCommandOptionType.String,
			name: "profile",
			description: "The new profile to set for the user. Admin only.",
			required: false,
		},
	],
	async execute(interaction, getString: GetStringFunction) {
		if (!interaction.inCachedGuild()) return
		const user = interaction.options.getUser("user", false),
			profile = interaction.options.getString("profile", false)?.toLowerCase()

		if (interaction.member.roles.cache.has(ids.roles.admin) && user) {
			if (!profile) {
				const userDb = await client.getUser(user.id)
				if (userDb.profile) {
					const embed = new EmbedBuilder({
						color: colors.neutral,
						author: { name: "Crowdin Profile" },
						title: `Here's ${user.tag}'s Crowdin profile`,
						description: userDb.profile,
						footer: { text: generateTip(), iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
					})
					return await interaction.reply({ embeds: [embed], ephemeral: true })
				} else {
					const embed = new EmbedBuilder({
						color: colors.error,
						author: { name: "Crowdin Profile" },
						title: `Couldn't find ${user.tag}'s Crowdin profile on the database!`,
						footer: { text: generateTip(), iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
					})
					return await interaction.reply({ embeds: [embed], ephemeral: true })
				}
			} else if (/(https:\/\/)?(www\.)?crowdin\.com\/profile\/\S{1,}/gi.test(profile)) {
				const result = await db.collection<DbUser>("users").findOneAndUpdate({ id: user.id }, { $set: { profile: profile } })
				if (result.value!.profile !== profile) {
					const embed = new EmbedBuilder({
						color: colors.success,
						author: { name: "User Profile" },
						title: `Successfully updated ${user.tag}'s Crowdin profile!`,
						fields: [
							{ name: "Old profile", value: result.value!.profile ?? "None" },
							{ name: "New profile", value: profile },
						],
						footer: { text: generateTip(), iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
					})
					return await interaction.reply({ embeds: [embed], ephemeral: true })
				} else {
					const embed = new EmbedBuilder({
						color: colors.error,
						author: { name: "User Profile" },
						title: `Couldn't update ${user.tag}'s Crowdin profile!`,
						description: "Their current profile is the same as the one you tried to add.",
						footer: { text: generateTip(), iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
					})
					return await interaction.reply({ embeds: [embed], ephemeral: true })
				}
			} else throw "wrongLink"
		} else if (interaction.member.roles.cache.has(ids.roles.admin) && !user && profile) {
			const profileUser = await db.collection<DbUser>("users").findOne({ profile: profile })
			if (profileUser) {
				const userObject = await client.users.fetch(profileUser.id),
					embed = new EmbedBuilder({
						color: colors.neutral,
						author: { name: "Crowdin Profile" },
						title: `That profile belongs to ${userObject.tag}`,
						description: `${userObject}: ${profileUser.profile!}`,
						footer: { text: generateTip(), iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
					})
				return await interaction.reply({ embeds: [embed], ephemeral: true })
			} else {
				const embed = new EmbedBuilder({
					color: colors.neutral,
					author: { name: "Crowdin Profile" },
					title: "Couldn't find a user with that profile!",
					footer: { text: generateTip(), iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
				})
				return await interaction.reply({ embeds: [embed], ephemeral: true })
			}
		} else {
			const randomTip = generateTip(getString),
				userDb = await client.getUser(interaction.user.id)
			if (userDb.profile) {
				const embed = new EmbedBuilder({
					color: colors.neutral,
					author: { name: getString("moduleName") },
					title: getString("profileSuccess"),
					description: userDb.profile,
					footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
				})
				return await interaction.reply({ embeds: [embed], ephemeral: true })
			} else {
				const embed = new EmbedBuilder({
					color: colors.error,
					author: { name: getString("moduleName") },
					title: getString("noProfile"),
					description: getString("howStore"),
					footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
				})
				return await interaction.reply({ embeds: [embed], ephemeral: true })
			}
		}
	},
}

export default command
