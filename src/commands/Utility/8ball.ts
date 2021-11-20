import { GuildMember, HexColorString, MessageEmbed } from "discord.js"
import { successColor, loadingColor, errorColor, ids } from "../../config.json"
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
			embed = new MessageEmbed()
				.setAuthor(getString("moduleName"))
				.setTitle(answer)
				.addField(getString("question"), interaction.options.getString("question", true))
				.setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))
		if (answerType === "positive") embed.setColor(successColor as HexColorString)
		else if (answerType === "inconclusive") embed.setColor(loadingColor as HexColorString)
		else if (answerType === "negative") embed.setColor(errorColor as HexColorString)
		else console.error("Help the 8ball answer type is weird")
		await interaction.reply({ embeds: [embed] })
	}
}

export default command
