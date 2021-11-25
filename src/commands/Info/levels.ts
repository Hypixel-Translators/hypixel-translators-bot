import { CommandInteraction, GuildMember, Message, MessageActionRow, MessageButton, MessageEmbed } from "discord.js"
import { client } from "../../index"
import { colors, ids } from "../../config.json"
import { db, DbUser } from "../../lib/dbclient"
import { generateTip, updateButtonColors } from "../../lib/util"

import type { Command, GetStringFunction } from "../../lib/imports"

const command: Command = {
	name: "levels",
	description: "Shows you the XP leaderboard",
	options: [{
		type: "BOOLEAN",
		name: "me",
		description: "Whether to start at the page you appear in. Has priority over the \"page\" argument.",
		required: false
	},
	{
		type: "INTEGER",
		name: "page",
		description: "The leaderboard page to get",
		required: false
	}],
	cooldown: 60,
	channelWhitelist: [ids.channels.bots, ids.channels.staffBots, ids.channels.botDev],
	allowDM: true,
	async execute(interaction, getString: GetStringFunction) {
		const randomTip = generateTip(getString),
			member = interaction.member as GuildMember | null ?? interaction.user,
			collection = db.collection<DbUser>("users"),
			allUsers = await collection.find({}, { sort: { "levels.totalXp": -1, "id": 1 } }).toArray(),
			inputMe = interaction.options.getBoolean("me", false),
			inputPage = interaction.options.getInteger("page", false)

		const pages: DbUser[][] = [] // inner arrays are of length 24
		let p = 0
		while (p < allUsers.length) pages.push(allUsers.slice(p, p += 24)) //Max number of fields divisible by 3

		let page = 0
		if (inputMe) page = pages.indexOf(pages.find(p => p.some(u => u.id === interaction.user.id))!)
		else if (inputPage) page = inputPage - 1

		if (page >= pages.length || page < 0) {
			const embed = new MessageEmbed()
				.setColor(colors.error)
				.setAuthor(getString("moduleName"))
				.setTitle(getString("pageTitle"))
				.setDescription(getString("pageNotExist"))
				.setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))
			return await interaction.reply({ embeds: [embed] })
		} else {
			let controlButtons = new MessageActionRow()
				.addComponents(
					new MessageButton()
						.setStyle("SUCCESS")
						.setEmoji("⏮️")
						.setCustomId("first")
						.setLabel(getString("pagination.first", "global")),
					new MessageButton()
						.setStyle("SUCCESS")
						.setEmoji("◀️")
						.setCustomId("previous")
						.setLabel(getString("pagination.previous", "global")),
					new MessageButton()
						.setStyle("SUCCESS")
						.setEmoji("▶️")
						.setCustomId("next")
						.setLabel(getString("pagination.next", "global")),
					new MessageButton()
						.setStyle("SUCCESS")
						.setEmoji("⏭️")
						.setCustomId("last")
						.setLabel(getString("pagination.last", "global"))
				),
				pageEmbed: MessageEmbed = fetchPage(page, pages, getString, interaction)

			controlButtons = updateButtonColors(controlButtons, page, pages)
			const msg = await interaction.reply({ embeds: [pageEmbed], components: [controlButtons], fetchReply: true }) as Message,
				collector = msg.createMessageComponentCollector<"BUTTON">({ idle: this.cooldown! * 1000 })

			collector.on("collect", async buttonInteraction => {
				const userDb: DbUser = await client.getUser(buttonInteraction.user.id)
				if (interaction.user.id !== buttonInteraction.user.id) return await buttonInteraction.reply({ content: getString("pagination.notYours", { command: `/${this.name}` }, "global", userDb.lang), ephemeral: true })
				else if (buttonInteraction.customId === "first") page = 0
				else if (buttonInteraction.customId === "last") page = pages.length - 1
				else if (buttonInteraction.customId === "previous") {
					page--
					if (page < 0) page = 0
				}
				else if (buttonInteraction.customId === "next") {
					page++
					if (page > pages.length - 1) page = pages.length - 1
				}
				pageEmbed = fetchPage(page, pages, getString, interaction)
				controlButtons = updateButtonColors(controlButtons, page, pages)
				await buttonInteraction.update({ embeds: [pageEmbed], components: [controlButtons] })
			})

			collector.on("end", async () => {
				controlButtons.components.forEach(button => button.setDisabled(true))
				await interaction.editReply({ content: getString("pagination.timeOut", { command: `\`/${this.name}\`` }, "global"), components: [controlButtons] })
			})
		}

	}
}

function fetchPage(page: number, pages: DbUser[][], getString: GetStringFunction, interaction: CommandInteraction) {
	if (page > pages.length - 1) page = pages.length - 1
	if (page < 0) page = 0
	const pageEmbed = new MessageEmbed()
		.setColor(colors.neutral)
		.setAuthor(getString("moduleName"))
		.setTitle(getString("pageTitle"))
		.setFooter(
			getString("pagination.page", { number: page + 1, total: pages.length }, "global"),
			(interaction.member as GuildMember | null ?? interaction.user).displayAvatarURL({ format: "png", dynamic: true })
		)
	for (let i = 0; i <= pages[page].length - 1; i++) {
		// const user = interaction.client.users.cache.get(pages[page][i].id)! //Get the user if we ever decide to change that
		if (pages[page][i].levels) {
			const totalXp = pages[page][i].levels!.totalXp
			let formattedXp: string
			if (totalXp >= 1000000) formattedXp = `${(totalXp / 1000000).toFixed(2)}${getString("million")}`
			else if (totalXp >= 1000) formattedXp = `${(totalXp / 1000).toFixed(2)}${getString("thousand")}`
			else formattedXp = totalXp.toString()
			pageEmbed.addField(
				getString("level", {
					rank: i + 1 + page * 24,
					level: pages[page][i].levels!.level,
					xp: formattedXp
				}),
				`<@!${pages[page][i].id}>${pages[page][i].id === interaction.user.id ? ` - **${getString("youIndicator")}**` : ""}`,
				true
			)
		} else
			pageEmbed.addField(
				getString("unranked", { rank: i + 1 + page * 24 }),
				`<@!${pages[page][i].id}>${pages[page][i].id === interaction.user.id ? ` - **${getString("youIndicator")}**` : ""}`,
				true
			)
	}
	return pageEmbed
}

export default command
