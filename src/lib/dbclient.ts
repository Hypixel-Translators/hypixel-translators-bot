import Discord from "discord.js"
import { MongoClient, Db } from 'mongodb'
import { Command } from "../index"
const url = process.env.MONGO_URL
if (!url) throw "MONGO_URL not in .env"
const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true })

export let db: Db

async function init() {
    return new Promise<MongoClient>((resolve, reject) => {
        client.connect()
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
    id: string,
    lang: string,
    profile?: string,
    uuid?: string,
    levels: {
        level: number,
        totalXp: number,
        levelXp: number,
        messageCount: number
    },
    staffMsgTimestamp?: number
}

export class HTBClient extends Discord.Client {
    commands: Discord.Collection<string, Command> = new Discord.Collection()
    cooldowns: Discord.Collection<string, Discord.Collection<string, number>> = new Discord.Collection()
    async getUser(id: string) {
        let user = await db.collection("users").findOne({ id: id })
        if (!user) {
            await db.collection("users").insertOne({ id: id, lang: "en" })
            return await db.collection("users").findOne({ id: id })
        }
        return user
    }

}