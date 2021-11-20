//Setup dotenv and define client
if (!process.env.MONGO_URL) require("dotenv").config()
import "source-map-support/register"
import { Intents, Options } from "discord.js"
import { HTBClient } from "./lib/dbclient"
import { setup } from "./lib/imports"

export const client = new HTBClient({
	partials: ["USER", "CHANNEL", "GUILD_MEMBER", "MESSAGE", "REACTION"],
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MEMBERS,
		Intents.FLAGS.GUILD_VOICE_STATES,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
		Intents.FLAGS.DIRECT_MESSAGES,
		Intents.FLAGS.DIRECT_MESSAGE_REACTIONS
	],
	makeCache: Options.cacheWithLimits({
		GuildStickerManager: 0
	}),
	allowedMentions: { parse: ["roles", "users"] },
	presence: {
		status: process.env.NODE_ENV === "production" ? "online" : "dnd",
		activities: [{ name: "/help", type: "WATCHING" }]
	}
})

//Import commands and events
setup(client)

//Log in
client.login(process.env.DISCORD_TOKEN)
