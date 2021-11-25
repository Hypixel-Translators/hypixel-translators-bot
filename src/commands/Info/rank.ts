import { GuildMember, MessageEmbed } from "discord.js"
import { client } from "../../index"
import { colors, ids } from "../../config.json"
import { db, DbUser } from "../../lib/dbclient"
import { generateTip, getXpNeeded } from "../../lib/util"

import type { Command, GetStringFunction } from "../../lib/imports"

const command: Command = {
	name: "rank",
	description: "Gives you the current xp for yourself or any given user.",
	options: [{
		type: "USER",
		name: "user",
		description: "The user to get the rank for",
		required: false
	}],
	cooldown: 30,
	channelWhitelist: [ids.channels.bots, ids.channels.staffBots, ids.channels.botDev],
	allowDM: true,
	async execute(interaction, getString: GetStringFunction) {
		const randomTip = generateTip(getString),
			collection = db.collection<DbUser>("users"),
			user = interaction.options.getUser("user", false) ?? interaction.user,
			member = interaction.member as GuildMember | null ?? interaction.user

		const userDb = await client.getUser(user.id)
		if (!userDb.levels) {
			const errorEmbed = new MessageEmbed()
				.setColor(colors.error)
				.setAuthor(getString("moduleName"))
				.setTitle(user.id === interaction.user.id ? getString("youNotRanked") : getString("userNotRanked"))
				.setDescription(getString("howRank"))
				.setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))
			return await interaction.reply({ embeds: [errorEmbed] })
		}
		const totalXp = getXpNeeded(userDb.levels.level),
			progressBar = generateProgressBar(userDb.levels.levelXp, totalXp),
			ranking = (await collection.find({}, { sort: { "levels.totalXp": -1, "id": 1 } }).toArray()).map(u => u.id).indexOf(user.id) + 1,
			currentXp = userDb.levels.levelXp,
			messageCount = userDb.levels.messageCount

		let currentXpFormatted: string,
			xpNeededFormatted: string,
			messagesFormatted: string

		if (currentXp >= 1_000_000) currentXpFormatted = `${(currentXp / 1_000_000).toFixed(2)}${getString("million")}`
		else if (currentXp >= 1000) currentXpFormatted = `${(currentXp / 1000).toFixed(2)}${getString("thousand")}`
		else currentXpFormatted = `${currentXp}`

		if (totalXp >= 1_000_000) xpNeededFormatted = `${(totalXp / 1_000_000).toFixed(2)}${getString("million")}`
		else if (totalXp >= 1000) xpNeededFormatted = `${(totalXp / 1000).toFixed(2)}${getString("thousand")}`
		else xpNeededFormatted = `${totalXp}`

		if (messageCount >= 1_000_000) messagesFormatted = `${(messageCount / 1_000_000).toFixed(2)}${getString("million")}`
		else if (messageCount >= 1000) messagesFormatted = `${(messageCount / 1000).toFixed(2)}${getString("thousand")}`
		else messagesFormatted = `${messageCount}`

		const embed = new MessageEmbed()
			.setColor(colors.neutral)
			.setAuthor(getString("moduleName"))
			.setTitle(user.id === interaction.user.id ? getString("yourRank") : getString("userRank", { user: user.tag }))
			.setDescription(user.id === interaction.user.id ? getString("youLevel", { level: userDb.levels.level, rank: ranking }) : getString("userLevel", { user: String(user), level: userDb.levels.level, rank: ranking }))
			.addField(getString("textProgress", { currentXp: currentXpFormatted, xpNeeded: xpNeededFormatted, messages: messagesFormatted }), progressBar)
			.setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))
		await interaction.reply({ embeds: [embed] })
	}
}

function generateProgressBar(current: number, goal: number, places = 10): string {
	const progressEmoji = "<:progress_done:820405383935688764>",
		leftEmoji = "<:progress_left:820405406906974289>"
	if (isNaN(current) || isNaN(goal)) return leftEmoji.repeat(places) + "\u200b"

	const progressFixed = Math.round((current / goal) * places),
		leftFixed = places - progressFixed

	//Apparently leftFixed can be negative and progressFixed can be bigger than 10, so let's not do that
	return progressEmoji.repeat(progressFixed > 10 ? 10 : progressFixed) + leftEmoji.repeat(leftFixed < 0 ? 0 : leftFixed) + "\u200b" //add a blank char at the end to prevent huge emojis on android
}

export default command
