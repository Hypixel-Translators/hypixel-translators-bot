import { readdirSync, statSync } from "node:fs"
import { resolve } from "node:path"

import type { ChatInputApplicationCommandData, Snowflake, CommandInteraction } from "discord.js"
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

export function setup(client: HTBClient) {

	//Set commands
	const cmdFiles = findCommands("./dist/commands", ".js")
	if (cmdFiles.length <= 0) console.log("There are no commands to load...")
	else {
		cmdFiles.forEach(file => {
			const command: Command = require(file).default,
				// Windows uses \ as the path separator, everything else uses /
				pathSplit = file.split(process.platform === "win32" ? "\\" : "/")
			command.category = pathSplit.at(-2)! as "Admin" | "Staff" | "Utility" | "Info"
			client.commands.set(command.name, command)
		})
		console.log(`Loaded ${cmdFiles.length} commands.`)
	}

	//Setup listeners
	const listeners = readdirSync("./dist/listeners").filter(f => f.endsWith(".js"))
	if (listeners.length <= 0) return console.log("There are no events to load...")
	listeners.forEach(file => require(`../listeners/${file}`))
	console.log(`Loaded ${listeners.length} events.`)
}

//Command interface
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
	category?: "Admin" | "Staff" | "Utility" | "Info"
	execute(interaction: CommandInteraction, getString?: GetStringFunction): Promise<any>
}

export type GetStringFunction = (path: string, variables?: { [key: string]: string | number } | string, file?: string, lang?: string) => any
