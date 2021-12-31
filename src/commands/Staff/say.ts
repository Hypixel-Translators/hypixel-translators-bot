import { Constants, Formatters, GuildTextBasedChannel, MessageEmbed } from "discord.js"
import { colors, ids } from "../../config.json"
import { generateTip } from "../../lib/util"

import type { Command } from "../../lib/imports"

const command: Command = {
	name: "say",
	description: "Says something in a specific channel.",
	options: [{
		type: "CHANNEL",
		channelTypes: Constants.TextBasedChannelTypes,
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
		if (!interaction.inCachedGuild()) return
		const sendTo = interaction.options.getChannel("channel", true) as GuildTextBasedChannel,
			message = interaction.options.getString("message", true)

		if (!interaction.member.permissionsIn(sendTo).has("SEND_MESSAGES")) throw "noPermission"

		if (interaction.member.permissions.has("MANAGE_ROLES")) await sendTo.send(message)
		else await sendTo.send(Formatters.blockQuote(message))
		const embed = new MessageEmbed({
			color: colors.success,
			author: { name: "Message" },
			title: "Success! Message sent.",
			description: `${sendTo}:\n${message}`,
			footer: { text: generateTip(), iconURL: interaction.member.displayAvatarURL({ format: "png", dynamic: true }) }
		})
		await interaction.reply({ embeds: [embed] })
	}
}

export default command
