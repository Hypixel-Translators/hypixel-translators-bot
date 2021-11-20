import { GuildMember, HexColorString, MessageEmbed } from "discord.js"
import { client } from "../../index"
import { errorColor, successColor, neutralColor, ids } from "../../config.json"
import { generateTip } from "../../lib/util"

import type { Command, GetStringFunction } from "../../lib/imports"

const command: Command = {
	name: "dm",
	description: "Sends the user a private message.",
	options: [{
		type: "USER",
		name: "user",
		description: "The user to DM",
		required: true
	},
	{
		type: "STRING",
		name: "message",
		description: "The message to send",
		required: true
	}],
	roleWhitelist: [ids.roles.staff],
	async execute(interaction, getString: GetStringFunction) {
		await interaction.deferReply()
		const member = interaction.member as GuildMember,
			recipient = interaction.options.getUser("user", true),
			recipientDb = await client.getUser(recipient.id),
			message = interaction.options.getString("message", true).replaceAll("\\n", "\n"),
			dm = new MessageEmbed()
				.setColor(neutralColor as HexColorString)
				.setAuthor(getString("incoming", this.name, recipientDb.lang))
				.setDescription(message)
				.setFooter(getString("incomingDisclaimer", this.name, recipientDb.lang)),
			randomTip = generateTip()
		await recipient.send({ embeds: [dm] })
			.then(async () => {
				const embed = new MessageEmbed()
					.setColor(successColor as HexColorString)
					.setAuthor("Direct Message")
					.setTitle(`Sent message to ${recipient.tag}`)
					.setDescription(message)
					.setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))
				await interaction.editReply({ embeds: [embed] })
			})
			.catch(async error => {
				const errorEmbed = new MessageEmbed()
					.setColor(errorColor as HexColorString)
					.setAuthor("Direct Message")
					.setTitle(`An error occured while trying to message ${recipient.tag}`)
					.setDescription(error.toString())
					.setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))
				await interaction.editReply({ embeds: [errorEmbed] })
			})
	}
}

export default command
