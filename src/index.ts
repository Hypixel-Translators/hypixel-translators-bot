//Setup dotenv and define client
import "dotenv/config"
import "source-map-support/register"
import Discord from "discord.js"
import { HTBClient } from "./lib/dbclient"
export const client = new HTBClient({ partials: ["USER", "CHANNEL", "GUILD_MEMBER", "MESSAGE", "REACTION"], intents: ["GUILD_MEMBERS", "GUILD_INTEGRATIONS", "GUILD_VOICE_STATES", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS", "DIRECT_MESSAGES", "DIRECT_MESSAGE_REACTIONS"] })

//Import commands and events
import { setup } from "./lib/imports"
setup(client)

//Command interface
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
    execute(message: Discord.Message, args: string[], getString: (path: string, variables?: { [key: string]: string | number } | string, cmd?: string, lang?: string) => any): any
}

//Log in
client.login(process.env.DISCORD_TOKEN)
