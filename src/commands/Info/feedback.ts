import { successColor, ids } from "../../config.json"
import Discord from "discord.js"
import type { Command, GetStringFunction } from "../../index"
import { generateTip } from "../../lib/util"

const command: Command = {
	name: "feedback",
	description: "Gives you instructions on how to give feedback towards the bot",
	cooldown: 120,
	allowDM: true,
	channelWhitelist: [ids.channels.bots, ids.channels.staffBots, ids.channels.botDev],
	async execute(interaction, getString: GetStringFunction) {
		const randomTip = generateTip(getString),
			member = interaction.member as Discord.GuildMember | null ?? interaction.user

		const embed = new Discord.MessageEmbed()
			.setColor(successColor as Discord.HexColorString)
			.setAuthor(getString("moduleName"))
			.setTitle(getString("bugT"))
			.setDescription(getString("bugD"))
			.addField(getString("urgentT"), getString("urgentD"))
			.setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))
		const row = new Discord.MessageActionRow()
			.addComponents(
				new Discord.MessageButton()
					.setLabel(getString("link"))
					.setStyle("LINK")
					.setURL("https://github.com/Hypixel-Translators/hypixel-translators-bot/issues")
			)
		await interaction.reply({ components: [row], embeds: [embed] })
	}
}

export default command
