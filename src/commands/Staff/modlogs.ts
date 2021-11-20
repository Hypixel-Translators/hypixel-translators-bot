import { HexColorString, MessageActionRow, MessageButton, MessageEmbed } from "discord.js"
import { successColor, ids } from "../../config.json"
import { db } from "../../lib/dbclient"
import { generateTip, PunishmentLog, updateButtonColors, updateModlogFields } from "../../lib/util"

import type { Command } from "../../lib/imports"

const command: Command = {
	name: "modlogs",
	description: "Shows you a user's past infractions",
	options: [{
		type: "USER",
		name: "user",
		description: "The user to see the modlogs for",
		required: true
	}],
	roleWhitelist: [ids.roles.staff],
	channelWhitelist: [ids.channels.staffBots, ids.channels.adminBots],
	async execute(interaction) {
		if (!interaction.inCachedGuild()) return
		const userInput = interaction.options.getUser("user", true),
			modlogs = await db.collection<PunishmentLog>("punishments").find({ id: userInput.id }, { sort: { timestamp: -1 } }).toArray(),
			randomTip = generateTip()

		if (!modlogs.length) {
			const embed = new MessageEmbed()
				.setColor("BLURPLE")
				.setAuthor("Modlogs")
				.setTitle(`Couldn't find any modlogs for ${userInput.tag}`)
				.setFooter(randomTip, interaction.member.displayAvatarURL({ format: "png", dynamic: true }))
			await interaction.reply({ embeds: [embed] })
		} else if (modlogs.length === 1) {
			const embed = new MessageEmbed()
				.setColor(successColor as HexColorString)
				.setAuthor({ name: "Log message", url: `https://discord.com/channels/549503328472530974/800820574405656587/${modlogs[0].logMsg}` })
				.setTitle(`Found 1 modlog for ${userInput.tag}`)
				.setDescription(`Case #${modlogs[0].case}`)
				.setFooter(randomTip, interaction.member.displayAvatarURL({ format: "png", dynamic: true }))
			updateModlogFields(embed, modlogs[0])
			await interaction.reply({ embeds: [embed] })
		} else {
			const embed = new MessageEmbed()
				.setColor(successColor as HexColorString)
				.setAuthor({ name: "Log message", url: `https://discord.com/channels/549503328472530974/800820574405656587/${modlogs[0].logMsg}` })
				.setTitle(`Found ${modlogs.length} modlogs for ${userInput.tag}`)
				.setDescription(`Case #${modlogs[0].case}`)
				.setFooter(randomTip, interaction.member.displayAvatarURL({ format: "png", dynamic: true })),
				controlButtons = new MessageActionRow()
					.addComponents(
						new MessageButton()
							.setEmoji("⏮️")
							.setCustomId("first")
							.setLabel("First log"),
						new MessageButton()
							.setEmoji("◀️")
							.setCustomId("previous")
							.setLabel("Previous log"),
						new MessageButton()
							.setEmoji("▶️")
							.setCustomId("next")
							.setLabel("Next log"),
						new MessageButton()
							.setEmoji("⏭️")
							.setCustomId("last")
							.setLabel("Last log")
					)
			let log = 0
			updateButtonColors(controlButtons, log, modlogs)
			updateModlogFields(embed, modlogs[0], modlogs)

			const msg = await interaction.reply({ embeds: [embed], components: [controlButtons], fetchReply: true }),
				collector = msg.createMessageComponentCollector<"BUTTON">({ idle: 60_000 })

			collector.on("collect", async buttonInteraction => {
				if (interaction.user.id !== buttonInteraction.user.id) return await buttonInteraction.reply({ content: `You cannot interact with this menu! Execute /${this.name} yourself to do this.`, ephemeral: true })
				else if (buttonInteraction.customId === "first") log = 0
				else if (buttonInteraction.customId === "last") log = modlogs.length - 1
				else if (buttonInteraction.customId === "previous") {
					log--
					if (log < 0) log = 0
				}
				else if (buttonInteraction.customId === "next") {
					log++
					if (log > modlogs.length - 1) log = modlogs.length - 1
				}
				updateButtonColors(controlButtons, log, modlogs)
				updateModlogFields(embed, modlogs[log], modlogs)
				await buttonInteraction.update({ embeds: [embed], components: [controlButtons] })
			})

			collector.on("end", async () => {
				controlButtons.components.forEach(button => button.setDisabled(true))
				await interaction.editReply({
					content: `This menu has timed out. If you wish to use it again, execute \`/${this.name}\`.`,
					embeds: [embed],
					components: [controlButtons]
				})
			})
		}
	}
}

export default command
