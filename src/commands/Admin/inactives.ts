import { successColor } from "../../config.json"
import Discord from "discord.js"
import inactives from "../../events/inactives"
import { Command, client } from "../../index"
import { generateTip } from "../../lib/util"

const command: Command = {
	name: "inactives",
	description: "Checks for inactive unverified members (if applicable).",
	roleWhitelist: ["764442984119795732"], //Discord Administrator
	async execute(interaction) {
		await inactives(client, true)
		const embed = new Discord.MessageEmbed()
			.setColor(successColor as Discord.HexColorString)
			.setAuthor("Inactive checker")
			.setTitle("All inactive members have been notified!")
			.setFooter(generateTip(), interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
		await interaction.reply({ embeds: [embed] })
	}
}

export default command
