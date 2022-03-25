import { ColorResolvable, GuildMember, MessageEmbed } from "discord.js"

import { ids } from "../../config.json"
import { createButtonControls, generateTip } from "../../lib/util"

import type { Command } from "../../lib/imports"

const command: Command = {
	name: "members",
	description: "Lists all the members in a role",
	options: [
		{
			type: "ROLE",
			name: "role",
			description: "The role to get members for",
			required: true,
		},
	],
	roleWhitelist: [ids.roles.admin],
	channelWhitelist: [ids.channels.staffBots, ids.channels.botDev, ids.channels.adminBots],
	async execute(interaction) {
		if (!interaction.inCachedGuild()) return
		const role = interaction.options.getRole("role", true),
			tags: GuildMember[] = [],
			{ member } = interaction

		role.members.forEach(m => tags.push(m))

		const maxMembersArr: GuildMember[][] = []
		let p = 0
		while (p < tags.length) maxMembersArr.push(tags.slice(p, (p += 85))) // 89 is max for now

		let color: ColorResolvable = role.hexColor
		if (color === "#000000") color = "BLURPLE"
		if (maxMembersArr.length > 1) {
			let page = 0,
				pageEmbed = updatePage(maxMembersArr[page], page + 1),
				controlButtons = createButtonControls(page, maxMembersArr)
			const msg = await interaction.reply({ embeds: [pageEmbed], components: [controlButtons], fetchReply: true }),
				collector = msg.createMessageComponentCollector<"BUTTON">({ idle: 60_000 })

			collector.on("collect", async buttonInteraction => {
				if (interaction.user.id !== buttonInteraction.user.id) {
					return await buttonInteraction.reply({
						content: `You cannot interact with this menu! Execute /${this.name} yourself to do this.`,
						ephemeral: true,
					})
				} else if (buttonInteraction.customId === "first") page = 0
				else if (buttonInteraction.customId === "last") page = maxMembersArr.length - 1
				else if (buttonInteraction.customId === "previous") {
					page--
					if (page < 0) page = 0
				} else if (buttonInteraction.customId === "next") {
					page++
					if (page > maxMembersArr.length - 1) page = maxMembersArr.length - 1
				}
				controlButtons = createButtonControls(page, maxMembersArr)
				pageEmbed = updatePage(maxMembersArr[page], page + 1)
				await buttonInteraction.update({ embeds: [pageEmbed], components: [controlButtons] })
			})

			collector.on("end", async () => {
				controlButtons.components.forEach(button => button.setDisabled(true))
				await interaction.editReply({
					content: `This menu has timed out. If you wish to use it again, execute \`/${this.name}\`.`,
					embeds: [pageEmbed],
					components: [controlButtons],
				})
			})
		} else await interaction.reply({ embeds: [updatePage(maxMembersArr[0])] })

		function updatePage(membersArr: GuildMember[], page?: number) {
			if (membersArr?.length) {
				return new MessageEmbed({
					color,
					author: { name: "Members list" },
					title: `Here are all the ${tags.length} members with the ${role.name} role on the server at the moment.`,
					description: membersArr.join(", "),
					footer: {
						text: `${page ? `Page ${page}/${maxMembersArr.length}` : generateTip()}`,
						iconURL: member.displayAvatarURL({ format: "png", dynamic: true }),
					},
				})
			} else {
				return new MessageEmbed({
					color,
					author: { name: "Members list" },
					title: `There are no members with the ${role.name} role on the server at the moment.`,
					footer: { text: generateTip(), iconURL: member.displayAvatarURL({ format: "png", dynamic: true }) },
				})
			}
		}
	},
}

export default command
