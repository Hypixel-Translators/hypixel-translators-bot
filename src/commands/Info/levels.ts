import { ChatInputCommandInteraction, GuildMember, Message, MessageActionRow, MessageButton, MessageEmbed } from "discord.js"

import { colors, ids } from "../../config.json"
import { client } from "../../index"
import { db, DbUser } from "../../lib/dbclient"
import { generateTip, parseToNumberString, transformDiscordLocale, updateButtonColors } from "../../lib/util"

import type { Command, GetStringFunction } from "../../lib/imports"

const command: Command = {
	name: "levels",
	description: "Shows you the XP leaderboard",
	options: [
		{
			type: "BOOLEAN",
			name: "me",
			description: 'Whether to start at the page you appear in. Has priority over the "page" argument.',
			required: false,
		},
		{
			type: "INTEGER",
			name: "page",
			description: "The leaderboard page to get",
			required: false,
		},
	],
	cooldown: 60,
	channelWhitelist: [ids.channels.bots, ids.channels.staffBots, ids.channels.botDev],
	allowDM: true,
	async execute(interaction, getString: GetStringFunction) {
		const allUsers = await db
				.collection<DbUser>("users")
				.find({}, { sort: { "levels.totalXp": -1, id: 1 } })
				.toArray(),
			inputMe = interaction.options.getBoolean("me", false),
			inputPage = interaction.options.getInteger("page", false),
			pages: DbUser[][] = [] // Inner arrays are of length 24
		let n = 0
		while (n < allUsers.length) pages.push(allUsers.slice(n, (n += 24))) // Max number of fields divisible by 3

		let page = 0
		if (inputMe) page = pages.indexOf(pages.find(p => p.some(u => u.id === interaction.user.id))!)
		else if (inputPage) page = inputPage - 1

		if (page >= pages.length || page < 0) {
			const embed = new MessageEmbed({
				color: colors.error,
				author: { name: getString("moduleName") },
				title: getString("pageTitle"),
				description: getString("pageNotExist"),
				footer: {
					text: generateTip(getString),
					iconURL: ((interaction.member as GuildMember | null) ?? interaction.user).displayAvatarURL({ format: "png", dynamic: true }),
				},
			})
			return await interaction.reply({ embeds: [embed] })
		} else {
			let controlButtons = new MessageActionRow({
					components: [
						new MessageButton({
							style: "SUCCESS",
							emoji: "⏮️",
							customId: "first",
							label: getString("pagination.first", { file: "global" }),
						}),
						new MessageButton({
							style: "SUCCESS",
							emoji: "◀️",
							customId: "previous",
							label: getString("pagination.previous", { file: "global" }),
						}),
						new MessageButton({
							style: "SUCCESS",
							emoji: "▶️",
							customId: "next",
							label: getString("pagination.next", { file: "global" }),
						}),
						new MessageButton({
							style: "SUCCESS",
							emoji: "⏭️",
							customId: "last",
							label: getString("pagination.last", { file: "global" }),
						}),
					],
				}),
				pageEmbed = fetchPage(page, pages, getString, interaction)

			controlButtons = updateButtonColors(controlButtons, page, pages)
			const msg = (await interaction.reply({ embeds: [pageEmbed], components: [controlButtons], fetchReply: true })) as Message,
				collector = msg.createMessageComponentCollector<"BUTTON">({ idle: this.cooldown! * 1000 })

			collector.on("collect", async buttonInteraction => {
				const userDb: DbUser = await client.getUser(buttonInteraction.user.id)
				if (interaction.user.id !== buttonInteraction.user.id) {
					return await buttonInteraction.reply({
						content: getString("pagination.notYours", {
							variables: { command: `/${this.name}` },
							file: "global",
							lang: userDb.lang ?? transformDiscordLocale(buttonInteraction.locale),
						}),
						ephemeral: true,
					})
				} else if (buttonInteraction.customId === "first") page = 0
				else if (buttonInteraction.customId === "last") page = pages.length - 1
				else if (buttonInteraction.customId === "previous") {
					page--
					if (page < 0) page = 0
				} else if (buttonInteraction.customId === "next") {
					page++
					if (page > pages.length - 1) page = pages.length - 1
				}
				pageEmbed = fetchPage(page, pages, getString, interaction)
				controlButtons = updateButtonColors(controlButtons, page, pages)
				await buttonInteraction.update({ embeds: [pageEmbed], components: [controlButtons] })
			})

			collector.on("end", async () => {
				controlButtons.components.forEach(button => button.setDisabled(true))
				await interaction.editReply({
					content: getString("pagination.timeOut", { variables: { command: `\`/${this.name}\`` }, file: "global" }),
					components: [controlButtons],
				})
			})
		}
	},
}

function fetchPage(page: number, pages: DbUser[][], getString: GetStringFunction, interaction: ChatInputCommandInteraction) {
	if (page > pages.length - 1) page = pages.length - 1
	if (page < 0) page = 0
	const pageEmbed = new MessageEmbed({
		color: colors.neutral,
		author: { name: getString("moduleName") },
		title: getString("pageTitle"),
		footer: {
			text: getString("pagination.page", { variables: { number: page + 1, total: pages.length }, file: "global" }),
			iconURL: ((interaction.member as GuildMember | null) ?? interaction.user).displayAvatarURL({ format: "png", dynamic: true }),
		},
	})
	for (let i = 0; i <= pages[page].length - 1; i++) {
		// Get the user if we ever decide to change that
		// const user = interaction.client.users.cache.get(pages[page][i].id)!
		if (pages[page][i].levels) {
			pageEmbed.addField(
				getString("level", {
					variables: {
						rank: i + 1 + page * 24,
						level: pages[page][i].levels!.level,
						xp: parseToNumberString(pages[page][i].levels!.totalXp, getString),
					},
				}),
				`<@!${pages[page][i].id}>${pages[page][i].id === interaction.user.id ? ` - **${getString("youIndicator")}**` : ""}`,
				true,
			)
		} else {
			pageEmbed.addField(
				getString("unranked", { variables: { rank: i + 1 + page * 24 } }),
				`<@!${pages[page][i].id}>${pages[page][i].id === interaction.user.id ? ` - **${getString("youIndicator")}**` : ""}`,
				true,
			)
		}
	}
	return pageEmbed
}

export default command
