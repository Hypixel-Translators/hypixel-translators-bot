import { GuildMember, MessageEmbed } from "discord.js"
import { colors, ids } from "../../config.json"
import { generateTip } from "../../lib/util"

import type { Command, GetStringFunction } from "../../lib/imports"

const command: Command = {
	name: "8ball",
	description: "The Magic 8 Ball that will answer all your questions.",
	options: [{
		type: "STRING",
		name: "question",
		description: "The question to ask the bot",
		required: true
	}],
	cooldown: 5,
	channelWhitelist: [ids.channels.bots, ids.channels.staffBots, ids.channels.botDev],
	allowDM: true,
	async execute(interaction, getString: GetStringFunction) {
		const member = interaction.member as GuildMember | null ?? interaction.user,
			randomTip = generateTip(getString),
			keys = Object.keys(getString("answers")),
			answerType = keys[keys.length * Math.random() << 0] as "positive" | "inconclusive" | "negative",
			answers = getString(`answers.${answerType}`),
			answer = answers[Math.floor(Math.random() * answers.length)],
			color = answerType === "positive" ? colors.success : answerType === "inconclusive" ? colors.loading : colors.error,
			embed = new MessageEmbed({
				color,
				author: { name: getString("moduleName") },
				title: answer,
				fields: [
					{ name: getString("question"), value: interaction.options.getString("question", true)}
				],
				footer: { text: randomTip, iconURL: member.displayAvatarURL({ format: "png", dynamic: true }) }
			})
		await interaction.reply({ embeds: [embed] })
	}
}

export default command
