import { type GuildMember, EmbedBuilder, ApplicationCommandOptionType, Colors, type ComponentType } from "discord.js"

import { ids } from "../../config.json"
import { createButtonControls, generateTip, splitArray } from "../../lib/util"

import type { Command } from "../../lib/imports"

const command: Command = {
	name: "members",
	description: "Lists all the members in a role",
	options: [
		{
			type: ApplicationCommandOptionType.Role,
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

		const maxMembersArr = splitArray(tags, 85) // 89 is max for now

		let { color } = role
		if (!color) color = Colors.Blurple
		if (maxMembersArr.length > 1) {
			let page = 0,
				pageEmbed = updatePage(maxMembersArr[page], page + 1),
				controlButtons = createButtonControls(page, maxMembersArr)
			const msg = await interaction.reply({ embeds: [pageEmbed], components: [controlButtons], fetchReply: true }),
				collector = msg.createMessageComponentCollector<ComponentType.Button>({
					idle: 60_000,
					filter: buttonInteraction => interaction.user.id === buttonInteraction.user.id,
				})

			collector.on(
				"ignore",
				async buttonInteraction =>
					void (await buttonInteraction.reply({
						content: `You cannot interact with this menu! Execute /${this.name} yourself to do this.`,
						ephemeral: true,
					}))
			)

			collector.on("collect", async buttonInteraction => {
				switch (buttonInteraction.customId) {
					case "first":
						page = 0
						break
					case "last":
						page = maxMembersArr.length - 1
						break
					case "previous":
						page = Math.max(page - 1, 0)
						break
					case "next":
						page = Math.min(page + 1, maxMembersArr.length - 1)
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
				return new EmbedBuilder({
					color,
					author: { name: "Members list" },
					title: `Here are all the ${tags.length} members with the ${role.name} role on the server at the moment.`,
					description: membersArr.join(", "),
					footer: {
						text: `${page ? `Page ${page}/${maxMembersArr.length}` : generateTip()}`,
						iconURL: member.displayAvatarURL({ extension: "png" }),
					},
				})
			} else {
				return new EmbedBuilder({
					color,
					author: { name: "Members list" },
					title: `There are no members with the ${role.name} role on the server at the moment.`,
					footer: { text: generateTip(), iconURL: member.displayAvatarURL({ extension: "png" }) },
				})
			}
		}
	},
}

export default command
