import Discord from "discord.js"
import { Command } from "../../index"
import { errorColor, successColor } from "../../config.json"
import { db } from "../../lib/dbclient"
import { PunishmentLog, updateButtonColors, updateModlogFields } from "../../lib/util"

const command: Command = {
	name: "modlogs",
	description: "Shows you a user's past infractions",
	options: [{
		type: "USER",
		name: "user",
		description: "The user to see the modlogs for",
		required: true
	}],
	roleWhitelist: ["768435276191891456"], //Discord Staff
	channelWhitelist: ["624881429834366986", "551693960913879071"], //staff-bots admin-bots
	async execute(interaction) {
		const userInput = interaction.options.getUser("user", true),
			modlogs: PunishmentLog[] = await db.collection("punishments").find({ id: userInput.id }, { sort: { timestamp: -1 } }).toArray()

		if (!modlogs.length) {
			const embed = new Discord.MessageEmbed()
				.setColor("BLURPLE")
				.setAuthor("Modlogs")
				.setTitle(`Couldn't find any modlogs for ${userInput.tag}`)
				.setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
			await interaction.reply({ embeds: [embed], ephemeral: true })
		} else if (modlogs.length === 1) {
			const embed = new Discord.MessageEmbed()
				.setColor(successColor as Discord.HexColorString)
				.setAuthor("Log message", "", `https://discord.com/channels/549503328472530974/800820574405656587/${modlogs[0].logMsg}`)
				.setTitle(`Found 1 modlog for ${userInput.tag}`)
				.setDescription(`Case #${modlogs[0].case}`)
				.setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
			updateModlogFields(embed, modlogs[0])
			await interaction.reply({ embeds: [embed] })
		} else {
			const embed = new Discord.MessageEmbed()
				.setColor(successColor as Discord.HexColorString)
				.setAuthor("Log message", "", `https://discord.com/channels/549503328472530974/800820574405656587/${modlogs[0].logMsg}`)
				.setTitle(`Found ${modlogs.length} modlogs for ${userInput.tag}`)
				.setDescription(`Case #${modlogs[0].case}`)
				.setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true })),
				controlButtons = new Discord.MessageActionRow()
					.addComponents(
						new Discord.MessageButton()
							.setEmoji("⏮️")
							.setCustomId("first")
							.setLabel("First log"),
						new Discord.MessageButton()
							.setEmoji("◀️")
							.setCustomId("previous")
							.setLabel("Previous log"),
						new Discord.MessageButton()
							.setEmoji("▶️")
							.setCustomId("next")
							.setLabel("Next log"),
						new Discord.MessageButton()
							.setEmoji("⏭️")
							.setCustomId("last")
							.setLabel("Last log")
					)
			let log = 0
			updateButtonColors(controlButtons, log, modlogs)
			updateModlogFields(embed, modlogs[0], modlogs)

			const msg = await interaction.reply({ embeds: [embed], components: [controlButtons], fetchReply: true }) as Discord.Message,
				collector = msg.createMessageComponentCollector({ idle: 60_000 })

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
