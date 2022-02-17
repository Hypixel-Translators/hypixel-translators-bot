import { ids } from "../../config.json"

import type { Command, GetStringFunction } from "../../lib/imports"

const command: Command = {
	name: "mention",
	description: "Mentions a language role with a message.",
	options: [
		{
			type: "STRING",
			name: "language",
			description: "The language to mention",
			required: true,
			autocomplete: true,
		},
		{
			type: "STRING",
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
			type: "STRING",
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
		const roleType = interaction.options.getString("role", true) as "all" | "proofreader" | "translator"

		let roleName = interaction.options
				.getString("language", true)
				.toLowerCase()
				.split(" ")
				.map(l => l.charAt(0).toUpperCase() + l.slice(1))
				.join(" "),
			message = interaction.options.getString("message", false)
		message ??= "<a:bongoping:614477510423478275>"

		const langs: { [key: string]: string } = {
			Chinesesimplified: "Chinese Simplified",
			"Chinese-simplified": "Chinese Simplified",
			Zhcn: "Chinese Simplified",
			Chinesetraditional: "Chinese Traditional",
			"Chinese-traditional": "Chinese Traditional",
			Zhtw: "Chinese Traditional",
			Lolcat: "LOLCAT",
			Lol: "LOLCAT",
			Bg: "Bulgarian",
			Cs: "Czech",
			Da: "Danish",
			Nl: "Dutch",
			Fi: "Finnish",
			Fr: "French",
			De: "German",
			El: "Greek",
			It: "Italian",
			Ja: "Japanese",
			Ko: "Korean",
			Ms: "Malay",
			No: "Norwegian",
			Pl: "Polish",
			Pt: "Portuguese",
			Ptbr: "Portuguese Brazilian",
			Brazilian: "Portuguese Brazilian",
			Ru: "Russian",
			Es: "Spanish",
			Sv: "Swedish",
			Se: "Swedish",
			Th: "Thai",
			Tr: "Turkish",
			Ua: "Ukrainian",
			Enpt: "Pirate English",
			Pirate: "Pirate English",
		}

		if (langs[roleName]) roleName = langs[roleName]
		const [pfRole, trRole] = interaction
				.guild!.roles.cache.filter(r => r.name.startsWith(roleName))
				.partition(r => r.name.endsWith(" Proofreader"))
				.map(r => r.first()!),
			hasPerm = interaction.member.roles.cache.has(pfRole?.id) || interaction.member.permissions.has("MANAGE_ROLES")

		if (!pfRole) throw "falseRole"
		if (roleType === "proofreader") {
			if (hasPerm) await interaction.reply(`**${interaction.user}**: ${pfRole} ${message}`)
			else {
				await interaction.reply({
					content: `${getString("errorNoPing")}${getString("errorNoPingPr")} ${getString("errorNoPingDisclaimer")}`,
					ephemeral: true,
				})
			}
		} else if (roleType === "translator") {
			if (hasPerm) await interaction.reply(`**${interaction.user}**: ${trRole} ${message}`)
			else {
				await interaction.reply({
					content: `${getString("errorNoPing")}${getString("errorNoPingTr")} ${getString("errorNoPingDisclaimer")}`,
					ephemeral: true,
				})
			}
		} else if (roleType === "all") {
			if (hasPerm) await interaction.reply(`**${interaction.user}**: ${trRole} ${pfRole} ${message}`)
			else {
				await interaction.reply({
					content: `${getString("errorNoPing")}${getString("errorNoPingAll")} ${getString("errorNoPingDisclaimer")}`,
					ephemeral: true,
				})
			}
		} else throw "falseRole"
	},
}

export default command
