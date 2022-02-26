import { Collection, type Message, type Snowflake } from "discord.js"

import { db, type DbUser } from "./dbclient"
import { getXpNeeded, type Stats } from "./util"

import { client } from "../index"

const talkedRecently: Collection<Snowflake, number> = new Collection()

export async function leveling(message: Message) {
	const collection = db.collection<DbUser>("users"),
		now = Date.now(),
		lastMsg = talkedRecently.get(message.author.id)

	if (!lastMsg || lastMsg + 60_000 < now) {
		// If the user talked more than a minute ago or if they haven't talked since the bot started
		const randomXp = Math.floor(Math.random() * 11) + 15, // Random number between 25 and 15. 11 comes from 25-15+1
			userDb = await client.getUser(message.author.id),
			xpNeeded = getXpNeeded(userDb.levels?.level, (userDb.levels?.levelXp ?? 0) + randomXp)

		// If at least one of the values is undefined
		if (isNaN(xpNeeded)) {
			await collection.updateOne(
				{ id: message.author.id },
				{ $inc: { "levels.level": 0, "levels.levelXp": 0, "levels.totalXp": 0, "levels.messageCount": 0 } },
			)
		}
		// If user levels up
		if (xpNeeded <= 0) {
			const result = await collection.findOneAndUpdate(
					{ id: message.author.id },
					{ $inc: { "levels.level": 1, "levels.totalXp": randomXp, "levels.messageCount": 1 }, $set: { "levels.levelXp": -xpNeeded || 0 } },
				),
				newLvl = (result.value!.levels?.level ?? 0) + 1

			await message.reply(`GG ${message.author}, you just advanced to level ${newLvl}! 🎉`)
			await db.collection<Stats>("stats").insertOne({ type: "MESSAGE", name: "lvlUp", value: newLvl, user: message.author.id })
		} else {
			await collection.updateOne(
				{ id: message.author.id },
				{ $inc: { "levels.totalXp": randomXp, "levels.levelXp": randomXp, "levels.messageCount": 1 } },
			)
		}
		talkedRecently.set(message.author.id, now)
		return xpNeeded <= 0
	} else await collection.updateOne({ id: message.author.id }, { $inc: { "levels.messageCount": 1 } })
	return null
}
