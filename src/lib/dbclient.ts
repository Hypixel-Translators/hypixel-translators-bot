import Discord from "discord.js"
import { MongoClient, Db } from "mongodb"
import { Command } from "../index"
const url = process.env.MONGO_URL
if (!url) throw "MONGO_URL not in .env"
export const mongoClient = new MongoClient(url)

export let db: Db

async function init() {
    return new Promise<MongoClient>((resolve, reject) => {
        mongoClient.connect()
            .then(mongoClient => {
                db = mongoClient.db(process.env.DB_NAME)
                console.log("Connected to MongoDB!")
                resolve(mongoClient)
            })
            .catch(reject)
    })
}

init()

export interface DbUser {
    id: Discord.Snowflake
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

export class HTBClient extends Discord.Client {
    commands: Discord.Collection<string, Command> = new Discord.Collection()
    cooldowns: Discord.Collection<string, Discord.Collection<Discord.Snowflake, number>> = new Discord.Collection()
    async getUser(): Promise<undefined>
    async getUser(id: Discord.Snowflake): Promise<DbUser>
    async getUser(id?: Discord.Snowflake): Promise<DbUser | undefined> {
        if (!id) return
        let user = await db.collection("users").findOne({ id: id }) as DbUser | undefined
        while (!user) {
            await db.collection("users").insertOne({ id: id, lang: "en" })
            user = await db.collection("users").findOne({ id: id }) as DbUser
        }
        return user
    }
}
