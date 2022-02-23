import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js"

import { colors, ids } from "../../config.json"
import { stats, updateProjectStatus } from "../../events/stats"
import { generateTip } from "../../lib/util"

import type { Command } from "../../lib/imports"

const command: Command = {
	name: "stats",
	description: "Updates statistics channels and notifies members of new strings (if applicable).",
	options: [
		{
			type: ApplicationCommandOptionType.String,
			name: "project",
			description: "The project to update statistics for. Defaults to all projects",
			choices: [
				{ name: "Hypixel", value: "hypixel" },
				{ name: "Quickplay", value: "quickplay" },
				{ name: "SkyblockAddons", value: "sba" },
				{ name: "Hypixel Translators Bot", value: "bot" },
			],
			required: false,
		},
	],
	roleWhitelist: [ids.roles.admin],
	async execute(interaction) {
		if (!interaction.inCachedGuild()) return
		await interaction.deferReply()
		const projectInput = interaction.options.getString("project", false) as "hypixel" | "quickplay" | "sba" | "bot"
		if (!projectInput) {
			await stats(true).catch(err => {
				throw err
			})
			const allEmbed = new EmbedBuilder({
				color: colors.success,
				author: { name: "Statistics updater" },
				title: "All statistics channels have been updated!",
				description: `Check them out at ${interaction.guild!.channels.cache.find(
					c => c.name === "hypixel-language-status",
				)}, ${interaction.guild!.channels.cache.find(c => c.name === "sba-language-status")}, ${interaction.guild!.channels.cache.find(
					c => c.name === "bot-language-status",
				)} and ${interaction.guild!.channels.cache.find(c => c.name === "quickplay-language-status")}`,
				footer: { text: generateTip(), iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
			})
			await interaction.editReply({ embeds: [allEmbed] })
		} else {
			await updateProjectStatus(ids.projects[projectInput])

			const projectEmbed = new EmbedBuilder({
				color: colors.success,
				author: { name: "Statistics updater" },
				title: `The ${projectInput} language statistics have been updated!`,
				description: `Check them out at ${interaction.guild!.channels.cache.find(c => c.name === `${projectInput}-language-status`)}!`,
				footer: { text: generateTip(), iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
			})
			await interaction.editReply({ embeds: [projectEmbed] })
			console.log(`Manually updated the ${projectInput} language statistics.`)
		}
	},
}

export default command
