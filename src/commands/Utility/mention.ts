import { ApplicationCommandOptionType } from "discord.js"

import { ids } from "../../config.json"

import type { Command, GetStringFunction } from "../../lib/imports"

const command: Command = {
	name: "mention",
	description: "Mentions a language role with a message.",
	options: [
		{
			type: ApplicationCommandOptionType.String,
			name: "language",
			description: "The language to mention",
			required: true,
			autocomplete: true,
		},
		{
			type: ApplicationCommandOptionType.String,
			name: "role",
			description: "The role to mention",
			choices: [
				{ name: "Both roles", value: "all" },
				{ name: "Proofreader", value: "proofreader" },
				{ name: "Translator", value: "translator" },
			],
			required: true,
		},
		{
			type: ApplicationCommandOptionType.String,
			name: "message",
			description: "The message to send with the mention.",
			required: false,
		},
	],
	cooldown: 120,
	roleWhitelist: [ids.roles.hypixelPf, ids.roles.admin],
	categoryBlacklist: [ids.categories.main],
	async execute(interaction, getString: GetStringFunction) {
		if (!interaction.inCachedGuild()) return
		await interaction.deferReply({ ephemeral: true })
		const roleName = interaction.options
				.getString("language", true)
				.toLowerCase()
				.split(" ")
				.map(l => l.charAt(0).toUpperCase() + l.slice(1))
				.join(" "),
			message = interaction.options.getString("message", false) ?? "<a:bongoping:614477510423478275>",
			[pfRole, trRole] = interaction
				.guild!.roles.cache.filter(r => r.name.startsWith(roleName))
				.partition(r => r.name.endsWith(" Proofreader"))
				.map(r => r.first()!),
			hasPerm = interaction.member.roles.cache.has(pfRole?.id) || interaction.member.permissions.has("ManageRoles")

		if (!pfRole) throw "falseRole"
		switch (interaction.options.getString("role", true) as "all" | "proofreader" | "translator") {
			case "translator":
				if (hasPerm) await interaction.channel!.send(`**${interaction.user}**: ${trRole} ${message}`)
				else await interaction.editReply(`${getString("errorNoPing")}${getString("errorNoPingTr")} ${getString("errorNoPingDisclaimer")}`)
				break
			case "proofreader":
				if (hasPerm) await interaction.channel!.send(`**${interaction.user}**: ${pfRole} ${message}`)
				else await interaction.editReply(`${getString("errorNoPing")}${getString("errorNoPingPr")} ${getString("errorNoPingDisclaimer")}`)
				break
			case "all":
				if (hasPerm) await interaction.channel!.send(`**${interaction.user}**: ${trRole} ${pfRole} ${message}`)
				else await interaction.editReply(`${getString("errorNoPing")}${getString("errorNoPingAll")} ${getString("errorNoPingDisclaimer")}`)
				break
			default:
				throw "falseRole"
		}
		if (hasPerm) await interaction.editReply(getString("success"))
	},
}

export default command
