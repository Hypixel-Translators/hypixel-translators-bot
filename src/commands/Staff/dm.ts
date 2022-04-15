import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js"

import { colors, ids } from "../../config.json"
import { client } from "../../index"
import { generateTip } from "../../lib/util"

import type { Command, GetStringFunction } from "../../lib/imports"

const command: Command = {
	name: "dm",
	description: "Sends the user a private message.",
	options: [
		{
			type: ApplicationCommandOptionType.User,
			name: "user",
			description: "The user to DM",
			required: true,
		},
		{
			type: ApplicationCommandOptionType.String,
			name: "message",
			description: "The message to send",
			required: true,
		},
	],
	roleWhitelist: [ids.roles.staff],
	async execute(interaction, getString: GetStringFunction) {
		if (!interaction.inCachedGuild()) return
		await interaction.deferReply()
		const recipient = interaction.options.getUser("user", true),
			recipientDb = await client.getUser(recipient.id),
			message = interaction.options.getString("message", true).replaceAll("\\n", "\n"),
			dm = new EmbedBuilder({
				color: colors.neutral,
				author: getString("incoming", { lang: recipientDb.lang ?? "en" }),
				description: message,
				footer: { text: getString("incomingDisclaimer", { lang: recipientDb.lang ?? "en" }) },
			}),
			randomTip = generateTip()
		await recipient
			.send({ embeds: [dm] })
			.then(async () => {
				const embed = new EmbedBuilder({
					color: colors.success,
					author: { name: "Direct Message" },
					title: `Sent message to ${recipient.tag}`,
					description: message,
					footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
				})
				await interaction.editReply({ embeds: [embed] })
			})
			.catch(async error => {
				const errorEmbed = new EmbedBuilder({
					color: colors.error,
					author: { name: "Direct Message" },
					title: `An error occured while trying to message ${recipient.tag}`,
					description: `${error}`,
					footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
				})
				await interaction.editReply({ embeds: [errorEmbed] })
			})
	},
}

export default command
