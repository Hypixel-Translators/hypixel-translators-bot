import process from "node:process"
import { setInterval } from "node:timers"
import { setTimeout } from "node:timers/promises"
import { CronJob } from "cron"
import {
	ApplicationCommand,
	ApplicationCommandPermissionData,
	ChatInputApplicationCommandData,
	GuildApplicationCommandPermissionData,
	MessageEmbed,
	TextChannel
} from "discord.js"
import { client } from "../index"
import { colors, listeningStatuses, watchingStatuses, playingStatuses, ids } from "../config.json"
import stats from "../events/stats"
import inactives from "../events/inactives"
import crowdin from "../events/crowdinverify"
import { db } from "../lib/dbclient"
import { getInviteLink, PunishmentLog, restart } from "../lib/util"

import type { Command } from "../lib/imports"

client.on("ready", async () => {
	//Sometimes the client is ready before connecting to the db, therefore we need to stop the listener if this is the case to prevent errors
	//In dbclient.ts the event is emitted again if the connection is made after the client is ready
	if (!db) return
	console.log(`Logged in as ${client.user.tag}!`)
	const guild = client.guilds.cache.get(ids.guilds.main)!,
		globalCommands = await client.application.commands.fetch()

	//Set guild commands - these don't need checks since they update instantly
	await guild.commands.set(constructGuildCommands())

	if (process.env.NODE_ENV === "production") {
		//Only update global commands in production
		client.commands.filter(c => Boolean(c.allowDM)).forEach(async command => {
			const discordCommand = globalCommands.find(c => c.name === command.name)
			//Chech if the command is published
			if (!discordCommand) {
				await client.application.commands.create(convertToDiscordCommand(command))
				console.log(`Published command ${command.name}!`)
			} else if (!discordCommand.equals(command, true)) {
				await discordCommand.edit(convertToDiscordCommand(command))
				console.log(discordCommand, command, `\nEdited command ${command.name} since changes were found`)
			}
		})

		//Delete commands that have been removed locally
		globalCommands.forEach(async command => {
			if (!client.commands.get(command.name)) {
				await command.delete()
				console.log(`Deleted command ${command.name} as it was deleted locally.`)
			} else if (!client.commands.get(command.name)?.allowDM) {
				await command.delete()
				console.log(`Deleted command ${command.name} globally as it is no longer allowed in DMs`)
			}
		})
	}

	//Update permissions
	await guild.commands.permissions.set({
		fullPermissions: getPermissions(
			Array.from(guild.commands.cache.values()).concat(Array.from(client.application.commands.cache.values()))
		)
	})

	const members = await guild.members.fetch()
	if (members.size < guild.memberCount) {
		console.error("Didn't receive enough members! Restarting...")
		await restart()
	}

	//Change status and run events every minute
	new CronJob("*/1 * * * *", async () => {
		//Get server boosters and staff for the status
		const boostersStaff: string[] = []
		guild?.roles.premiumSubscriberRole?.members.forEach(member => boostersStaff.push(member.displayName.replaceAll(/\[[^\s]*\] ?/g, "").trim()))
		guild?.roles.cache.get(ids.roles.staff)!.members.forEach(member => boostersStaff.push(member.displayName.replaceAll(/\[[^\s]*\] ?/g, "").trim()))
		const pickedUser = boostersStaff[Math.floor(Math.random() * boostersStaff.length)],
			toPick = Math.ceil(Math.random() * 100) //get percentage
		// const statusType = client.user!.presence.activities[0].type

		if (toPick > 66) {
			//Higher than 66%
			const playingStatus = playingStatuses[Math.floor(Math.random() * playingStatuses.length)].replace("RANDOM_USER", pickedUser)
			client.user.setActivity({ name: playingStatus, type: "PLAYING" })
		} else if (toPick <= 66 && toPick > 33) {
			//Between 33% and 66% (inclusive)
			const watchStatus = watchingStatuses[Math.floor(Math.random() * watchingStatuses.length)].replace("RANDOM_USER", pickedUser)
			client.user.setActivity({ name: watchStatus, type: "WATCHING" })
		} else if (toPick <= 33 && toPick > 0) {
			//Between 0% and 33% (inclusive)
			const listenStatus = listeningStatuses[Math.floor(Math.random() * listeningStatuses.length)].replace("RANDOM_USER", pickedUser)
			client.user.setActivity({ name: listenStatus, type: "LISTENING" })
		} else console.error(`Couldn't set the status because the percentage is a weird number: ${toPick}`)

	}).start()
	//Run at 02:00
	new CronJob("0 2 * * *", inactives).start()
	//Run at 03:00
	new CronJob("0 3 * * *", crowdin).start()
	//Run on every 10th minute
	new CronJob("*/10 * * * *", stats).start()

	//Check for active punishments and start a timeout to conclude them
	const punishmentsColl = db.collection<PunishmentLog>("punishments"),
		punishments = await punishmentsColl.find({ ended: false }).toArray()
	for (const punishment of punishments) {
		if (!punishment.endTimestamp) continue
		// The setTimeout function doesn't accept values bigger than the 32-bit signed integer limit, so we need to check for that.
		// Additionally, we restart the bot at least once every 2 days so no punishment will be left unexpired
		if (punishment.type === "MUTE") awaitMute(punishment)
		else if (punishment.type === "BAN") awaitBan(punishment)
		else console.error(`For some reason a ${punishment.type} punishment wasn't expired. Case ${punishment.case}`)
	}

	// restart the bot every 2 days
	setInterval(async () => {
		console.log("Bot has been running for 2 days, restarting...");
		(client.channels.cache.get(ids.channels.botDev) as TextChannel).send("I have been running for 2 days straight, gonna restart...")
		await restart()
	}, 172_800_000)
})

