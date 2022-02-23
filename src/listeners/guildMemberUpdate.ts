import { MessageEmbed } from "discord.js"

import { colors } from "../config.json"
import { client } from "../index"

client.on("guildMemberUpdate", async (oldMember, newMember) => {
	// Prefix validation
	if (newMember.nickname && /\[[^\s]*\] ?/g.test(newMember.nickname) && oldMember.nickname !== newMember.nickname) {
		const flagRegex = /\[\uD83C[\uDDE6-\uDDFF]\]/,
			chineseRegex = /\[(?:(?:CS|CT)-?)+\]/

		if (
			(newMember.roles.cache.some(r => r.name.startsWith("Chinese ")) &&
				!chineseRegex.test(newMember.nickname) &&
				oldMember.nickname &&
				chineseRegex.test(oldMember.nickname)) ||
			(!flagRegex.test(newMember.nickname) && oldMember.nickname && flagRegex.test(oldMember.nickname))
		) {
			const embed = new MessageEmbed({
				color: colors.error,
				author: { name: "Received a message from staff" },
				description:
					// TODO reference rule 4
					"Hey there!\nWe noticed you changed your nickname to include a new prefix, however, prefixes must include country flags or language codes only, which yours doesn't.\nWe've reset your nickname back to the old one. If you have any questions or believe this is a bug, please contact the staff team.",
			})
			await newMember.setNickname(oldMember.nickname)
			await newMember.send({ embeds: [embed] })
		} else if (
			(newMember.roles.cache.some(r => r.name.startsWith("Chinese ")) && oldMember.nickname && chineseRegex.test(oldMember.nickname)) ||
			(!flagRegex.test(newMember.nickname) && oldMember.nickname && flagRegex.test(oldMember.nickname))
		) {
			const embed = new MessageEmbed({
				color: colors.error,
				author: { name: "Received a message from staff" },
				description:
					// TODO reference rule 4
					"Hey there!\nWe noticed your nickname included a prefix but didn't include country flags nor language codes.\nDue to this we've reset your nickname entirely. If you have any questions or believe this is a bug, please contact the staff team.",
			})
			await newMember.setNickname(null)
			await newMember.send({ embeds: [embed] })
		}
	}
})
