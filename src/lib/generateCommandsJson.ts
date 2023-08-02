import { writeFileSync } from "node:fs"

import { client } from "../index"

import type { CommandOption, CommandStrings } from "./imports"
import type { ApplicationCommandOptionData } from "discord.js"

const result: CommandStrings = { names: {}, descriptions: {}, options: {} }

for (const command of client.commands
	.sort((a, b) => a.name.localeCompare(b.name))
	.filter(c => !["Admin", "Staff"].includes(c.category!))
	.values()) {
	result.names[command.name] = command.name
	result.descriptions[command.name] = command.description
	if (command.options) {
		result.options[command.name] = {}
		applyOptionsData(result.options[command.name], command.options)
	}
}

writeFileSync("./strings/en/commands.json", JSON.stringify(result, null, "\t"))
console.log("Successfully regenerated the commands.json file")

function applyOptionsData(obj: { [option: string]: CommandOption }, options: readonly ApplicationCommandOptionData[]) {
	for (const option of options) {
		Object.defineProperty(obj, option.name, { value: {}, enumerable: true })
		Object.defineProperties(obj[option.name], {
			name: { value: option.name, enumerable: true },
			description: { value: option.description, enumerable: true },
		})
		if ("choices" in option) {
			// The choices property can be an array or an object so we use Object.defineProperty to avoid TS being angry
			Object.defineProperty(obj[option.name], "choices", {
				value: option.choices!.some(c => isNaN(Number(c.value))) ? {} : [],
				enumerable: true,
			})
			for (const choice of option.choices ?? []) obj[option.name].choices![choice.value] = choice.name
		}
		if ("options" in option) {
			obj[option.name].options = {}
			applyOptionsData(obj[option.name].options!, option.options ?? [])
		}
	}
	return obj
}