export async function awaitMute(punishment: PunishmentLog) {
	const msLeft = punishment.endTimestamp! - Date.now()
	if (msLeft > 2 ** 31 - 1) return
	await setTimeout(msLeft)
	const guild = client.guilds.cache.get(ids.guilds.main)!,
		punishmentsColl = db.collection<PunishmentLog>("punishments"),
		punishmentsChannel = guild.channels.cache.get(ids.channels.punishments) as TextChannel,
		caseNumber = (await punishmentsColl.estimatedDocumentCount()) + 1,
		member = guild.members.cache.get(punishment.id!),
		user = await client.users.fetch(punishment.id),
		punishmentLog = new MessageEmbed()
			.setColor(colors.success)
			.setAuthor({
				name: `Case ${caseNumber} | Unmute | ${user.tag}`,
				iconURL: (member ?? user).displayAvatarURL({ format: "png", dynamic: true })
			})
			.addFields([
				{ name: "User", value: user.toString(), inline: true },
				{ name: "Moderator", value: client.user.toString(), inline: true },
				{ name: "Reason", value: "Ended" }
			])
			.setFooter(`ID: ${user.id}`)
			.setTimestamp(),
		msg = await punishmentsChannel.send({ embeds: [punishmentLog] })
	await punishmentsColl.bulkWrite([
		{
			updateOne: {
				filter: { case: punishment.case },
				update: {
					$set: {
						ended: true,
						endTimestamp: Date.now()
					}
				}
			}
		},
		{
			insertOne: {
				document: {
					case: caseNumber,
					id: user.id,
					type: "UNMUTE",
					reason: "Ended",
					timestamp: Date.now(),
					moderator: client.user.id,
					logMsg: msg.id
				} as PunishmentLog
			}
		}
	])
	const dmEmbed = new MessageEmbed()
		.setColor(colors.success)
		.setAuthor("Punishment")
		.setTitle(`Your mute on the ${guild.name} has expired.`)
		.setDescription("You will now be able to talk in chats again. If something's wrong, please respond in this DM.")
		.setTimestamp()
	await user.send({ embeds: [dmEmbed] })
		.catch(() => console.log(`Couldn't DM user ${user.tag}, (${user.id}) about their unmute.`))
}

