import { type EmbedFieldData, EmbedBuilder, Colors, ApplicationCommandOptionType } from "discord.js"

import { ids } from "../../config.json"
import { generateTip } from "../../lib/util"

import type { Command } from "../../lib/imports"

const command: Command = {
	name: "role",
	description: "Gives information about any given role",
	options: [
		{
			type: ApplicationCommandOptionType.Role,
			name: "role",
			description: "The role to get information for",
			required: true,
		},
	],
	roleWhitelist: [ids.roles.admin],
	channelWhitelist: [ids.channels.botDev, ids.channels.adminBots],
	async execute(interaction) {
		if (!interaction.inCachedGuild()) return
		const role = interaction.options.getRole("role", true),
			createdAt = Math.round(role.createdTimestamp / 1000),
			permissions = role.permissions.toArray()

		let tags: EmbedFieldData | null = null
		if (role.tags) {
			if (role.tags.botId) tags = { name: "This role is managed by", value: `<@!${role.tags.botId}>`, inline: true }
			else if (role.tags.integrationId) {
				tags = {
					name: "Managed by integration",
					value: await role.guild.fetchIntegrations().then(integrations => integrations.get(role.tags!.integrationId!)!.name),
					inline: true,
				}
			} else if (role.tags.premiumSubscriberRole) tags = { name: "Premium Subscriber Role", value: "True", inline: true }
		}
		const embed = new EmbedBuilder({
			color: role.color || Colors.Blurple,
			thumbnail: { url: role.iconURL({ extension: "png", size: 4096 }) ?? "" },
			author: { name: "Role information" },
			title: `${role.name} ${role.unicodeEmoji ?? ""}`,
			description: `${role} (ID: ${role.id})`,
			fields: [
				{ name: "Mentionable", value: role.mentionable ? "Yes" : "No", inline: true },
				{ name: "Hoisted", value: role.hoist ? "Yes" : "No", inline: true },
				{ name: "Created at", value: `<t:${createdAt}:F> (<t:${createdAt}:R>)`, inline: true },

				{ name: "Members", value: `${role.members.size}`, inline: true },
				{ name: "Position", value: `${role.position}`, inline: true },
				{ name: "HEX color", value: role.hexColor, inline: true },

				{ name: "Permissions", value: permissions.includes("Administrator") ? "Administrator" : permissions.join(", ") || "None" },
			],
			footer: { text: generateTip(), iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
		})
		if (tags) embed.spliceFields(5, 1, tags)

		await interaction.reply({ embeds: [embed] })
	},
}

export default command
