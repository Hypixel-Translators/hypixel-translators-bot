import { Client, ClientEvents, Collection, Snowflake } from "discord.js"
import { MongoClient, Db, WithId } from "mongodb"
import { client } from "../index"

import type { Command } from "./imports"

const url = process.env.MONGO_URL
if (!url) throw "MONGO_URL not in .env"
export const mongoClient = new MongoClient(url)
export const cancelledEvents: EventData<keyof ClientEvents>[] = []
export let db: Db

async function init() {
	return new Promise<MongoClient>(async (resolve, reject) => {
		await mongoClient.connect()
			.then(mongoClient => {
				db = mongoClient.db(process.env.DB_NAME)
				console.log("Connected to MongoDB!")
				//If the connection was made after the client was ready, we need to emit the event again
				if (client.isReady()) client.emit("ready", client)
				for (const event of cancelledEvents) client.emit(event.listener, ...event.args)
				if (cancelledEvents.length) console.log(`Emitted the following cancelled events: ${cancelledEvents.map(e => e.listener).join(", ")}`)
				resolve(mongoClient)
			})
			.catch(reject)
	})
}

init()

export interface DbUser {
	id: Snowflake
	lang: string
	profile?: string | null
	uuid?: string
	levels?: {
		level: number
		totalXp: number
		levelXp: number
		messageCount: number
	}
	staffMsgTimestamp?: number
	unverifiedTimestamp?: number
}

interface EventData<T extends keyof ClientEvents> {
	listener: T
	args: ClientEvents[T]
}

export class HTBClient extends Client<true> {
	commands: Collection<string, Command> = new Collection()
	cooldowns: Collection<string, Collection<Snowflake, number>> = new Collection()
	async getUser(): Promise<null>
	async getUser(id: Snowflake): Promise<WithId<DbUser>>
	async getUser(id?: Snowflake) {
		if (!id) return null
		const collection = db.collection<DbUser>("users")
		let user = await collection.findOne({ id: id })
		while (!user) {
			await collection.insertOne({ id: id, lang: "en" })
			user = await collection.findOne({ id: id })
		}
		return user
	}
}
