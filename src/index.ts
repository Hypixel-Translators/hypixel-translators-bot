//Setup dotenv and define client
import "dotenv/config"
import "source-map-support/register"
import Discord from "discord.js"
import { HTBClient } from "./lib/dbclient"
export const client = new HTBClient({
    partials: ["USER", "CHANNEL", "GUILD_MEMBER", "MESSAGE", "REACTION"],
    intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MEMBERS,
        Discord.Intents.FLAGS.GUILD_INTEGRATIONS,
        Discord.Intents.FLAGS.GUILD_VOICE_STATES,
        Discord.Intents.FLAGS.GUILD_PRESENCES,
        Discord.Intents.FLAGS.GUILD_MESSAGES,
        Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Discord.Intents.FLAGS.DIRECT_MESSAGES,
        Discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS
    ],
    allowedMentions: { parse: ["roles", "users"], repliedUser: false }
})
//Import commands and events
import { setup } from "./lib/imports"
setup(client)

//Command interface
export interface Command {
    name: string
    description: string
    usage: string
    aliases?: string[]
    cooldown?: number
    allowDM?: true
    allowTip?: false
    dev?: true
    roleWhitelist?: string[]
    roleBlacklist?: string[]
    channelBlacklist?: string[]
    channelWhitelist?: string[]
    categoryWhitelist?: string[]
    categoryBlacklist?: string[]
    category?: string
    execute(message: Discord.Message, args: string[], getString: (path: string, variables?: { [key: string]: string | number } | string, cmd?: string, lang?: string) => any): any
}

//Log in
client.login(process.env.DISCORD_TOKEN)
