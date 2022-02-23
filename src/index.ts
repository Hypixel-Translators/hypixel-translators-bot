import "source-map-support/register"
import process from "node:process"

// Setup dotenv and define client
if (!process.env.MONGO_URL) require("dotenv").config()
import Crowdin from "@crowdin/crowdin-api-client"
import { ActivityType, IntentsBitField, Options, Partials } from "discord.js"

import { HTBClient } from "./lib/dbclient"
import { setup } from "./lib/imports"

export const client = new HTBClient({
		partials: [Partials.User, Partials.Channel, Partials.GuildMember, Partials.Message, Partials.Reaction],
		intents: [
			IntentsBitField.Flags.Guilds,
			IntentsBitField.Flags.GuildMembers,
			IntentsBitField.Flags.GuildVoiceStates,
			IntentsBitField.Flags.GuildMessages,
			IntentsBitField.Flags.GuildMessageReactions,
			IntentsBitField.Flags.GuildScheduledEvents,
			IntentsBitField.Flags.DirectMessages,
			IntentsBitField.Flags.DirectMessageReactions,
		],
		makeCache: Options.cacheWithLimits({
			GuildStickerManager: 0,
		}),
		allowedMentions: { parse: ["roles", "users"] },
		presence: {
			status: process.env.NODE_ENV === "production" ? "online" : "dnd",
			activities: [{ name: "/help", type: ActivityType.Watching }],
		},
	}),
	crowdin = new Crowdin(
		{
			token: process.env.CTOKEN_V2!,
		},
		{
			userAgent: "Hypixel Translators Bot",
		},
	)

// Import commands and events
setup(client)

// Log in
client.login()
