import { type GuildMember, EmbedBuilder, ApplicationCommandOptionType } from "discord.js"

import { colors, ids } from "../../config.json"
import { generateTip } from "../../lib/util"

import type { Command, GetStringFunction } from "../../lib/imports"

const command: Command = {
	name: "8ball",
	description: "The Magic 8 Ball that will answer all your questions.",
	options: [
		{
			type: ApplicationCommandOptionType.String,
			name: "question",
			description: "The question to ask the bot",
			required: true,
		},
	],
	cooldown: 5,
	channelWhitelist: [ids.channels.bots, ids.channels.staffBots, ids.channels.botDev],
	allowDM: true,
	async execute(interaction, getString: GetStringFunction) {
		const keys = Object.keys(getString("answers")),
			answerType = keys[(keys.length * Math.random()) << 0] as "positive" | "inconclusive" | "negative",
			answers = getString(`answers.${answerType}`),
			color = answerType === "positive" ? colors.success : answerType === "inconclusive" ? colors.loading : colors.error,
			embed = new EmbedBuilder({
				color,
				author: { name: getString("moduleName") },
				title: answers[Math.floor(Math.random() * answers.length)],
				fields: [{ name: getString("question"), value: interaction.options.getString("question", true) }],
				footer: {
					text: generateTip(getString),
					iconURL: ((interaction.member as GuildMember | null) ?? interaction.user).displayAvatarURL({ extension: "png" }),
				},
			})
		await interaction.reply({ embeds: [embed] })
	},
}

export default command
