import { ids } from "../config.json"
import { client } from "../index"
import { db } from "../lib/dbclient"

import type { MongoLanguage, PunishmentLog, Quote } from "../lib/util"
import type { AutocompleteInteraction, GuildMember } from "discord.js"

export default async function handleAutocompleteInteractions(interaction: AutocompleteInteraction) {
	const { name, value } = interaction.options.getFocused(true)
	if (name === "language" && typeof value === "string") {
		const languages = await db.collection<MongoLanguage>("languages").find().toArray(),
			language = languages.find(
				l =>
					l.name.toLowerCase() === value.toLowerCase() ||
					l.code === value.toLowerCase() ||
					l.id.toLowerCase() === value.toLowerCase() ||
					l.id.toLowerCase().replace("-", "") === value.toLowerCase(),
			)
		let results: MongoLanguage[] = []
		// If an exact match is found, only return that
		if (language) {
			return await interaction.respond([
				{ name: language.name, value: interaction.commandName === "mention" ? language.name : language.id.replace("-", "_") },
			])
		}
		// Otherwise find all matching languages, ordered by relevance
		results.push(...languages.filter(l => l.name.toLowerCase().startsWith(value.toLowerCase())))
		results.push(...languages.filter(l => l.code.toLowerCase().startsWith(value.toLowerCase()) && !results.find(r => r.code === l.code)))
		results.push(...languages.filter(l => l.id.toLowerCase().startsWith(value.toLowerCase())))
		results.push(...languages.filter(l => l.id.toLowerCase().replace("-", "").startsWith(value.toLowerCase())))
		results.push(...languages.filter(l => l.name.toLowerCase().includes(value.toLowerCase())))
		results.push(...languages.filter(l => l.code.toLowerCase().includes(value.toLowerCase())))
		results.push(...languages.filter(l => l.id.toLowerCase().includes(value.toLowerCase())))
		results.push(...languages.filter(l => l.id.toLowerCase().replace("-", "").includes(value.toLowerCase())))

		// Remove duplicates
		results = [...new Set(results).values()]

		// Remove certain languages based on the command name
		switch (interaction.commandName) {
			case "mention":
			case "review-strings":
				// Filter out languages available on Hypixel
				results = results.filter(l => l.color)
				break
			case "language":
				results = results.filter(l => l.botLang)
				break
			case "languagestats":
				results = results.filter(l => l.code !== "en")
				break
		}

		// Make sure we only send a maximum of 25 choices
		results.splice(25, languages.length)
		return await interaction.respond(
			results.map(l => ({ name: l.name, value: interaction.commandName === "mention" ? l.name : l.id.replace("-", "_") })),
		)
	} else if (name === "case") {
		const results = (await db.collection<PunishmentLog>("punishments").find().toArray())
			.filter(c => c.case.toString().startsWith(value.toString()))
			.map(c => c.case)
			.sort((a, b) => a - b)
		results.splice(25, results.length)
		return await interaction.respond(results.map(c => ({ name: c.toString(), value: c })))
	} else if (name === "command" && typeof value === "string") {
		if (client.commands.get(value)) return await interaction.respond([{ name: value, value: value }])
		const member =
			(interaction.member as GuildMember | null) ?? client.guilds.resolve(ids.guilds.main)!.members.resolve(interaction.user.id)!
		let results = [
			...new Set(
				client.commands
					.filter(c => c.name.startsWith(value))
					.concat(client.commands.filter(c => c.name.includes(value)))
					.values(),
			),
		]

		// Remove staff and admin roles based on perms
		if (!member.roles.cache.has(ids.roles.admin)) results = results.filter(c => c.category !== "Admin")
		if (!member.roles.cache.has(ids.roles.staff)) results = results.filter(c => c.category !== "Staff")

		// Make sure we only send 25 choices
		results.splice(25, client.commands.size)
		return await interaction.respond(results.map(c => ({ name: c.name, value: c.name })))
	} else if (name === "index" && interaction.commandName === "quote") {
		const results = (await db.collection<Quote>("quotes").find().toArray())
			.filter(q => q.id.toString().startsWith(value.toString()))
			.map(q => q.id)
			.sort((a, b) => a - b)
		results.splice(25, results.length)
		return await interaction.respond(results.map(q => ({ name: q.toString(), value: q })))
	}
}
