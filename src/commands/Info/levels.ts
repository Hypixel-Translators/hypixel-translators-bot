import { type ChatInputCommandInteraction, type GuildMember, EmbedBuilder, ComponentType, ApplicationCommandOptionType } from "discord.js"

import { colors, ids } from "../../config.json"
import { client } from "../../index"
import { db, DbUser } from "../../lib/dbclient"
import { createButtonControls, generateTip, splitArray, transformDiscordLocale } from "../../lib/util"

import type { Command, GetStringFunction } from "../../lib/imports"

const command: Command = {
	name: "levels",
	description: "Shows you the XP leaderboard",
	options: [
		{
			type: ApplicationCommandOptionType.Boolean,
			name: "me",
			description: 'Whether to start at the page you appear in. Has priority over the "page" argument.',
			required: false,
		},
		{
			type: ApplicationCommandOptionType.Integer,
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
			inputPage = interaction.options.getInteger("page", false),
			pages = splitArray(allUsers, 24) // Inner arrays are of length 24, max number of fields divisible by 3

		let page = 0
		if (interaction.options.getBoolean("me", false)) page = pages.indexOf(pages.find(p => p.some(u => u.id === interaction.user.id))!)
		else if (inputPage) page = inputPage - 1

		if (page >= pages.length || page < 0) {
			const embed = new EmbedBuilder({
				color: colors.error,
				author: { name: getString("moduleName") },
				title: getString("pageTitle"),
				description: getString("pageNotExist"),
				footer: {
					text: generateTip(getString),
					iconURL: ((interaction.member as GuildMember | null) ?? interaction.user).displayAvatarURL({ extension: "png" }),
				},
			})
			return void (await interaction.reply({ embeds: [embed] }))
		} else {
			let controlButtons = createButtonControls(page, pages, { getString }),
				pageEmbed = fetchPage(page, pages, getString, interaction)

			const msg = await interaction.reply({ embeds: [pageEmbed], components: [controlButtons], fetchReply: true }),
				collector = msg.createMessageComponentCollector<ComponentType.Button>({
					idle: this.cooldown! * 1000,
					filter: buttonInteraction => interaction.user.id === buttonInteraction.user.id,
				})

			collector.on("ignore", async buttonInteraction => {
				const userDb = await client.getUser(buttonInteraction.user.id)
				await buttonInteraction.reply({
					content: getString("pagination.notYours", {
						variables: { command: `/${this.name}` },
						file: "global",
						lang: userDb.lang ?? transformDiscordLocale(buttonInteraction.locale),
					}),
					ephemeral: true,
				})
			})

			collector.on("collect", async buttonInteraction => {
				switch (buttonInteraction.customId) {
					case "first":
						page = 0
						break
					case "last":
						page = pages.length - 1
						break
					case "previous":
						page--
						if (page < 0) page = 0
						break
					case "next":
						page++
						if (page >= pages.length) page = pages.length - 1
						break
				}
				pageEmbed = fetchPage(page, pages, getString, interaction)
				controlButtons = createButtonControls(page, pages, { getString })
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
	const pageEmbed = new EmbedBuilder({
		color: colors.neutral,
		author: { name: getString("moduleName") },
		title: getString("pageTitle"),
		footer: {
			text: getString("pagination.page", { variables: { number: page + 1, total: pages.length }, file: "global" }),
			iconURL: ((interaction.member as GuildMember | null) ?? interaction.user).displayAvatarURL({ extension: "png" }),
		},
	})
	for (let i = 0; i <= pages[page].length - 1; i++) {
		// Get the user if we ever decide to change that
		// const user = interaction.client.users.cache.get(pages[page][i].id)!
		if (pages[page][i].levels) {
			pageEmbed.addFields({
				name: getString("level", {
					variables: {
						rank: i + 1 + page * 24,
						level: pages[page][i].levels!.level,
						xp: pages[page][i].levels!.totalXp,
					},
				}),
				value: `<@!${pages[page][i].id}>${pages[page][i].id === interaction.user.id ? ` - **${getString("youIndicator")}**` : ""}`,
				inline: true,
			})
		} else {
			pageEmbed.addFields({
				name: getString("unranked", { variables: { rank: i + 1 + page * 24 } }),
				value: `<@!${pages[page][i].id}>${pages[page][i].id === interaction.user.id ? ` - **${getString("youIndicator")}**` : ""}`,
				inline: true,
			})
		}
	}
	return pageEmbed
}

export default command
