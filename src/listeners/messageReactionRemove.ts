import { client } from "../index"
import { db, toCallAfterDbInit } from "../lib/dbclient"
import type { EventDb } from "../lib/util"

client.on("messageReactionRemove", async (reaction, user) => {
	const functionBody = async () => {
		if (reaction.message.channel.type !== "DM" && !user.bot) {
			if (reaction.emoji.name === "vote_yes") {
				const eventDb = await db.collection("config").findOne({ name: "event" }) as EventDb
				if (eventDb.ids.includes(reaction.message.id)) {
					const member = reaction.message.guild!.members.cache.get(user.id)
					if (member) await member.roles.remove("863430999122509824") //Event
				}
			}
		}
	}

	if (!db) toCallAfterDbInit.push(functionBody)
	else functionBody()
})
