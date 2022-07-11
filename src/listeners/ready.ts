import process from "node:process"
import { setInterval } from "node:timers"
import { setTimeout } from "node:timers/promises"

import {
	type ChatInputApplicationCommandData,
	type TextBasedChannel,
	type TextChannel,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ActivityType,
	Colors,
	ButtonStyle,
	Formatters,
} from "discord.js"
import { ObjectId } from "mongodb"
import { schedule } from "node-cron"

import { Poll } from "../commands/Utility/poll"
import { colors, listeningStatuses, watchingStatuses, playingStatuses, ids } from "../config.json"
import crowdin from "../events/crowdinverify"
import inactives from "../events/inactives"
import stats from "../events/stats"
import { client } from "../index"
import { db } from "../lib/dbclient"
import { generateProgressBar, getInviteLink, type PunishmentLog, restart, sendHolidayMessage } from "../lib/util"

import type { Command } from "../lib/imports"

client.on("ready", async () => {
	// Sometimes the client is ready before connecting to the db, therefore we need to stop the listener if this is the case to prevent errors
	// In dbclient.ts the event is emitted again if the connection is made after the client is ready
	if (!db) return
	console.log(`Logged in as ${client.user.tag}!`)
	const guild = client.guilds.cache.get(ids.guilds.main)!,
		globalCommands = await client.application.commands.fetch({ withLocalizations: true }),
		botDev = guild.channels.cache.get(ids.channels.botDev) as TextChannel

	// Set guild commands - these don't need checks since they update instantly
	await guild.commands.set(constructGuildCommands()).catch(async err => {
		const embed = new EmbedBuilder({
			color: colors.error,
			title: "Failed to update guild commands!",
			description: Formatters.codeBlock(err.stack),
			timestamp: Date.now(),
		})
		await botDev.send({ embeds: [embed] })
	})

	if (process.env.NODE_ENV === "production") {
		// Only update global commands in production
		client.commands
			.filter(c => Boolean(c.allowDM))
			.forEach(async command => {
				const discordCommand = globalCommands.find(c => c.name === command.name)
				// Chech if the command is published
				if (!discordCommand) {
					try {
						await client.application.commands.create(convertToDiscordCommand(command))
						console.log(`Published command ${command.name}!`)
					} catch (err) {
						const embed = new EmbedBuilder({
							color: colors.error,
							title: `Failed to create command ${command.name}!`,
							description: Formatters.codeBlock(err.stack),
							timestamp: Date.now(),
						})
						await botDev.send({ embeds: [embed] })
					}
				} else if (!discordCommand.equals(command, true)) {
					try {
						await discordCommand.edit(convertToDiscordCommand(command))
						console.log(discordCommand, command, `\nEdited command ${command.name} since changes were found`)
					} catch (err) {
						const embed = new EmbedBuilder({
							color: colors.error,
							title: `Failed to edit command ${command.name}!`,
							description: Formatters.codeBlock(err.stack),
							timestamp: Date.now(),
						})
						await botDev.send({ embeds: [embed] })
					}
				}
			})

		// Delete commands that have been removed locally
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

	const members = await guild.members.fetch()
	if (members.size < guild.memberCount) {
		console.error("Didn't receive enough members! Restarting...")
		await restart()
	}

	// Change status and run events every minute
	schedule("*/1 * * * *", () => {
		// Get server boosters and staff for the status
		const boostersStaff: string[] = []
		guild?.roles.premiumSubscriberRole?.members.forEach(member =>
			boostersStaff.push(member.displayName.replaceAll(/\[[^\s]*\] ?/g, "").trim()),
		)
		guild?.roles.cache
			.get(ids.roles.staff)!
			.members.forEach(member => boostersStaff.push(member.displayName.replaceAll(/\[[^\s]*\] ?/g, "").trim()))
		const pickedUser = boostersStaff[Math.floor(Math.random() * boostersStaff.length)],
			toPick = Math.ceil(Math.random() * 100) // Get percentage
		// const statusType = client.user!.presence.activities[0].type

		if (toPick > 66) {
			// Higher than 66%
			const playingStatus = playingStatuses[Math.floor(Math.random() * playingStatuses.length)].replace("RANDOM_USER", pickedUser)
			client.user.setActivity({ name: playingStatus, type: ActivityType.Playing })
		} else if (toPick <= 66 && toPick > 33) {
			// Between 33% and 66% (inclusive)
			const watchStatus = watchingStatuses[Math.floor(Math.random() * watchingStatuses.length)].replace("RANDOM_USER", pickedUser)
			client.user.setActivity({ name: watchStatus, type: ActivityType.Watching })
		} else if (toPick <= 33 && toPick > 0) {
			// Between 0% and 33% (inclusive)
			const listenStatus = listeningStatuses[Math.floor(Math.random() * listeningStatuses.length)].replace("RANDOM_USER", pickedUser)
			client.user.setActivity({ name: listenStatus, type: ActivityType.Listening })
		} else console.error(`Couldn't set the status because the percentage is a weird number: ${toPick}`)
	}).start()
	// Run at 02:00
	schedule("0 2 * * *", () => inactives()).start()
	// Run at 03:00
	schedule("0 3 * * *", () => crowdin()).start()
	// Run on every 10th minute
	schedule("*/10 * * * *", () => stats()).start()
	// Holiday messages
	// Easter: midday UTC on a Sunday
	schedule(`0 12 ${easter(new Date().getFullYear()).join(" ")} 0`, () => sendHolidayMessage("easter"))
	// Halloween: 10pm UTC on the 31st of October
	schedule("0 22 31 10 *", () => sendHolidayMessage("halloween"))
	// Christmas: midnight UTC on the 25th of December
	schedule("0 0 25 12 *", () => sendHolidayMessage("christmas"))
	// New Year: midnight UTC on the 1st of January
	schedule("0 0 1 1 *", () => sendHolidayMessage("newYear"))

	// Check for active punishments and start a timeout to conclude them
	const punishments = await db
		.collection<PunishmentLog>("punishments")
		.find({ ended: false, endTimestamp: { $exists: true } })
		.toArray()
	for (const punishment of punishments) {
		if (punishment.type === "MUTE") awaitMute(punishment)
		else if (punishment.type === "BAN") awaitBan(punishment)
		else console.error(`For some reason a ${punishment.type} punishment wasn't expired. Case ${punishment.case}`)
	}

	// Check for unfinished polls and start a timeout to conclude them
	const polls = await db
		.collection<Poll>("polls")
		.find({ ended: false, endTimestamp: { $exists: true } })
		.toArray()
	for (const poll of polls) awaitPoll(poll)

	// We restart the bot at least once every 2 days so no punishment will be left unexpired
	setInterval(async () => {
		console.log("Bot has been running for 2 days, restarting...")
		botDev.send("I have been running for 2 days straight, gonna restart...")
		await restart()
	}, 172_800_000)
})

export async function awaitMute(punishment: PunishmentLog) {
	// The setTimeout function doesn't accept values bigger than the 32-bit signed integer limit, so we need to check for that.
	const msLeft = punishment.endTimestamp! - Date.now()
	if (msLeft > 2 ** 31 - 1) return
	await setTimeout(msLeft)
	const guild = client.guilds.cache.get(ids.guilds.main)!,
		punishmentsColl = db.collection<PunishmentLog>("punishments"),
		caseNumber = (await punishmentsColl.estimatedDocumentCount()) + 1,
		user = await client.users.fetch(punishment.id),
		punishmentLog = new EmbedBuilder({
			color: colors.success,
			author: {
				name: `Case ${caseNumber} | Unmute | ${user.tag}`,
				iconURL: (guild.members.cache.get(punishment.id!) ?? user).displayAvatarURL({ extension: "png" }),
			},
			fields: [
				{ name: "User", value: user.toString(), inline: true },
				{ name: "Moderator", value: client.user.toString(), inline: true },
				{ name: "Reason", value: "Ended" },
			],
			footer: { text: `ID: ${user.id}` },
			timestamp: Date.now(),
		}),
		msg = await (guild.channels.cache.get(ids.channels.punishments) as TextChannel).send({ embeds: [punishmentLog] })
	await punishmentsColl.bulkWrite([
		{
			updateOne: {
				filter: { case: punishment.case },
				update: {
					$set: {
						ended: true,
						endTimestamp: Date.now(),
					},
				},
			},
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
					logMsg: msg.id,
				} as PunishmentLog,
			},
		},
	])
	const dmEmbed = new EmbedBuilder({
		color: colors.success,
		author: { name: "Punishment" },
		title: `Your mute on the ${guild.name} has expired.`,
		description: "You will now be able to talk in chats again. If something's wrong, please respond in this DM.",
		timestamp: Date.now(),
	})
	await user.send({ embeds: [dmEmbed] }).catch(() => console.log(`Couldn't DM user ${user.tag}, (${user.id}) about their unmute.`))
}

