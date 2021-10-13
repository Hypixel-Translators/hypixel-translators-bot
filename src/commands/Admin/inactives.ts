import { successColor, ids } from "../../config.json"
import Discord from "discord.js"
import inactives from "../../events/inactives"
import { Command, client } from "../../index"
import { generateTip } from "../../lib/util"

const command: Command = {
	name: "inactives",
	description: "Checks for inactive unverified members (if applicable).",
	roleWhitelist: [ids.roles.admin],
	async execute(interaction) {
		const member = interaction.member as Discord.GuildMember

		await inactives(true)
		const embed = new Discord.MessageEmbed()
			.setColor(successColor as Discord.HexColorString)
			.setAuthor("Inactive checker")
			.setTitle("All inactive members have been notified!")
			.setFooter(generateTip(), member.displayAvatarURL({ format: "png", dynamic: true }))
		await interaction.reply({ embeds: [embed] })
	}
}

export default command
