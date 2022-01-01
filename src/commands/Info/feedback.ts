import { GuildMember, MessageActionRow, MessageButton, MessageEmbed } from "discord.js"
import { colors, ids } from "../../config.json"
import { generateTip } from "../../lib/util"

import type { Command, GetStringFunction } from "../../lib/imports"

const command: Command = {
	name: "feedback",
	description: "Gives you instructions on how to give feedback towards the bot",
	cooldown: 120,
	allowDM: true,
	channelWhitelist: [ids.channels.bots, ids.channels.staffBots, ids.channels.botDev],
	async execute(interaction, getString: GetStringFunction) {
		const randomTip = generateTip(getString),
			member = interaction.member as GuildMember | null ?? interaction.user

		const embed = new MessageEmbed({
			color: colors.success,
			author: { name: getString("moduleName") },
			title: getString("bugT"),
			description: getString("bugD"),
			fields: [{ name: getString("urgentT"), value: getString("urgentD") }],
			footer: { text: randomTip, iconURL: member?.displayAvatarURL({ format: "png", dynamic: true }) }
		})
		const row = new MessageActionRow({
			components: [
				new MessageButton({
					style: "LINK",
					label: getString("link"),
					url: "https://github.com/Hypixel-Translators/hypixel-translators-bot/issues"
				})
			]
		})
		await interaction.reply({ components: [row], embeds: [embed] })
	}
}

export default command