export async function awaitBan(punishment: PunishmentLog) {
	const msLeft = punishment.endTimestamp! - Date.now()
	if (msLeft > 2 ** 31 - 1) return
	await setTimeout(msLeft)
	const guild = client.guilds.cache.get(ids.guilds.main)!,
		punishmentsColl = db.collection<PunishmentLog>("punishments"),
		punishmentsChannel = guild.channels.cache.get(ids.channels.punishments) as TextChannel,
		caseNumber = (await punishmentsColl.estimatedDocumentCount()) + 1,
		user = await guild.bans.remove(punishment.id!, "Punishment ended")
			.catch(err => console.error(`Couldn't unban user with id ${punishment.id}. Here's the error:\n`, err)),
		userFetched = await client.users.fetch(punishment.id).catch(() => null),
		punishmentLog = new MessageEmbed()
			.setColor(colors.success)
			.setAuthor({
				name: `Case ${caseNumber} | Unban | ${userFetched?.tag ?? "Deleted User#0000"}`,
				iconURL: userFetched?.displayAvatarURL({ format: "png", dynamic: true }) ?? client.user.defaultAvatarURL
			})
			.addFields([
				{ name: "User", value: `<@${punishment.id}>`, inline: true },
				{ name: "Moderator", value: client.user.toString(), inline: true },
				{ name: "Reason", value: "Ended" }
			])
			.setFooter(`ID: ${punishment.id}`)
			.setTimestamp()
	if (!user) punishmentLog.setDescription("Couldn't unban user from the server.")
	else {
		const dmEmbed = new MessageEmbed()
			.setColor(colors.success)
			.setAuthor("Punishment")
			.setTitle(`Your ban on the ${guild.name} has expired.`)
			.setDescription("You are welcome to join back using the invite in this message.")
			.setTimestamp()
		await user.send({ content: await getInviteLink(client), embeds: [dmEmbed] })
			.catch(() => console.log(`Couldn't DM user ${userFetched?.tag ?? "Deleted User#0000"}, (${user.id}) about their unban.`))
	}
	const msg = await punishmentsChannel.send({ embeds: [punishmentLog] })
	await punishmentsColl.insertOne({
		case: caseNumber,
		id: punishment.id,
		type: "UNBAN",
		reason: "Ended",
		timestamp: Date.now(),
		moderator: client.user.id,
		logMsg: msg.id
	} as PunishmentLog)
}

function getPermissions(commands: ApplicationCommand[]) {
	const permissions: GuildApplicationCommandPermissionData[] = []
	for (const command of commands) {
		const clientCmd = client.commands.get(command.name)!

		if (clientCmd.dev)
			permissions.push({
				id: command.id,
				permissions: [{
					type: "ROLE",
					id: ids.roles.staff,
					permission: true
				}]
			})
		else {
			const commandPerms: ApplicationCommandPermissionData[] = []
			//Add whitelisted roles
			clientCmd.roleWhitelist?.forEach(id => {
				commandPerms.push({
					type: "ROLE",
					id,
					permission: true
				})
			})
			//Add blacklisted roles
			clientCmd.roleBlacklist?.forEach(id => {
				commandPerms.push({
					type: "ROLE",
					id,
					permission: false
				})
			})
			permissions.push({
				id: command.id,
				permissions: commandPerms
			})
		}
	}
	return permissions
}

function constructGuildCommands() {
	if (process.env.NODE_ENV === "production") return client.commands.filter(c => !c.allowDM).map(convertToDiscordCommand)
	return client.commands
		.filter(command => (command.allowDM && !client.application.commands.cache.find(c => c.name === command.name)?.equals(command, true)) ?? true)
		.map(convertToDiscordCommand)
}

function convertToDiscordCommand(command: Command): ChatInputApplicationCommandData {
	return {
		name: command.name,
		description: command.description,
		defaultPermission: command.roleWhitelist || command.dev ? false : true,
		options: command.options ?? []
	}
}
