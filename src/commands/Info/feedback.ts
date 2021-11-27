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

		const embed = new MessageEmbed()
			.setColor(colors.success)
			.setAuthor(getString("moduleName"))
			.setTitle(getString("bugT"))
			.setDescription(getString("bugD"))
			.addField(getString("urgentT"), getString("urgentD"))
			.setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))
		const row = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setLabel(getString("link"))
					.setStyle("LINK")
					.setURL("https://github.com/Hypixel-Translators/hypixel-translators-bot/issues")
			)
		await interaction.reply({ components: [row], embeds: [embed] })
	}
}

export default command
