import { ids } from "../config.json"
import { client } from "../index"
import { db, type DbUser } from "../lib/dbclient"

import type { TextChannel } from "discord.js"

export default function check() {
	const alert = new Date().getTime() - 7 * 24 * 60 * 60 * 1000,
		// Get date 7 days ago           d    h    m    s     ms
		verify = new Date().getTime() - 14 * 24 * 60 * 60 * 1000
	// Get date 14 days ago              d    h    m    s     ms

	client.guilds.cache
		.get(ids.guilds.main)!
		.roles.cache.get(ids.guilds.main)!
		.members.filter(m => !m.user.bot && !m.roles.cache.has(ids.roles.verified))
		.forEach(async member => {
			await member.fetch()
			const verifyLogs = client.channels.cache.get(ids.channels.verifyLogs) as TextChannel,
				userDb: DbUser = await client.getUser(member.id)
			if (member.roles.cache.has(ids.roles.alerted)) {
				if (Number(userDb.unverifiedTimestamp) <= verify || member.joinedTimestamp! <= verify) {
					await member
						.send(
							"You stood in the verify channel for too long and, because of that, you have been automatically verified as a player. If you're a translator and wish to receive your roles, please execute `/verify <profileURL>` replacing <profileURL> with the URL to your Crowdin profile.",
						)
						.then(async () => {
							await verifyLogs.send(`${member} has been automatically verified after staying on the server for 2 weeks.`)
							console.log(`Automatically verified ${member.user.tag} after 2 weeks`)
						})
						.catch(async () => {
							await verifyLogs.send(`Automatically verified ${member} after 2 weeks but couldn't send them a DM with the reason.`)
							console.error(`Automatically verified ${member.user.tag} after 2 weeks but couldn't DM them`)
						})
					await member.roles.add(ids.roles.verified, "Automatically verified after 2 weeks")
					await member.roles.remove(ids.roles.alerted, "Automatically verified after 2 weeks")
					await db.collection<DbUser>("users").updateOne({ id: member.id }, { $unset: { unverifiedTimestamp: true } })
				}
			} else if (Number(userDb.unverifiedTimestamp) <= alert || member.joinedTimestamp! <= alert) {
				await member
					.send(
						`Hey there!\nWe noticed you haven't verified yourself on our server. Are you having any trouble? Please message an administrator or just ask any questions in the <#${ids.channels.verify}> channel! Otherwise, please send your profile link like shown in the channel.\n\nThis message was sent to you because you have been on our server for too long, and you're in risk of getting kicked for inactivity soon.\nAny messages you send here will be sent to staff upon confirmation.`,
					)
					.then(async () => {
						await verifyLogs.send(`Sent an alert to ${member} as they've been in the server for 7 days without verifying.`)
						console.log(`Alerted ${member.user.tag} for inactivity`)
					})
					.catch(async () => {
						await verifyLogs.send(
							`Tried to send an alert to ${member} as they've been stood in the server for 7 days without verifying, but they had private messages disabled from this server.`,
						)
						console.error(`Tried to alert ${member.user.tag} but they had DMs disabled.`)
					})
				await member.roles.add(ids.roles.verified, "Stood on the server for 7 days without verifying")
			}
		})
}
