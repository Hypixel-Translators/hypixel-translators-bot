import { ColorResolvable, GuildMember, MessageActionRow, MessageButton, MessageEmbed } from "discord.js"
import { ids } from "../../config.json"
import { generateTip, updateButtonColors } from "../../lib/util"

import type { Command } from "../../lib/imports"

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
		if (!interaction.inCachedGuild()) return
		const role = interaction.options.getRole("role", true),
			tags: GuildMember[] = [],
			member = interaction.member

		role.members.forEach(member => tags.push(member))

		const maxMembersArr: GuildMember[][] = []
		let p = 0
		while (p < tags.length)
			maxMembersArr.push(tags.slice(p, p += 85)) //89 is max for now

		let color: ColorResolvable = role.hexColor
		if (color === "#000000") color = "BLURPLE"
		if (maxMembersArr.length > 1) {
			let page = 0,
				pageEmbed = updatePage(maxMembersArr[page], page),
				controlButtons = new MessageActionRow({
					components: [
						new MessageButton({
							style: "SECONDARY",
							emoji: "⏮️",
							customId: "first",
							label: "First page",
							disabled: true
						}),
						new MessageButton({
							style: "SUCCESS",
							emoji: "◀️",
							customId: "previous",
							label: "Previous page",
						}),
						new MessageButton({
							style: "SUCCESS",
							emoji: "▶️",
							customId: "next",
							label: "Next page",
						}),
						new MessageButton({
							style: "SECONDARY",
							emoji: "⏭️",
							customId: "last",
							label: "Last page",
							disabled: true
						})
					]
				})
			const msg = await interaction.reply({ embeds: [pageEmbed], components: [controlButtons], fetchReply: true }),
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

		function updatePage(membersArr: GuildMember[], page?: number) {
			if (membersArr?.length) {
				return new MessageEmbed({
					color,
					author: { name: "Members list" },
					title: `Here are all the ${tags.length} members with the ${role.name} role on the server at the moment.`,
					description: membersArr.join(", "),
					footer: { text: `${page !== undefined ? `Page ${page + 1}/${maxMembersArr.length}` : generateTip()}`, iconURL: member.displayAvatarURL({ format: "png", dynamic: true }) }
				})
			} else {
				return new MessageEmbed({
					color,
					author: { name: "Members list" },
					title: `There are no members with the ${role.name} role on the server at the moment.`,
					footer: { text: generateTip(), iconURL: member.displayAvatarURL({ format: "png", dynamic: true }) }
				})
			}
		}
	}
}

export default command
