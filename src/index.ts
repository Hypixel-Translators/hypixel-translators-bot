//Setup dotenv and define client
import "dotenv/config"
import "source-map-support/register"
import Discord from "discord.js"
import { HTBClient } from "./lib/dbclient"
export const client = new HTBClient({ partials: ["USER", "CHANNEL", "GUILD_MEMBER", "MESSAGE", "REACTION"], intents: ["GUILDS", "GUILD_MEMBERS", "GUILD_INTEGRATIONS", "GUILD_VOICE_STATES", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS", "DIRECT_MESSAGES", "DIRECT_MESSAGE_REACTIONS"] })
//Import commands and events
import { setup } from "./lib/imports"
setup(client)

//Command interface
export interface Command extends Discord.ApplicationCommandData {
    usage: string,
    cooldown?: number,
    allowDM?: true,
    allowTip?: false,
    roleWhitelist?: string[],
    roleBlacklist?: string[],
    channelWhitelist?: string[],
    dev?: true,
    category?: string,
    execute(interaction: Discord.CommandInteraction, lang?: string): Promise<any>
}

//Log in
client.login(process.env.DISCORD_TOKEN)
