import Discord from "discord.js"
import { ids } from "../../config.json"
import type { Command } from "../../index"
import { generateTip, updateButtonColors } from "../../lib/util"

const command: Command = {
	name: "members",
	description: "Lists all the members in a role",
	options: [{
		type: "ROLE",
		name: "role",
		description: "The role to get members for",
		required: true
	}],
	roleWhitelist: [ids.roles.admin],
	channelWhitelist: [ids.channels.staffBots, ids.channels.botDev, ids.channels.adminBots],
	async execute(interaction) {
		const role = interaction.options.getRole("role", true) as Discord.Role,
			tags: Discord.GuildMember[] = [],
			member = interaction.member as Discord.GuildMember

		role.members.forEach(member => tags.push(member))

		const maxMembersArr: Discord.GuildMember[][] = []
		let p = 0
		while (p < tags.length) {
			maxMembersArr.push(tags.slice(p, p += 85)) //89 is max for now
		}

		let color: Discord.ColorResolvable = role.hexColor
		if (color === "#000000") color = "BLURPLE"
		if (maxMembersArr.length > 1) {
			let page = 0,
				pageEmbed = updatePage(maxMembersArr[page], page),
				controlButtons = new Discord.MessageActionRow()
					.addComponents(
						new Discord.MessageButton()
							.setEmoji("⏮️")
							.setCustomId("first")
							.setLabel("First page"),
						new Discord.MessageButton()
							.setEmoji("◀️")
							.setCustomId("previous")
							.setLabel("Previous page"),
						new Discord.MessageButton()
							.setEmoji("▶️")
							.setCustomId("next")
							.setLabel("Next page"),
						new Discord.MessageButton()
							.setEmoji("⏭️")
							.setCustomId("last")
							.setLabel("Last page")
					)
			controlButtons = updateButtonColors(controlButtons, page, maxMembersArr)
			const msg = await interaction.reply({ embeds: [pageEmbed], components: [controlButtons], fetchReply: true }) as Discord.Message,
				collector = msg.createMessageComponentCollector<"BUTTON">({ idle: 60_000 })

			collector.on("collect", async buttonInteraction => {
				if (interaction.user.id !== buttonInteraction.user.id) return await buttonInteraction.reply({ content: `You cannot interact with this menu! Execute /${this.name} yourself to do this.`, ephemeral: true })
				else if (buttonInteraction.customId === "first") page = 0
				else if (buttonInteraction.customId === "last") page = maxMembersArr.length - 1
				else if (buttonInteraction.customId === "previous") {
					page--
					if (page < 0) page = 0
				}
				else if (buttonInteraction.customId === "next") {
					page++
					if (page > maxMembersArr.length - 1) page = maxMembersArr.length - 1
				}
				controlButtons = updateButtonColors(controlButtons, page, maxMembersArr)
				pageEmbed = updatePage(maxMembersArr[page], page)
				await buttonInteraction.update({ embeds: [pageEmbed], components: [controlButtons] })
			})

			collector.on("end", async () => {
				controlButtons.components.forEach(button => button.setDisabled(true))
				await interaction.editReply({ content: `This menu has timed out. If you wish to use it again, execute \`/${this.name}\`.`, embeds: [pageEmbed], components: [controlButtons] })
			})

		} else await interaction.reply({ embeds: [updatePage(maxMembersArr[0])] })

		function updatePage(membersArr: Discord.GuildMember[], page?: number) {
			return new Discord.MessageEmbed()
				.setColor(color)
				.setAuthor("Members list")
				.setTitle(`Here are all the ${tags.length} members with the ${role.name} role on the server at the moment.`)
				.setDescription(membersArr.join(", "))
				.setFooter(`${page !== undefined ? `Page ${page + 1}/${maxMembersArr.length}` : generateTip()}`, member.displayAvatarURL({ format: "png", dynamic: true }))
		}
	}
}

export default command
