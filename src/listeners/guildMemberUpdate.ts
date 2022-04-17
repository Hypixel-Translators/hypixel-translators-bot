import { EmbedBuilder, GuildMember, PartialGuildMember, TextChannel } from "discord.js"

import { colors, ids } from "../config.json"
import { client } from "../index"

client.on("guildMemberUpdate", async (oldMember, newMember) => {
	// Prefix validation
	if (!newMember.manageable) return
	if (newMember.nickname && /\[.*\]/g.test(newMember.nickname) && oldMember.nickname !== newMember.nickname) {
		// \u2620 is the unicode for the skull emoji, the other pattern is for letter emojis
		const flagRegex = /\[(?:(?:\uD83C[\uDDE6-\uDDFF]){2}|\u2620)((-(?:(?:\uD83C[\uDDE6-\uDDFF]){2}|\u2620))?)+\]/,
			chineseRegex = /\[(?:(?:CS|CT)-?)+\]/

		if (flagRegex.test(newMember.nickname)) return
		if (newMember.roles.cache.some(r => r.name.startsWith("Chinese "))) {
			if (chineseRegex.test(newMember.nickname)) return
			if (oldMember.nickname && (chineseRegex.test(oldMember.nickname) || flagRegex.test(oldMember.nickname)))
				await sendRevertAlert(oldMember, newMember)
			else await sendRemoveAlert(oldMember, newMember)
		} else if (oldMember.nickname && flagRegex.test(oldMember.nickname)) await sendRevertAlert(oldMember, newMember)
		else await sendRemoveAlert(oldMember, newMember)
	}
})

async function sendRevertAlert(oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) {
	const embed = new EmbedBuilder({
			color: colors.error,
			author: { name: "Received a message from staff" },
			description: `Hey there!\nWe noticed you changed your nickname to include a new prefix, however it didn't comply with our rule about nicknames (rule 4).\nWe've reset your nickname back to the old one, however, if you'd like, you can fix your new nickname (${newMember.nickname}) and apply it again. If you have any questions or believe this is a bug, please contact the staff team.`,
		}),
		staffEmbed = new EmbedBuilder({
			color: colors.loading,
			title: "Member nickname reverted",
			description: `I noticed that ${newMember}'s new nickname: \`${newMember.nickname}\` didn't follow our rules, so I reverted it back to \`${oldMember.nickname}\`. Make sure this is correct and, if it isn't, feel free to undo.`,
			timestamp: Date.now(),
		}),
		staffBots = client.channels.cache.get(ids.channels.staffBots) as TextChannel
	await newMember.setNickname(oldMember.nickname)
	await newMember
		.send({ embeds: [embed] })
		.then(async () => {
			await staffBots.send({ embeds: [staffEmbed] })
			console.log(`DM'd ${newMember.user.tag} with a message about their nickname being reverted.`)
		})
		.catch(async () => {
			staffEmbed.setFooter({ text: "Couldn't send DM!" }).setColor(colors.error)
			await staffBots.send({ embeds: [staffEmbed] })
			console.log(`Couldn't ${newMember.user.tag} with a message about their nickname being reverted.`)
		})
}

async function sendRemoveAlert(oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) {
	const embed = new EmbedBuilder({
			color: colors.error,
			author: { name: "Received a message from staff" },
			description:
				"Hey there!\nWe noticed your nickname included a prefix but didn't include country flags nor allowed language codes (rule 4).\nDue to this, we've reset your nickname entirely. If you have any questions or believe this is a bug, please contact the staff team.",
		}),
		staffEmbed = new EmbedBuilder({
			color: colors.loading,
			title: "Member nickname removed",
			description: `I noticed that ${newMember}'s new nickname: \`${newMember.nickname}\` didn't follow our rules, and neither did their old one (${oldMember.nickname}), so I removed their nickname entirely. Make sure this is correct and, if it isn't, feel free to undo.`,
			timestamp: Date.now(),
		}),
		staffBots = client.channels.cache.get(ids.channels.staffBots) as TextChannel
	await newMember.setNickname(null)
	await newMember
		.send({ embeds: [embed] })
		.then(async () => {
			await staffBots.send({ embeds: [staffEmbed] })
			console.log(`DM'd ${newMember.user.tag} with a message about their nicknam being removed.`)
		})
		.catch(async () => {
			staffEmbed.setFooter({ text: "Couldn't send DM!" }).setColor(colors.error)
			await staffBots.send({ embeds: [staffEmbed] })
			console.log(`Couldn't DM ${newMember.user.tag} with a message about their nicknam being removed.`)
		})
}
