import { ApplicationCommandOptionType, Colors, ComponentType, EmbedBuilder } from "discord.js"

import { colors, ids } from "../../config.json"
import { db } from "../../lib/dbclient"
import { createButtonControls, generateTip, PunishmentLog, createModlogEmbed } from "../../lib/util"

import type { Command } from "../../lib/imports"

const command: Command = {
	name: "modlogs",
	description: "Shows you a user's past infractions",
	options: [
		{
			type: ApplicationCommandOptionType.User,
			name: "user",
			description: "The user to see the modlogs for",
			required: true,
		},
	],
	roleWhitelist: [ids.roles.staff],
	channelWhitelist: [ids.channels.staffBots, ids.channels.adminBots],
	async execute(interaction) {
		if (!interaction.inCachedGuild()) return
		const userInput = interaction.options.getUser("user", true),
			modlogs = await db
				.collection<PunishmentLog>("punishments")
				.find({ id: userInput.id }, { sort: { timestamp: -1 } })
				.toArray(),
			randomTip = generateTip()

		if (!modlogs.length) {
			const embed = new EmbedBuilder({
				color: Colors.Blurple,
				author: { name: "Modlogs" },
				title: `Couldn't find any modlogs for ${userInput.tag}`,
				footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
			})
			await interaction.reply({ embeds: [embed] })
		} else if (modlogs.length === 1) {
			const embed = createModlogEmbed(
				{
					color: colors.success,
					author: {
						name: "Log message",
						url: `https://discord.com/channels/${ids.guilds.main}/${ids.channels.punishments}/${modlogs[0].logMsg}`,
					},
					title: `Found 1 modlog for ${userInput.tag}`,
					description: `Case #${modlogs[0].case}`,
					footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
				},
				modlogs[0],
			)
			await interaction.reply({ embeds: [embed] })
		} else {
			let log = 0
			const embedData = {
					color: colors.success,
					author: {
						name: "Log message",
						url: `https://discord.com/channels/${ids.guilds.main}/${ids.channels.punishments}/${modlogs[0].logMsg}`,
					},
					title: `Found ${modlogs.length} modlogs for ${userInput.tag}`,
					description: `Case #${modlogs[0].case}`,
					footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
				},
				controlButtons = createButtonControls(log, modlogs),
				embed = createModlogEmbed(embedData, modlogs[0], modlogs),
				msg = await interaction.reply({ embeds: [embed], components: [controlButtons], fetchReply: true }),
				collector = msg.createMessageComponentCollector<ComponentType.Button>({
					idle: 60_000,
					filter: buttonInteraction => interaction.user.id !== buttonInteraction.user.id,
				})

			collector.on(
				"ignore",
				async buttonInteraction =>
					void (await buttonInteraction.reply({
						content: `You cannot interact with this menu! Execute /${this.name} yourself to do this.`,
						ephemeral: true,
					})),
			)

			collector.on("collect", async buttonInteraction => {
				switch (buttonInteraction.customId) {
					case "first":
						log = 0
						break
					case "last":
						log = modlogs.length - 1
						break
					case "previous":
						log = Math.max(log - 1, 0)
						break
					case "next":
						log = Math.min(log + 1, modlogs.length - 1)
						break
				}

				createModlogEmbed(embedData, modlogs[log], modlogs)
				await buttonInteraction.update({ embeds: [embed], components: [createButtonControls(log, modlogs)] })
			})

			collector.on("end", async () => {
				controlButtons.components.forEach(button => button.setDisabled(true))
				await interaction.editReply({
					content: `This menu has timed out. If you wish to use it again, execute \`/${this.name}\`.`,
					embeds: [embedData],
					components: [controlButtons],
				})
			})
		}
	},
}

export default command
