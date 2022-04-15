import { Constants, Formatters, type GuildTextBasedChannel, EmbedBuilder, ApplicationCommandOptionType } from "discord.js"

import { colors, ids } from "../../config.json"
import { generateTip } from "../../lib/util"

import type { Command } from "../../lib/imports"

const command: Command = {
	name: "say",
	description: "Says something in a specific channel.",
	options: [
		{
			type: ApplicationCommandOptionType.Channel,
			channelTypes: Constants.TextBasedChannelTypes,
			name: "channel",
			description: "The channel to send the message in",
			required: true,
		},
		{
			type: ApplicationCommandOptionType.String,
			name: "message",
			description: "The message to send",
			required: true,
		},
	],
	cooldown: 600,
	roleWhitelist: [ids.roles.staff],
	async execute(interaction) {
		if (!interaction.inCachedGuild()) return
		const sendTo = interaction.options.getChannel("channel", true) as GuildTextBasedChannel,
			message = interaction.options.getString("message", true)

		if (!interaction.member.permissionsIn(sendTo).has("SendMessages")) throw "noPermission"

		if (interaction.member.permissions.has("ManageRoles")) await sendTo.send(message)
		else await sendTo.send(Formatters.blockQuote(message))
		const embed = new EmbedBuilder({
			color: colors.success,
			author: { name: "Message" },
			title: "Success! Message sent.",
			description: `${sendTo}:\n${message}`,
			footer: { text: generateTip(), iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
		})
		await interaction.reply({ embeds: [embed] })
	},
}

export default command
