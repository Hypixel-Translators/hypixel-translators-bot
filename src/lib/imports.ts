import { readdirSync, statSync } from "node:fs"
import { resolve, sep } from "node:path"

import {
	type ChatInputApplicationCommandData,
	type Snowflake,
	type ChatInputCommandInteraction,
	type ApplicationCommandOptionData,
	type LocaleString,
	EmbedBuilder,
	Routes,
} from "discord.js"

import { botLocales, transformBotLocale } from "./util"

import { colors, ids } from "../config.json"

import type { HTBClient } from "./dbclient"

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

const localizationErrors: { command: string; type: "name" | "option"; locale: LocaleString; string: string }[] = [],
	nameRegex = /^[-_\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$/u

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
					if (
						["Admin", "Staff"].includes(command.category) ||
						["names", "descriptions", "options"].some(p => !commandsJson[p as keyof CommandStrings][command.name])
					)
						continue

					if (
						!nameRegex.test(commandsJson.names[command.name]) ||
						commandsJson.names[command.name] !== commandsJson.names[command.name].toLowerCase()
					) {
						localizationErrors.push({ command: command.name, type: "name", locale: discordLocale, string: commandsJson.names[command.name] })
						continue
					}

					command.nameLocalizations[discordLocale] = commandsJson.names[command.name]
					command.descriptionLocalizations[discordLocale] = commandsJson.descriptions[command.name]

					for (const option of command.options ?? []) assignLocalisation(option, commandsJson.options[command.name][option.name], discordLocale)
				} catch (err) {
					console.error(`Failed to load command localization for ${locale} for command ${command.name}:\n`, err)
					continue
				}
			}

			client.commands.set(command.name, command)
		})
		console.log(`Loaded ${cmdFiles.length} commands.`)
	}

	if (localizationErrors.length > 25) {
		console.error(`There were ${localizationErrors.length} localization errors.`, ...localizationErrors)
		client.rest.post(Routes.channelMessages(ids.channels.botDev), {
			body: {
				content: `There were ${localizationErrors.length} errors in the command localization strings. I couldn't send them all here to check the console for more info.`,
			},
		})
	} else if (localizationErrors.length) {
		const embed = new EmbedBuilder({
			color: colors.error,
			title: "Found errors on command localization strings",
			fields: localizationErrors.map(err => ({ name: `${err.locale}: ${err.command}: ${err.type}`, value: err.string })),
			timestamp: Date.now(),
		})
		client.rest.post(Routes.channelMessages(ids.channels.botDev), { body: { embeds: [embed.toJSON()] } })
	}

	// Setup listeners
	const listeners = readdirSync("./dist/listeners").filter(f => f.endsWith(".js"))
	if (listeners.length <= 0) return console.log("There are no events to load...")
	listeners.forEach(file => require(`../listeners/${file}`))
	console.log(`Loaded ${listeners.length} events.`)
}

function assignLocalisation(option: ApplicationCommandOptionData, optionJson: CommandOption, locale: LocaleString) {
	if (!optionJson.name || !optionJson.description) return

	option.nameLocalizations ??= {}
	option.descriptionLocalizations ??= {}

	if (!nameRegex.test(optionJson.name) || optionJson.name !== optionJson.name.toLowerCase()) {
		localizationErrors.push({ command: option.name, type: "option", locale, string: optionJson.name })
		return
	}

	option.nameLocalizations[locale] = optionJson.name
	option.descriptionLocalizations[locale] = optionJson.description

	if ("choices" in option) {
		if (!optionJson.choices) return

		for (const choice of option.choices ?? []) {
			if (!optionJson.choices[choice.value]) continue

			choice.nameLocalizations ??= {}
			choice.nameLocalizations[locale] = optionJson.choices[choice.value]
		}
	}

	if ("options" in option) for (const subOption of option.options ?? []) assignLocalisation(subOption, optionJson.options![subOption.name], locale)
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
