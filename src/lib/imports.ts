import { readdirSync, statSync } from "node:fs"
import { resolve, sep } from "node:path"

import { botLocales, transformBotLocale } from "./util"

import type { HTBClient } from "./dbclient"
import type { ChatInputApplicationCommandData, Snowflake, ChatInputCommandInteraction, ApplicationCommandOptionData } from "discord.js"

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

			command.nameLocalizations ??= {}
			command.descriptionLocalizations ??= {}
			for (const locale of botLocales) {
				const discordLocale = transformBotLocale(locale)
				if (!discordLocale || locale === "en") continue
				try {
					const commandsJson: CommandStrings = require(`../../strings/${locale}/commands.json`)
					if (["Admin", "Staff"].includes(command.category)) continue

					if (!commandsJson.names[command.name]) {
						console.error(`Missing name localization for ${command.name} in ${locale}`)
						continue
					}
					if (!commandsJson.descriptions[command.name]) {
						console.error(`Missing description localization for ${command.name} in ${locale}`)
						continue
					}
					command.nameLocalizations[discordLocale] = commandsJson.names[command.name]
					command.descriptionLocalizations[discordLocale] = commandsJson.descriptions[command.name]

					function assignLocalisation(option: ApplicationCommandOptionData, optionJson: CommandOption) {
						option.nameLocalizations ??= {}
						option.descriptionLocalizations ??= {}

						if (!optionJson.name) {
							console.error(`Missing option name localization for ${command.name}'s ${option.name} option in ${locale}`)
							return
						}
						if (!optionJson.description) {
							console.error(`Missing option description localization for ${command.name}'s ${option.name} option in ${locale}`)
							return
						}
						option.nameLocalizations[discordLocale!] = optionJson.name
						option.descriptionLocalizations[discordLocale!] = optionJson.description

						if ("choices" in option) {
							if (!optionJson.choices) {
								console.error(`Missing option choices localization for ${command.name}'s ${option.name} option in ${locale}`)
								return
							}
							for (const choice of option.choices ?? []) {
								if (!optionJson.choices![choice.value]) {
									console.error(
										`Missing option choice localization for ${command.name}'s ${option.name} option's ${choice.value} choice in ${locale}`,
									)
									return
								}
								choice.nameLocalizations ??= {}
								choice.nameLocalizations[discordLocale!] = optionJson.choices![choice.value]
							}
						}

						if ("options" in option) for (const subOption of option.options ?? []) assignLocalisation(subOption, optionJson.options![subOption.name])
					}

					for (const option of command.options ?? []) {
						if (!commandsJson.options[command.name]) {
							console.error(`Missing option localization for ${command.name} in ${locale}`)
							return
						}
						if (!commandsJson.options[command.name][option.name]) {
							console.error(`Missing option localization for ${command.name}'s ${option.name} option in ${locale}`)
							return
						}

						assignLocalisation(option, commandsJson.options[command.name][option.name])
					}
				} catch (err) {
					console.error(`Failed to load command localization for ${locale} for command ${command.name}: ${err}`)
					continue
				}
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

export interface CommandStrings {
	names: { [command: string]: string }
	descriptions: { [command: string]: string }
	options: {
		[command: string]: {
			[option: string]: CommandOption
		}
	}
}

export interface CommandOption {
	name: string
	description: string
	choices?: { [choice: string]: string }
	options?: { [option: string]: CommandOption }
}
