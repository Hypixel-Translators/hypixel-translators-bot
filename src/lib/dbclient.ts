import Discord from "discord.js"
import { MongoClient, Db } from 'mongodb'
const url = process.env.mongo_URL
if (!url) throw "mongo_URL not in .env"
const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true })

var db: Db

async function init() {
    try {
        await client.connect()
        console.log("Connected to MongoDB!")
        db = client.db(process.env.db_name)
    } catch { return process.exit(1) }
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
    execute: Function
}

export class HTBClient extends Discord.Client {
    db: Db = db
    commands: Discord.Collection<string, Command> = new Discord.Collection()
    cooldowns: Discord.Collection<string, Discord.Collection<string, number>> = new Discord.Collection()
    async getUser(id: string) {
        let user = await this.db.collection("users").findOne({ id: id })
        if (!user) {
            this.db.collection("users").insertOne({ id: id, lang: "en", profile: "", uuid: "" })
            user = await this.db.collection("users").findOne({ id: id })
        }
        return user
    }

}