export async function awaitBan(punishment: PunishmentLog) {
	// The setTimeout function doesn't accept values bigger than the 32-bit signed integer limit, so we need to check for that.
	const msLeft = punishment.endTimestamp! - Date.now()
	if (msLeft > 2 ** 31 - 1) return
	await setTimeout(msLeft)
	const guild = client.guilds.cache.get(ids.guilds.main)!,
		punishmentsColl = db.collection<PunishmentLog>("punishments"),
		caseNumber = (await punishmentsColl.estimatedDocumentCount()) + 1,
		user = await guild.bans
			.remove(punishment.id!, "Punishment ended")
			.then(u => u ?? client.users.fetch(punishment.id!))
			.catch(err => console.error(`Couldn't unban user with id ${punishment.id}. Here's the error:\n`, err)),
		userFetched = await client.users.fetch(punishment.id).catch(() => null),
		punishmentLog = new EmbedBuilder({
			color: colors.success,
			author: {
				name: `Case ${caseNumber} | Unban | ${userFetched?.tag ?? "Deleted User#0000"}`,
				iconURL: userFetched?.displayAvatarURL({ extension: "png" }) ?? client.user.defaultAvatarURL,
			},
			fields: [
				{ name: "User", value: `<@${punishment.id}>`, inline: true },
				{ name: "Moderator", value: client.user.toString(), inline: true },
				{ name: "Reason", value: "Ended" },
			],
			footer: { text: `ID: ${punishment.id}` },
			timestamp: Date.now(),
		})
	if (!user) punishmentLog.setDescription("Couldn't unban user from the server.")
	else {
		const dmEmbed = new EmbedBuilder({
			color: colors.success,
			author: { name: "Punishment" },
			title: `Your ban on the ${guild.name} has expired.`,
			description: "You are welcome to join back using the invite in this message.",
			timestamp: Date.now(),
		})
		await user
			.send({ content: await getInviteLink(), embeds: [dmEmbed] })
			.catch(() => console.log(`Couldn't DM user ${userFetched?.tag ?? "Deleted User#0000"}, (${user.id}) about their unban.`))
	}
	const msg = await (guild.channels.cache.get(ids.channels.punishments) as TextChannel).send({ embeds: [punishmentLog] })
	await punishmentsColl.bulkWrite([
		{
			updateOne: {
				filter: { case: punishment.case },
				update: {
					$set: {
						ended: true,
						endTimestamp: Date.now(),
					},
				},
			},
		},
		{
			insertOne: {
				document: {
					case: caseNumber,
					id: punishment.id,
					type: "UNBAN",
					reason: "Ended",
					timestamp: Date.now(),
					moderator: client.user.id,
					logMsg: msg.id,
				},
			},
		},
	])
}

