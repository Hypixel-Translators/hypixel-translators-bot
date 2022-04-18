import { type GuildMember, EmbedBuilder, ApplicationCommandOptionType } from "discord.js"

import { colors, ids } from "../../config.json"
import { client } from "../../index"
import { db, type DbUser } from "../../lib/dbclient"
import { generateProgressBar, generateTip, getXpNeeded, parseToNumberString } from "../../lib/util"

import type { Command, GetStringFunction } from "../../lib/imports"

const command: Command = {
	name: "rank",
	description: "Gives you the current XP for yourself or any given user",
	options: [
		{
			type: ApplicationCommandOptionType.User,
			name: "user",
			description: "The user to get the rank for",
			required: false,
		},
	],
	cooldown: 30,
	channelWhitelist: [ids.channels.bots, ids.channels.staffBots, ids.channels.botDev],
	allowDM: true,
	async execute(interaction, getString: GetStringFunction) {
		const randomTip = generateTip(getString),
			user = interaction.options.getUser("user", false) ?? interaction.user,
			member = (interaction.member as GuildMember | null) ?? interaction.user,
			userDb = await client.getUser(user.id)

		if (!userDb.levels) {
			const errorEmbed = new EmbedBuilder({
				color: colors.error,
				author: { name: getString("moduleName") },
				title: user.id === interaction.user.id ? getString("youNotRanked") : getString("userNotRanked"),
				description: getString("howRank"),
				footer: { text: randomTip, iconURL: member.displayAvatarURL({ extension: "png" }) },
			})
			return void (await interaction.reply({ embeds: [errorEmbed] }))
		}
		const totalXp = getXpNeeded(userDb.levels.level),
			ranking =
				(
					await db
						.collection<DbUser>("users")
						.find({}, { sort: { "levels.totalXp": -1, id: 1 } })
						.toArray()
				)
					.map(u => u.id)
					.indexOf(user.id) + 1,
			embed = new EmbedBuilder({
				color: colors.neutral,
				author: { name: getString("moduleName") },
				title: user.id === interaction.user.id ? getString("yourRank") : getString("userRank", { variables: { user: user.tag } }),
				description:
					user.id === interaction.user.id
						? getString("youLevel", { variables: { level: userDb.levels.level, rank: ranking } })
						: getString("userLevel", { variables: { user: `${user}`, level: userDb.levels.level, rank: ranking } }),
				fields: [
					{
						name: getString("textProgress", {
							variables: {
								currentXp: parseToNumberString(userDb.levels.levelXp, getString),
								xpNeeded: parseToNumberString(totalXp, getString),
								messages: parseToNumberString(userDb.levels.messageCount, getString),
							},
						}),
						value: generateProgressBar(userDb.levels.levelXp, totalXp),
					},
				],
				footer: { text: randomTip, iconURL: member.displayAvatarURL({ extension: "png" }) },
			})
		await interaction.reply({ embeds: [embed] })
	},
}

export default command
