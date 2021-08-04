//Setup dotenv and define client
if (!process.env.MONGO_URL) require("dotenv").config()
import "source-map-support/register"
import Discord from "discord.js"
import { HTBClient } from "./lib/dbclient"
export const client = new HTBClient({
    partials: ["USER", "CHANNEL", "GUILD_MEMBER", "MESSAGE", "REACTION"],
    intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MEMBERS,
        Discord.Intents.FLAGS.GUILD_VOICE_STATES,
        Discord.Intents.FLAGS.GUILD_MESSAGES,
        Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Discord.Intents.FLAGS.DIRECT_MESSAGES,
        Discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS
    ],
    allowedMentions: { parse: ["roles", "users"], repliedUser: false },
    presence: {
        status: process.env.NODE_ENV === "production" ? "online" : "dnd",
        activities: [{ name: "/help", type: "WATCHING" }]
    }
})
//Import commands and events
import { setup } from "./lib/imports"
setup(client)

//Command interface
export interface Command extends Discord.ApplicationCommandData {
    cooldown?: number
    allowDM?: true
    allowTip?: false
    dev?: true
    roleWhitelist?: Discord.Snowflake[]
    roleBlacklist?: Discord.Snowflake[]
    channelBlacklist?: Discord.Snowflake[]
    channelWhitelist?: Discord.Snowflake[]
    categoryWhitelist?: Discord.Snowflake[]
    categoryBlacklist?: Discord.Snowflake[]
    category?: string
    execute(interaction: Discord.CommandInteraction, getString?: GetStringFunction): Promise<any>
}

export type GetStringFunction = (path: string, variables?: { [key: string]: string | number } | string, cmd?: string, lang?: string) => any

//Log in
client.login(process.env.DISCORD_TOKEN)
