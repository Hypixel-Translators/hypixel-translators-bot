import Discord from "discord.js"
import { MongoClient, Db } from 'mongodb'
const url = process.env.mongo_URL
if (!url) throw "mongo_URL not in .env"
const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true })

export let db: Db

async function init() {
    return new Promise<MongoClient>((resolve, reject) => {
        client.connect()
            .then(mongoClient => {
                db = mongoClient.db(process.env.db_name)
                console.log("Connected to MongoDB!")
                resolve(mongoClient)
            })
            .catch(reject)
    })
}

init()

export interface Command {
    name: string,
    description: string,
    usage: string,
    aliases?: string[],
    cooldown?: number,
    allowDM?: true,
    allowTip?: false,
    dev?: true,
    roleWhitelist?: string[],
    roleBlacklist?: string[],
    channelBlacklist?: string[],
    channelWhitelist?: string[],
    categoryWhitelist?: string[],
    categoryBlacklist?: string[],
    category?: string,
    execute(message: Discord.Message, args: string[], getString: (path: string, cmd?: string, lang?: string) => any): any
}

export class HTBClient extends Discord.Client {
    commands: Discord.Collection<string, Command> = new Discord.Collection()
    cooldowns: Discord.Collection<string, Discord.Collection<string, number>> = new Discord.Collection()
    async getUser(id: string) {
        let user = await db.collection("users").findOne({ id: id })
        if (!user) {
            db.collection("users").insertOne({ id: id, lang: "en" })
            user = await db.collection("users").findOne({ id: id })
        }
        return user
    }

}