export async function awaitPoll(poll: Poll) {
	const msLeft = poll.endTimestamp! - Date.now()
	if (msLeft > 2 ** 31 - 1) return
	await setTimeout(msLeft)
	const message = await (client.channels.cache.get(poll.channelId) as TextBasedChannel)?.messages.fetch(poll.messageId).catch(() => null),
		pollDb = await db
			.collection<Poll>("polls")
			.findOneAndUpdate({ messageId: poll.messageId, channelId: poll.channelId }, { $set: { ended: true } })
	if (!message || !pollDb.value) return
	const totalVoteCount = pollDb.value.options.reduce((acc, o) => acc + o.votes.length, 0),
		embed = new EmbedBuilder({
			color: Colors.Blurple,
			title: pollDb.value.question,
			description: totalVoteCount
				? `A total of ${totalVoteCount} ${totalVoteCount === 1 ? "person" : "people"} voted on this poll!`
				: "Unfortunately, no one voted on this poll",
			fields: totalVoteCount
				? pollDb.value.options.map(o => ({
						name: o.text,
						// Make sure to account for NaN values
						value: `${generateProgressBar(o.votes.length, totalVoteCount)} ${
							Math.round((o.votes.length / totalVoteCount) * 100) || 0
						}% (**${o.votes.length} votes**)`,
				  }))
				: [],
			footer: { text: "Poll results • Created at" },
			timestamp: new ObjectId(pollDb.value._id).getTimestamp().getTime(),
		}),
		msg = await message.channel!.send({
			embeds: [embed],
			content: `<@${pollDb.value.authorId}> your poll just ended. Check out the results below!`,
		}),
		linkButton = new ActionRowBuilder<ButtonBuilder>({
			components: [
				new ButtonBuilder({
					style: ButtonStyle.Link,
					url: msg.url,
					label: "See results",
				}),
			],
		})
	await message.edit({
		content: "This poll has ended!",
		components: [linkButton],
	})
}

function constructGuildCommands() {
	if (process.env.NODE_ENV === "production") return client.commands.filter(c => !c.allowDM).map(convertToDiscordCommand)
	return client.commands
		.filter(
			command => (command.allowDM && !client.application.commands.cache.find(c => c.name === command.name)?.equals(command, true)) ?? true,
		)
		.map(convertToDiscordCommand)
}

function convertToDiscordCommand(command: Command): ChatInputApplicationCommandData {
	return {
		...command,
		dmPermission: !(command.roleWhitelist || command.dev),
	}
}

// I have no clue how this works, I just know that it works
export function easter(year: number) {
	const century = Math.floor(year / 100),
		goldenNumber = year - 19 * Math.floor(year / 19)

	let i = century - Math.floor(century / 4) - Math.floor((century - Math.floor((century - 17) / 25)) / 3) + 19 * goldenNumber + 15
	i -= 30 * Math.floor(i / 30)
	i -= Math.floor(i / 28) * (1 - Math.floor(i / 28) * Math.floor(29 / (i + 1)) * Math.floor((21 - goldenNumber) / 11))

	let j = year + Math.floor(year / 4) + i + 2 - century + Math.floor(century / 4)
	j -= 7 * Math.floor(j / 7)

	const l = i - j,
		month = 3 + Math.floor((l + 40) / 44),
		day = l + 28 - 31 * Math.floor(month / 4)

	return [day, month] as const
}
