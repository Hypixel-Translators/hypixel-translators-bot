import process from "node:process"
// Cannot use promisified setTimeout here
import { setTimeout } from "node:timers"

import { Collection, Formatters, GuildChannel, Message, Embed, TextChannel } from "discord.js"

import { colors, ids } from "../config.json"
import { client } from "../index"
import handleAutocompleteInteractions from "../interactions/autocomplete"
import handleButtonInteractions from "../interactions/buttons"
import { db, DbUser, cancelledEvents } from "../lib/dbclient"
import { arrayEqual, transformDiscordLocale, generateTip, Stats } from "../lib/util"

import type { Command } from "../lib/imports"
client.on("interactionCreate", async interaction => {
	if (!db) return void cancelledEvents.push({ listener: "interactionCreate", args: [interaction] })
	if (interaction.user.bot) return
	let command: Command | null = null
	const author: DbUser = await client.getUser(interaction.user.id),
		member = interaction.client.guilds.cache.get(ids.guilds.main)!.members.cache.get(interaction.user.id)!,
		randomTip = generateTip(getString),
		statsColl = db.collection<Stats>("stats")

	if (interaction.isButton() && interaction.inCachedGuild()) return void (await handleButtonInteractions(interaction, getString))
	else if (interaction.isAutocomplete()) return void (await handleAutocompleteInteractions(interaction))

	if (!interaction.isChatInputCommand()) return

	command = client.commands.get(interaction.commandName)!

	// Log if command is ran in DMs
	if (interaction.channel?.isDMBased()) console.log(`${interaction.user.tag} used command ${interaction.commandName} in DMs`)

	// Return if user is not verified
	if (!member?.roles.cache.has(ids.roles.verified) && command.name !== "verify")
		return void (await interaction.reply({ content: "You must be verified to do this!", ephemeral: true }))

	let allowed = true

	// Channel Blacklist and whitelist systems
	if (interaction.channel instanceof GuildChannel) {
		if (command.categoryBlacklist && command.categoryBlacklist.includes(interaction.channel!.parentId!)) allowed = false
		else if (command.channelBlacklist && command.channelBlacklist.includes(interaction.channelId)) allowed = false
		else if (command.categoryWhitelist && !command.categoryWhitelist.includes(interaction.channel!.parentId!)) allowed = false
		else if (command.channelWhitelist && !command.channelWhitelist.includes(interaction.channelId)) allowed = false
	}

	// Give perm to admins and return if not allowed
	if (member.roles.cache.has(ids.roles.admin)) allowed = true
	if (!allowed) {
		await statsColl.insertOne({ type: "COMMAND", name: command.name, user: interaction.user.id, error: true, errorMessage: "noPermission" })
		await interaction.reply({ content: getString("errors.noPermission", { file: "global" }), ephemeral: true })
		return
	}

	// Cooldown system
	if (!client.cooldowns.has(command.name)) client.cooldowns.set(command.name, new Collection())
	const now = Date.now(),
		timestamps = client.cooldowns.get(command.name)!,
		cooldownAmount = (command.cooldown ?? 0) * 1000
	if (timestamps.has(interaction.user.id) && interaction.channelId !== ids.channels.botDev) {
		const expirationTime = timestamps.get(interaction.user.id)! + cooldownAmount
		if (now < expirationTime) {
			await statsColl.insertOne({ type: "COMMAND", name: command.name, user: interaction.user.id, error: true, errorMessage: "cooldown" })

			const embed = new Embed({
				color: colors.error,
				author: { name: getString("cooldown", { file: "global" }) },
				title: getString("timeLeft", {
					variables: {
						timestamp: `<t:${Math.ceil(expirationTime / 1000)}:R>`,
						command: `\`/${interaction.commandName}\``,
					},
					file: "global",
				}),
				footer: { text: randomTip, iconURL: member.displayAvatarURL({ extension: "png" }) },
			})
			return await interaction.reply({ embeds: [embed], ephemeral: true })
		}
	}

	// Set cooldown if not administrator
	if (!member?.permissions.has("ManageRoles")) {
		timestamps.set(interaction.user.id, now)
		setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount)
	}

	/**
	 * Gets a string or an object of strings for the correct language and replaces all variables if any
	 * @param path Path to the string. Use dots to access strings inside objects
	 * @param options Additional options for getting the string
	 * @param options.variables Object containing all the variables and their corresponding text to be replaced in the string.
	 * @param options.file The name of the file to get strings from. Defaults to the command being ran
	 * @param options.lang The language to get the string from. Defaults to the author's language preference or their Discord locale.
	 * @returns A clean string with all the variables replaced or an object of strings. Will return `null` if the path cannot be found.
	 */
	function getString(
		path: string,
		{
			variables,
			file = command?.name ?? "global",
			lang = author.lang ?? transformDiscordLocale(interaction.locale),
		}: { variables?: Record<string, string | number>; file?: string; lang?: string } = {},
	): // eslint-disable-next-line @typescript-eslint/no-explicit-any
	any {
		let enStrings = require(`../../strings/en/${file}.json`)
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let strings: Record<string, any>
		try {
			strings = require(`../../strings/${lang}/${file}.json`)
		} catch {
			strings = require(`../../strings/en/${file}.json`)
		}
		const pathSplit = path.split(".")
		let string
		pathSplit.forEach(pathPart => {
			if (pathPart) {
				let jsonElement
				if (strings[pathPart]) jsonElement = strings[pathPart]
				else jsonElement = enStrings[pathPart]

				if (typeof jsonElement === "object" && pathSplit.indexOf(pathPart) !== pathSplit.length - 1) {
					// Check if the string isn't an object nor the end of the path
					if (strings[pathPart]) strings = strings[pathPart]
					enStrings = enStrings[pathPart]
				} else {
					string = strings[pathPart]
					if (
						!string ||
						(typeof string === "string" && !arrayEqual(string.match(/%%\w+%%/g)?.sort(), enStrings[pathPart].match(/%%\w+%%/g)?.sort()))
					) {
						string = enStrings[pathPart] // If the string hasn't been added yet or if the variables changed
						if (!string) {
							string = null // In case of fire
							if (command!.category !== "Admin" && command!.category !== "Staff" && !path.includes(" "))
								console.error(`Couldn't get string ${path} in English for ${file}, please fix this`)
						}
					}
					if (typeof string === "string" && variables)
						for (const [variable, text] of Object.entries(variables)) string = string.replace(`%%${variable}%%`, String(text))
				}
			} else if (strings) string = strings
			else string = enStrings
		})
		return string
	}

	// Run command and handle errors
	try {
		// Run the command
		await command.execute(interaction, getString)

		// Store usage stats
		await statsColl.insertOne({ type: "COMMAND", name: command.name, user: interaction.user.id })
	} catch (error) {
		// Store usage stats
		await statsColl.insertOne({ type: "COMMAND", name: command.name, user: interaction.user.id, error: true, errorMessage: `${error}` })

		if (!error.stack) error = getString(`errors.${error}`, { file: "global" }) ?? error

		// Send error to bot-dev channel
		if (error.stack) {
			if (process.env.NODE_ENV === "production") {
				const embed = new Embed({
					color: colors.error,
					author: { name: "Unexpected error!" },
					title: error.toString().substring(0, 255),
					description: Formatters.codeBlock(error.stack.substring(0, 2_047)),
					footer: { text: "Check the console for more details" },
				})
				await (interaction.client.channels.cache.get(ids.channels.botDev) as TextChannel).send({
					content: `<:aaaAAAAAAAAAAARGHGFGGHHHHHHHHHHH:831565459421659177> ERROR INCOMING, PLEASE FIX <@!${ids.users.rodry}>\nRan by: ${
						interaction.user
					}\nCommand: \`${interaction}\`\nChannel: ${
						!interaction.channel?.isDMBased() && interaction.channel ? interaction.channel : "DM"
					}\nTime: <t:${Math.round(Date.now() / 1000)}:F>`,
					embeds: [embed],
				})
			}
			console.error(
				`Unexpected error with command ${interaction.commandName} on channel ${
					interaction.channel instanceof GuildChannel ? interaction.channel.name : interaction.channel!.type
				} executed by ${interaction.user.tag}. Here's the error:\n${error.stack}`,
			)
		}

		// Handle errors
		timestamps.delete(interaction.user.id)
		const embed = new Embed({
			color: colors.error,
			author: { name: getString("error", { file: "global" }) },
			title: (error.message ?? error).substring(0, 255),
			footer: { text: randomTip, iconURL: member.displayAvatarURL({ extension: "png" }) },
		})

		// Deferred is true and replied is false when an interaction is deferred, therefore we need to check for this first
		if (interaction.deferred) {
			const errorMsg = (await interaction.editReply({ embeds: [embed], components: [] })) as Message
			setTimeout(async () => {
				if (!interaction.ephemeral) await errorMsg.delete().catch(() => null)
			}, 10_000)
		} else if (!interaction.replied) await interaction.reply({ embeds: [embed], ephemeral: !error.stack, components: [] })
		else {
			await interaction.followUp({ embeds: [embed], ephemeral: !error.stack, components: [] }).catch(async err => {
				await interaction.channel!.send({ embeds: [embed], components: [] })
				console.error("Couldn't send a followUp on a replied interaction, here's the error", err)
			})
		}
	}
})
