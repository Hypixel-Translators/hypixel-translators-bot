import { client, Command } from "../index"
import { db, DbUser, cancelledEvents } from "../lib/dbclient"
import Discord from "discord.js"
import { errorColor } from "../config.json"
import fs from "node:fs"
import { arrayEqual, generateTip, Stats } from "../lib/util"

client.on("interactionCreate", async interaction => {
	if (!db) {
		cancelledEvents.push({ listener: "interactionCreate", args: [interaction] })
		return
	}

	let command: Command | null = null
	const author: DbUser = await client.getUser(interaction.user.id),
		member = interaction.client.guilds.cache.get("549503328472530974")?.members.cache.get(interaction.user.id)!,
		randomTip = generateTip(getString),
		statsColl = db.collection<Stats>("stats")
	if (interaction.isButton() && !interaction.user.bot) {
		// Staff LOA warning removal system
		if (interaction.channelId === "836748153122324481" && interaction.customId == "done") {
			if ((interaction.message as Discord.Message).mentions.users.first()!.id !== interaction.user.id) {
				await interaction.reply({ content: "You can only remove your own LOA warning!", ephemeral: true })
				return
			}
			const endDateRaw = (interaction.message as Discord.Message).embeds[0].fields[1].value.split("/"),
				endDate = new Date(Number(endDateRaw[2]), Number(endDateRaw[1]) - 1, Number(endDateRaw[0]))
			if (endDate.getTime() > Date.now()) {
				await interaction.reply({ content: "You can't end this LOA yet! If something changed, please contact the admins.", ephemeral: true })
				return
			} else {
				await (interaction.message as Discord.Message).delete()
				await interaction.reply({ content: "Successfully deleted this LOA! **Welcome back!**", ephemeral: true })
				return
			}
		} else if (interaction.channelId === "762341271611506708") {
			// Self-roles system
			let roleId: Discord.Snowflake
			if (interaction.customId === "polls") roleId = "646098170794868757" //Polls
			else if (interaction.customId === "botUpdates") roleId = "732615152246980628" //Bot Updates
			else if (interaction.customId === "giveaways") {
				const userDb = await client.getUser(interaction.user.id)
				if ((userDb.levels?.level ?? 0) < 5) {
					console.log(`${member.user.tag} tried to get the Giveaway pings role but they're level ${userDb.levels?.level ?? 0} lol`)
					return await interaction.reply({
						content: getString("roles.noLevel", { level: 5, command: "`/rank`", channel: "<#549894938712866816>" }),
						ephemeral: true
					})
				}
				roleId = "801052623745974272" //Giveaway pings
			} else return
			if (member.roles.cache.has(roleId)) {
				await member.roles.remove(roleId, "Clicked the button in server-info")
				await interaction.reply({ content: getString("roles.successTake", { role: `<@&${roleId}>` }), ephemeral: true })
				console.log(`Took the ${interaction.guild!.roles.cache.get(roleId)!.name} role from ${interaction.user.tag}`)
			} else {
				await member.roles.add(roleId, "Clicked the button in server-info")
				await interaction.reply({ content: getString("roles.successGive", { role: `<@&${roleId}>` }), ephemeral: true })
				console.log(`Gave the ${interaction.guild!.roles.cache.get(roleId)!.name} role to ${interaction.user.tag}`)
			}
		}
	}
	if (!interaction.isCommand() || interaction.user.bot) return

	command = client.commands.get(interaction.commandName)!

	//Log if command is ran in DMs
	if (interaction.channel?.type === "DM") console.log(`${interaction.user.tag} used command ${interaction.commandName} in DMs`)

	//Return if user is not verified
	if (!member?.roles.cache.has("569194996964786178") && command.name !== "verify") { //Verified
		await interaction.reply({ content: "You must be verified to do this!", ephemeral: true })
		return
	}

	let allowed = true

	//Channel Blacklist and whitelist systems
	if (interaction.channel instanceof Discord.GuildChannel) {
		if (command.categoryBlacklist && command.categoryBlacklist.includes(interaction.channel!.parentId!)) allowed = false
		else if (command.channelBlacklist && command.channelBlacklist.includes(interaction.channelId)) allowed = false
		else if (command.categoryWhitelist && !command.categoryWhitelist.includes(interaction.channel!.parentId!)) allowed = false
		else if (command.channelWhitelist && !command.channelWhitelist.includes(interaction.channelId)) allowed = false
	}

	//Give perm to admins and return if not allowed
	if (member.roles.cache.has("764442984119795732")) allowed = true //Discord Administrator
	if (!allowed) {
		await statsColl.insertOne({ type: "COMMAND", name: command.name, user: interaction.user.id, error: true, errorMessage: "noAccess" })
		await interaction.reply({ content: getString("errors.noAccess", "global"), ephemeral: true })
		return
	}

	//Cooldown system
	if (!client.cooldowns.has(command.name)) client.cooldowns.set(command.name, new Discord.Collection())
	const now = Date.now(),
		timestamps = client.cooldowns.get(command.name)!,
		cooldownAmount = (command.cooldown || 3) * 1000
	if (timestamps.has(interaction.user.id) && interaction.channelId !== "730042612647723058") { //bot-development
		const expirationTime = timestamps.get(interaction.user.id)! + cooldownAmount
		if (now < expirationTime) {
			await statsColl.insertOne({ type: "COMMAND", name: command.name, user: interaction.user.id, error: true, errorMessage: "cooldown" })

			const timeLeft = Math.ceil((expirationTime - now) / 1000),
				embed = new Discord.MessageEmbed()
					.setColor(errorColor as Discord.HexColorString)
					.setAuthor(getString("cooldown", "global"))
					.setTitle(
						getString(
							timeLeft >= 120 ? "minsLeftT" : timeLeft === 1 ? "secondLeft" : "timeLeftT",
							{
								time: timeLeft >= 120 ? Math.ceil(timeLeft / 60) : timeLeft,
								command: `/${interaction.commandName}`
							},
							"global"
						)
					)
					.setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))
			return await interaction.reply({ embeds: [embed], ephemeral: true })
		}
	}

	//Set cooldown if not administrator
	if (!member?.permissions.has("MANAGE_ROLES")) {
		timestamps.set(interaction.user.id, now)
		setTimeout(() => {
			timestamps.delete(interaction.user.id)
		}, cooldownAmount)
	}

	/**
	 * Gets a string or an object of strings for the correct language and replaces all variables if any
	 * @param {string} path Path to the string. Use dots to access strings inside objects
	 * @param {Object} [variables] Object containing all the variables and their corresponding text to be replaced in the string.
	 * @param {string} [file] The name of the file to get strings from. Defaults to the command being ran
	 * @param {string} [lang] The language to get the string from. Defaults to the author's language preference.
	 * @returns A clean string with all the variables replaced or an object of strings. Will return `null` if the path cannot be found.
	 */
	function getString(
		path: string,
		variables?: { [key: string]: string | number } | string,
		file = command?.name ?? "global",
		lang = author.lang ?? "en"
	): any {
		if (typeof variables === "string") {
			const languages = fs.readdirSync("./strings")
			lang = languages.includes(file) ? file : author.lang ?? "en"
			file = variables
		}
		let enStrings = require(`../../strings/en/${file}.json`)
		let strings: any
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
					//check if the string isn't an object nor the end of the path
					if (strings[pathPart]) strings = strings[pathPart]
					enStrings = enStrings[pathPart]
					return
				} else {
					string = strings[pathPart]
					if (!string || (typeof string === "string" && !arrayEqual(string.match(/%%\w+%%/g)?.sort(), enStrings[pathPart].match(/%%\w+%%/g)?.sort()))) {
						string = enStrings[pathPart] //if the string hasn't been added yet or if the variables changed
						if (!string) {
							string = null //in case of fire
							if (command!.category != "Admin" && command!.category != "Staff" && !path.includes(" "))
								console.error(`Couldn't get string ${path} in English for ${file}, please fix this`)
						}
					}
					if (typeof string === "string" && variables) {
						for (const [variable, text] of Object.entries(variables)) {
							string = string.replace(`%%${variable}%%`, String(text))
						}
					}
				}
			} else if (strings) string = strings
			else string = enStrings
		})
		return string
	}

	//Run command and handle errors
	try {
		// Run the command
		await command.execute(interaction, getString)

		//Store usage stats
		await statsColl.insertOne({ type: "COMMAND", name: command.name, user: interaction.user.id })
	} catch (error) {
		//Store usage stats
		await statsColl.insertOne({ type: "COMMAND", name: command.name, user: interaction.user.id, error: true, errorMessage: `${error}` })

		if (!error.stack) error = getString(`errors.${error}`, "global") || error

		// Send error to bot-dev channel
		if (error.stack) {
			if (process.env.NODE_ENV === "production") {
				const embed = new Discord.MessageEmbed()
					.setColor(errorColor as Discord.HexColorString)
					.setAuthor("Unexpected error!")
					.setTitle(error.toString().substring(0, 255))
					.setDescription(`\`\`\`${error.stack.substring(0, 2_047)}\`\`\``)
					.setFooter("Check the console for more details")
				await (interaction.client.channels.cache.get("730042612647723058") as Discord.TextChannel).send({ //bot-development
					content: `<:aaaAAAAAAAAAAARGHGFGGHHHHHHHHHHH:831565459421659177> ERROR INCOMING, PLEASE FIX <@!240875059953139714>\nRan by: ${interaction.user}\nCommand: ${interaction.commandName}\nChannel: ${interaction.channel?.type !== "DM" && interaction.channel ? interaction.channel : "DM"}\nTime: <t:${Math.round(Date.now() / 1000)}:F>`,
					embeds: [embed]
				}) //Rodry
			}
			console.error(
				`Unexpected error with command ${interaction.commandName} on channel ${interaction.channel instanceof Discord.GuildChannel ? interaction.channel.name : interaction.channel!.type
				} executed by ${interaction.user.tag}. Here's the error:\n${error.stack}`
			)
		}

		//Handle errors
		timestamps.delete(interaction.user.id)
		const embed = new Discord.MessageEmbed()
			.setColor(errorColor as Discord.HexColorString)
			.setAuthor(getString("error", "global"))
			.setTitle(error.message?.substring(0, 255) || error.toString().substring(0, 255))
			.setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))

		//Deferred is true and replied is false when an interaction is deferred, therefore we need to check for this first
		if (interaction.deferred) {
			const errorMsg = await interaction.editReply({ embeds: [embed], components: [] }) as Discord.Message
			setTimeout(async () => {
				if (!errorMsg.deleted) await errorMsg.delete()
			}, 10000)
		} else if (!interaction.replied) await interaction.reply({ embeds: [embed], ephemeral: !error.stack, components: [] })
		else if (interaction.replied) await interaction.followUp({ embeds: [embed], ephemeral: !error.stack, components: [] })
			.catch(async err => {
				await interaction.channel!.send({ embeds: [embed], components: [] })
				console.error("Couldn't send a followUp on a replied interaction, here's the error", err)
			})
		else console.error("Couldn't send the error for some weird reason, here's some data to help you", interaction)
	}
})
