import { readdirSync, statSync } from "node:fs"
import { resolve, sep } from "node:path"

import { botLocales, transformBotLocale } from "./util"

import type { HTBClient } from "./dbclient"
import type {
	ChatInputApplicationCommandData,
	Snowflake,
	ChatInputCommandInteraction,
	ApplicationCommandSubGroupData,
	ApplicationCommandSubCommandData,
} from "discord.js"

export function findCommands(dir: string, pattern: string) {
	let results: string[] = []
	readdirSync(dir).forEach(innerPath => {
		innerPath = resolve(dir, innerPath)
		const stat = statSync(innerPath)

		if (stat.isDirectory()) results = results.concat(findCommands(innerPath, pattern))
		else if (stat.isFile() && innerPath.endsWith(pattern)) results.push(innerPath)
	})

	return results
}

export function setup(client: HTBClient) {
	// Set commands
	const cmdFiles = findCommands("./dist/commands", ".js")
	if (cmdFiles.length <= 0) console.log("There are no commands to load...")
	else {
		cmdFiles.forEach(file => {
			const command: Command = require(file).default

			command.category = file.split(sep).at(-2)! as Category

			command.nameLocalizations = {}
			command.descriptionLocalizations = {}

			for (const locale of botLocales) {
				const discordLocale = transformBotLocale(locale)
				if (!discordLocale) continue
				const commandsJson = require(`./strings/${locale}/commands.json`) as CommandStrings
				if (!(command.name in commandsJson.names)) continue // Command is admin or staff only

				command.nameLocalizations[discordLocale] = commandsJson.names[command.name]
				command.descriptionLocalizations[discordLocale] = commandsJson.descriptions[command.name]

				function assignLocalisation(command: Command | ApplicationCommandSubGroupData | ApplicationCommandSubCommandData) {
					if (command.options) {
						for (const option of command.options) {
							option.nameLocalizations = {}
							option.descriptionLocalizations = {}

							option.nameLocalizations[discordLocale!] = commandsJson.options[command.name][option.name].name
							option.descriptionLocalizations[discordLocale!] = commandsJson.options[command.name][option.name].description

							if ("options" in option) assignLocalisation(option)
						}
					}
				}

				assignLocalisation(command)
			}

			client.commands.set(command.name, command)
		})
		console.log(`Loaded ${cmdFiles.length} commands.`)
	}

	// Setup listeners
	const listeners = readdirSync("./dist/listeners").filter(f => f.endsWith(".js"))
	if (listeners.length <= 0) return console.log("There are no events to load...")
	listeners.forEach(file => require(`../listeners/${file}`))
	console.log(`Loaded ${listeners.length} events.`)
}

// Command interface
export interface Command extends ChatInputApplicationCommandData {
	cooldown?: number
	allowDM?: true
	dev?: true
	roleWhitelist?: Snowflake[]
	roleBlacklist?: Snowflake[]
	channelBlacklist?: Snowflake[]
	channelWhitelist?: Snowflake[]
	categoryWhitelist?: Snowflake[]
	categoryBlacklist?: Snowflake[]
	category?: Category
	execute(interaction: ChatInputCommandInteraction, getString?: GetStringFunction): Promise<void>
}

export type Category = "Admin" | "Staff" | "Utility" | "Info"

export type GetStringFunction = (
	path: string,
	options?: { variables?: Record<string, string | number>; file?: string; lang?: string },
) => // eslint-disable-next-line @typescript-eslint/no-explicit-any
any

interface CommandStrings {
	names: {
		[command: string]: string
	}
	descriptions: {
		[command: string]: string
	}
	options: {
		[command: string]: {
			[option: string]: {
				name: string
				description: string
			}
		}
	}
}
