import { successColor, ids } from "../../config.json"
import Discord from "discord.js"
import type { Command } from "../../index"
import { generateTip } from "../../lib/util"

const command: Command = {
	name: "say",
	description: "Says something in a specific channel.",
	options: [{
		type: "CHANNEL",
		channelTypes: ["GUILD_TEXT", "GUILD_NEWS", "GUILD_NEWS_THREAD", "GUILD_PRIVATE_THREAD", "GUILD_PUBLIC_THREAD"],
		name: "channel",
		description: "The channel to send the message in",
		required: true
	},
	{
		type: "STRING",
		name: "message",
		description: "The message to send",
		required: true
	}],
	cooldown: 600,
	roleWhitelist: [ids.roles.staff],
	async execute(interaction) {
		const sendTo = interaction.options.getChannel("channel", true) as (Discord.TextChannel | Discord.NewsChannel),
			member = interaction.member as Discord.GuildMember,
			message = interaction.options.getString("message", true)

		if (!member.permissionsIn(sendTo).has("SEND_MESSAGES")) throw "noPermission"

		if (member.permissions.has("MANAGE_ROLES")) await sendTo.send(message)
		else await sendTo.send(Discord.Formatters.blockQuote(message))
		const embed = new Discord.MessageEmbed()
			.setColor(successColor as Discord.HexColorString)
			.setAuthor("Message")
			.setTitle("Success! Message sent.")
			.setDescription(`${sendTo}:\n${message}`)
			.setFooter(generateTip(), member.displayAvatarURL({ format: "png", dynamic: true }))
		await interaction.reply({ embeds: [embed] })
	}
}

export default command
