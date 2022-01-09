import { ids } from "../config.json"
import { client } from "../index"
import { db, DbUser, cancelledEvents } from "../lib/dbclient"

import type { TextChannel } from "discord.js"

client.on("guildMemberRemove", async member => {
	if (!db) return void cancelledEvents.push({ listener: "guildMemberRemove", args: [member] })

	if (member.guild.id !== ids.guilds.main || member.pending) return
	// Leave message
	await (client.channels.cache.get(ids.channels.joinLeave) as TextChannel).send(`**${member.user!.tag}** just left the server 🙁`)

	// Run if the member who leaves had the Bot Translator/Proofreader/Manager roles
	const botRole = member.roles.cache.find(role => role.name.startsWith("Bot ") && role.id !== ids.roles.botUpdates)
	if (botRole) {
		const memberDb = await client.getUser(member.id),
			managers = client.channels.cache.get(ids.channels.managers) as TextChannel
		if (memberDb.profile) {
			await managers.send({
				content: `${member.user!.tag} had the ${botRole} role and just left the server! Here's their Crowdin profile: ${memberDb.profile}`,
				allowedMentions: { roles: [] },
			})
		} else {
			await managers.send({
				content: `${
					member.user!.tag
				} had the ${botRole} role and just left the server! Unfortunately, their profile wasn't registered on the database.`,
				allowedMentions: { roles: [] },
			})
		}
		console.log(`${member.user!.tag} left and had the ${botRole.name} role`)
	}
	if (!member.user!.bot) await db.collection<DbUser>("users").deleteOne({ id: member.id })
})
