import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js"

import { colors, ids } from "../../config.json"
import crowdinVerify from "../../events/crowdinverify"
import { generateTip } from "../../lib/util"

import type { Command } from "../../lib/imports"

const command: Command = {
	name: "crowdinverify",
	description: "Goes through all the stored profiles and updates the user's roles accordingly",
	options: [
		{
			type: ApplicationCommandOptionType.Integer,
			name: "limit",
			description: "The amount of profiles to check. All by default",
			required: false,
		},
	],
	roleWhitelist: [ids.roles.admin],
	async execute(interaction) {
		if (!interaction.inCachedGuild()) return

		await interaction.deferReply()
		// eslint-disable-next-line no-undefined
		await crowdinVerify(interaction.options.getInteger("limit", false) ?? undefined)
		const embed = new EmbedBuilder({
			color: colors.success,
			author: { name: "Role updater" },
			title: "All verified users had their roles updated!",
			description: "Check the console for any errors that may have occured in the process",
			footer: { text: generateTip(), iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
		})
		await interaction.editReply({ embeds: [embed] }).catch(async () => {
			await interaction.channel!.send({ content: "The interaction expired, so here's the embed so you don't feel sad", embeds: [embed] })
		})
	},
}

export default command
