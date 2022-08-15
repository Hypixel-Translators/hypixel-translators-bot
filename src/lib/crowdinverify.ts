import { setTimeout } from "node:timers/promises"

import { type GuildMember, EmbedBuilder, Role, type TextChannel, Colors } from "discord.js"

import { db, type DbUser } from "./dbclient"
import { closeConnection, getBrowser, type MongoLanguage, type Stats } from "./util"

import { colors, ids } from "../config.json"
import { client } from "../index"

type ValidProjects = "Hypixel" | "Quickplay" | "Bot" | "SkyblockAddons"

const projectNames: {
	[id: string]: ValidProjects
} = {
	128098: "Hypixel",
	369653: "Quickplay",
	436418: "Bot",
	369493: "SkyblockAddons",
}

/**
 * Verifies a guild member with their crowdin profile and gives them the appropriate project and veteran roles, if applicable.
 * @param member The guild member to verify
 * @param url The member's Crowdin profile URL
 * @param sendDms Whether to send DMs to the member or not. Also bypasses the Discord tag check
 * @param sendLogs Whether to send logs to the log channel or not
 */
export async function crowdinVerify(member: GuildMember, url?: string | null, sendDms = false, sendLogs = true) {
	const verifyLogs = member.client.channels.cache.get(ids.channels.verifyLogs) as TextChannel,
		verify = member.client.channels.cache.get(ids.channels.verify) as TextChannel,
		dmEmbed = new EmbedBuilder({
			color: colors.error,
			author: { name: "Received message from staff" },
			footer: { text: "Any messages you send here will be sent to staff upon confirmation." },
		}),
		languages = db.collection<MongoLanguage>("languages"),
		usersColl = db.collection<DbUser>("users"),
		statsColl = db.collection<Stats>("stats"),
		verifyType = sendDms ? "SELF" : sendLogs ? "STAFF" : "AUTO"
	if (!url) {
		const userDb = await client.getUser(member.id)
		if (typeof url === "undefined") url = userDb.profile
		if (url === null) return removeAllRoles(member)
		if (!url) {
			// If user runs /verify and the profile is not stored on our DB or if the user sends the generic profile URL
			// #region return message
			await member.roles.remove(ids.roles.verified, "Tried to verify but profile wasn't stored")
			await usersColl.updateOne({ id: member.id }, { $set: { unverifiedTimestamp: Date.now() } })
			dmEmbed
				.setDescription(
					"Hey there! We noticed you tried to send us your Crowdin profile but the link you sent was invalid. This may have happened because you either typed the wrong name in the link or you sent us the generic Crowdin profile link. If you don't know how to obtain the profile URL, make sure it follows the format `https://crowdin.com/profile/<username>` and replace <username> with your username like shown below.\n\nIf you have any questions, be sure to send them to us!"
				)
				.setImage("https://i.imgur.com/7FVOSfT.png")
			if (sendDms) {
				member
					.send({ embeds: [dmEmbed] })
					.then(
						async () =>
							await verifyLogs.send(
								`${member} didn't send a valid profile URL. Let's hope they work their way around with the message I just sent them.`
							)
					)
					.catch(async () => {
						dmEmbed.setFooter({ text: "This message will be deleted in a minute" })
						const msg = await verify.send({ content: `${member} you had DMs disabled, so here's our message,`, embeds: [dmEmbed] })
						await verifyLogs.send(
							`${member} didn't send a valid profile URL. Let's hope they work their way around with the message I just sent in <#${ids.channels.verify}> since they had DMs off.`
						)
						await setTimeout(60_000)
						await msg.delete().catch(() => null)
					})
			} else await verifyLogs.send(`The profile stored/provided for ${member} was invalid. Please fix this or ask them to fix this.`)
			if (sendLogs)
				await statsColl.insertOne({ type: "VERIFY", name: verifyType, user: member.id, error: true, errorMessage: "invalidURL" })
			return
			// #endregion
		}
	}
	url = url
		// Ensure URL starts with https://
		.replace(/^(?:https:\/\/)?/, "https://")
		.toLowerCase()
		// Remove localized Crowdin versions
		.replace(/(?:[a-z]{2}\.)?(crowdin\.com)/gi, "$1")

	const browser = await getBrowser(),
		page = await browser.pupBrowser.newPage()
	try {
		await page.goto(url, { timeout: 10_000 })
		await page.waitForSelector(".project-name", { timeout: 10_000 })
	} catch {
		// If no projects are available
		const isPrivate = !!(await page.$(".private-profile")),
			isValid = !!(await page.$(".project-list-container"))
		/*
		Possible scenarios:
		private profile: isPrivate = true && isValid = false
		public profile with no projects: isPrivate = false && isValid = true
		404 page: isPrivate = false && isValid = false
		*/
		await page.close()
		await closeConnection(browser.uuid)
		if (!isValid && !isPrivate) {
			// If profile leads to a 404 page
			// #region return message
			await member.roles.remove(ids.roles.verified, "Tried to verify with an invalid URL")
			await usersColl.updateOne({ id: member.id }, { $set: { unverifiedTimestamp: Date.now() } })
			if (sendDms) {
				dmEmbed
					.setDescription(
						"Hey there! We noticed you tried to send us your Crowdin profile but the link you sent was invalid. This may have happened because you either typed the wrong name in the link or you sent us the generic Crowdin profile link. If you don't know how to obtain the profile URL, make sure it follows the format `https://crowdin.com/profile/<username>` and replace <username> with your username like shown below.\n\nIf you have any questions, be sure to send them to us!"
					)
					.setImage("https://i.imgur.com/7FVOSfT.png")
				await member
					.send({ embeds: [dmEmbed] })
					.then(
						async () =>
							await verifyLogs.send(
								`${member} sent the wrong profile link (<${url}>). Let's hope they work their way around with the message I just sent them.`
							)
					)
					.catch(async () => {
						dmEmbed.setFooter({ text: "This message will be deleted in a minute" })
						const msg = await verify.send({ content: `${member} you had DMs disabled, so here's our message,`, embeds: [dmEmbed] })
						await verifyLogs.send(
							`${member} sent the wrong profile link (<${url}>). Let's hope they work their way around with the message I just sent in <#${ids.channels.verify}> since they had DMs off.`
						)
						await setTimeout(60_000)
						await msg.delete().catch(() => null)
					})
				// If an admin triggers it
			} else if (sendLogs)
				await verifyLogs.send(`The profile stored/provided for ${member} was invalid (<${url}>). Please fix this or ask them to fix this.`)
			else {
				// If it gets triggered by scheduled verification
				dmEmbed.setDescription(
					`Hey there! We noticed you recently changed your Crowdin profile username and thus we weren't able to check your roles. Please send your new profile URL on the ${verify} channel or run the \`/verify\` command.\n\nThere's a small chance your profile is still valid and this is a false positive. If so, please ignore this message or contact an admin to receive your roles back if you haven't already. We apologize for any inconvenience this may have caused you.`
				)

				await member
					.send({ embeds: [dmEmbed] })
					.then(
						async () =>
							await verifyLogs.send(
								`${member}'s profile seems to be invalid: <${url}>\nI notified them about it but it's possible it might've been a false positive. If so, give them the Verified role back`
							)
					)
					.catch(
						async () =>
							await verifyLogs.send(
								`${member}'s profile seems to be invalid: <${url}>\nI couldn't notify them about it so check if it wasn't a false positive and give them the Verified role back if it was.`
							)
					)
			}
			if (sendLogs)
				await statsColl.insertOne({ type: "VERIFY", name: verifyType, user: member.id, error: true, errorMessage: "invalidURL" })
			// #endregion
		} else if (sendLogs && isPrivate) {
			// If the profile is private
			// #region return message
			await member.roles.remove(ids.roles.verified, "Tried to verify with a private profile")
			await usersColl.updateOne({ id: member.id }, { $set: { unverifiedTimestamp: Date.now() } })
			if (sendDms) {
				dmEmbed
					.setDescription(
						"Hey there! We noticed you sent us your Crowdin profile, however, it was private so we couldn't check it. Please make it public, at least until you get verified, and send us your profile again on the channel. If you don't know how to, then go to your Crowdin profile settings (found [here](https://crowdin.com/settings#account)) and make sure the \"Private Profile\" setting is turned off (see the image below)\n\nIf you have any questions, be sure to send them to us!"
					)
					.setImage("https://i.imgur.com/YX8VLeu.png")
				await member
					.send({ embeds: [dmEmbed] })
					.then(async () => await verifyLogs.send(`${member}'s profile (<${url}>) was private, I let them know about that.`))
					.catch(async () => {
						dmEmbed.setFooter({ text: "This message will be deleted in a minute" })
						const msg = await verify.send({ content: `${member} you had DMs disabled, so here's our message,`, embeds: [dmEmbed] })
						await verifyLogs.send(
							`${member}'s profile was private (<${url}>), I let them know about that in <#${ids.channels.verify}> since they had DMs off.`
						)
						await setTimeout(60_000)
						await msg.delete().catch(() => null)
					})
			} else await verifyLogs.send(`${member}'s profile is private (<${url}>). Please ask them to change this.`)
			await statsColl.insertOne({ type: "VERIFY", name: verifyType, user: member.id, error: true, errorMessage: "privateProfile" })
			// #endregion
		} else {
			// If profile is valid and public but has no projects
			dmEmbed
				.setColor(Colors.Blurple)
				.setDescription(
					"Hey there!\nYou have successfully verified your Crowdin account!\nSadly you didn't receive any roles because you don't translate for any of the projects we currently support.\nWhen you have started translating you can refresh your roles by running `/verify`\nIf you wanna know more about all the projects we currently support, run `/projects` here."
				)
			const logEmbed = new EmbedBuilder({
				color: Colors.Blurple,
				title: `${member.user.tag} is now verified!`,
				description: `${member} has not received any roles. They do not translate for any of the projects.`,
				fields: [{ name: "Profile", value: url }],
			})
			if (sendDms) {
				await member
					.send({ embeds: [dmEmbed] })
					.then(async () => await verifyLogs.send({ embeds: [logEmbed] }))
					.catch(async () => {
						logEmbed.setFooter({ text: "Message not sent because user had DMs off" })
						await verifyLogs.send({ embeds: [logEmbed] })
					})
			} else if (sendLogs) await verifyLogs.send({ embeds: [logEmbed] })
			if (sendLogs) await statsColl.insertOne({ type: "VERIFY", name: verifyType, user: member.id })
		}
		return
	}
	const aboutContent = await page.evaluate(element => element?.textContent ?? "", await page.$(".user-about"))
	let projects: CrowdinProject[] | null = null
	if (aboutContent.includes(member.user.tag) || !sendDms) {
		projects = await page.evaluate(async () => {
			return await new Promise<CrowdinProject[]>(resolve => {
				// eslint-disable-next-line no-restricted-globals
				setInterval(() => {
					const rawProjects = window.eval("crowdin.profile_projects.view.state.projects")
					if (rawProjects) resolve(rawProjects)
				}, 100)
			})
		})
	}
	await page.close()
	await closeConnection(browser.uuid)

	if (!projects) {
		// #region return message
		await member.roles.remove(ids.roles.verified, "Tried to verify with no Discord tag")
		await usersColl.updateOne({ id: member.id }, { $set: { unverifiedTimestamp: Date.now() } })
		dmEmbed
			.setDescription(
				`Hey there!\nWe noticed you sent us your Crowdin profile, however, you forgot to add your Discord tag to it! Just add ${member.user.tag} to your about section like shown in the image below. Once you've done so, send us the profile link again.\n\nIf you have any questions, be sure to send them to us!`
			)
			.setImage("https://i.imgur.com/BM2bJ4W.png")
		if (sendDms) {
			await member
				.send({ embeds: [dmEmbed] })
				.then(
					async () =>
						await verifyLogs.send(
							`${member} forgot to add their Discord to their profile (<${url}>). Let's hope they fix that with the message I just sent them.`
						)
				)
				.catch(async () => {
					dmEmbed.setFooter({ text: "This message will be deleted in a minute" })
					const msg = await verify.send({ content: `${member} you had DMs disabled, so here's our message,`, embeds: [dmEmbed] })
					await verifyLogs.send(
						`${member} forgot to add their Discord to their profile (<${url}>). Let's hope they fix that with the message I just sent in <#${ids.channels.verify}> since they had DMs off.`
					)
					await setTimeout(60_000)
					await msg.delete().catch(() => null)
				})
		}
		if (sendLogs)
			await statsColl.insertOne({ type: "VERIFY", name: verifyType, user: member.id, error: true, errorMessage: "missingDiscordTag" })
		return
		// #endregion
	}

	const allProjectRoles: Role[] = []

	for (const project of projects.filter(p => Object.keys(projectNames).includes(p.id))) {
		const projectName = projectNames[project.id]
		// If user was removed from all langs
		if (!project.contributed_languages?.length && !["owner", "manager"].includes(project.user_role)) continue

		if (project.user_role === "pending") {
			// Make sure roles aren't removed if member is pending
			allProjectRoles.push(
				...member.roles.cache
					.filter(
						r =>
							isTranslatorRole(r) &&
							(r.name.startsWith(projectName) || (projectName === "Hypixel" && (!isProjectRole(r) || r.name.endsWith("Veteran"))))
					)
					.values()
			)
			continue
		}

		const highestRole = ["owner", "manager"].includes(project.user_role)
				? "Manager"
				: project.contributed_languages?.some(l => l.user_role.name === "Proofreader")
				? "Proofreader"
				: "Translator",
			projectHighestHole = member.guild.roles.cache.find(r => r.name === `${projectName} ${highestRole}`)
		if (projectHighestHole) allProjectRoles.push(projectHighestHole)
		else console.error(`Couldn't find the ${highestRole} role for the ${projectName} project`)

		if (projectName === "Hypixel") {
			if (project.contributed_languages) {
				for (const langDbEntry of await db
					.collection<MongoLanguage>("languages")
					.find({ id: { $in: project.contributed_languages.map(l => l.code) } })
					.toArray()) {
					const projectLang = project.contributed_languages.find(l => l.code === langDbEntry.id)!,
						langRole = member.guild.roles.cache.find(r => r.name === `${langDbEntry.name} ${projectLang.user_role.name}`)
					if (langRole) allProjectRoles.push(langRole)
					else console.error(`Couldn't find the ${projectLang.user_role.name} role for the ${langDbEntry.name} language`)
				}
			}

			const veteranRole = await getVeteranRole(member, project)
			if (veteranRole) allProjectRoles.push(veteranRole)
		}
	}

	const newMemberRoles = [
		...new Set([
			// Remove all translator roles
			...member.roles.cache.filter(r => !isTranslatorRole(r) && r.id !== ids.roles.alerted).keys(),
			// Keep the ones the user still has
			...allProjectRoles.map(r => r.id),
			ids.roles.verified,
		]),
	]

	await member.roles.set(newMemberRoles, "User is now Verified")
	await usersColl.updateOne({ id: member.id }, { $set: { profile: url }, $unset: { unverifiedTimestamp: true } })

	const logEmbed = new EmbedBuilder({
			color: Colors.Blurple,
			title: `${member.user.tag} is now verified!`,
			description: allProjectRoles.length
				? `${member} has received the following roles:`
				: `${member} has not received any roles. They do not translate for any of the projects.`,
		}),
		rolesPerProject = Object.fromEntries<Role[]>(Object.values(projectNames).map(p => [p, []])) as Record<ValidProjects, Role[]>

	for (const role of allProjectRoles.sort((a, b) =>
		[a.name, b.name].some(n => n.endsWith("Veteran"))
			? // Place veteran roles at the end
			  b.name.localeCompare(a.name)
			: !isProjectRole(a) && !isProjectRole(b)
			? // Sort language roles be their position
			  b.position - a.position
			: // Place Hypixel project roles first
			  a.color - b.color
	)) {
		const project = isProjectRole(role) ? (role.name.split(" ")[0] as ValidProjects) : "Hypixel"
		rolesPerProject[project] ??= []
		rolesPerProject[project].push(role)
	}

	for (const [project, projectRoles] of Object.entries(rolesPerProject)) {
		if (projectRoles.length) {
			try {
				logEmbed.addFields({ name: project, value: projectRoles.join(",\n") })
			} catch (error) {
				console.error(error.errors)
				logEmbed.addFields({ name: project, value: "Too many roles to display" })
			}
		}
	}

	// Set the user's language based off of their highest role if this is a manual verification
	if (sendDms) {
		const highestRole = rolesPerProject.Hypixel?.filter(r => r.color)
			.sort((a, b) => b.position - a.position)
			.shift()
		if (highestRole) {
			const lang = await languages.findOne({ name: highestRole.name.replace(/ (?:Translator|Proofreader)$/, "") })
			if (lang) {
				await usersColl.updateOne(
					// Only update if lang is english or not set
					{ id: member.id, $or: [{ lang: "en" }, { lang: { $exists: false } }] },
					{ $set: { lang: lang.id.replace("-", "_") } }
				)
			}
		}
	}

	logEmbed.addFields({ name: "Profile", value: url })

	// #region return message
	dmEmbed
		.setColor(Colors.Blurple)
		.setTitle("You have successfully verified your Crowdin account")
		.setDescription(
			`${
				allProjectRoles.length
					? "You've been given all your project roles!"
					: "Sadly, you didn't receive any roles because you don't translate for any of the projects we currently support.\nMake sure to refresh your roles using `/verify` once you have joined some of them. Keep in mind that if you recently sent a request to join one of the projects you will have to wait until it's accepted."
			}\nHere's a few things you can do on the server now:\n\n - Check out <#${
				ids.channels.gettingStarted
			}> if you want to learn more about Crowdin;\n - Try out \`/prefix\` in <#${
				ids.channels.bots
			}> to get yourself a prefix with your country's flag;\n - Link your Minecraft account using \`/hypixelverify\` in <#${
				ids.channels.bots
			}>;\n - Check out all the projects we currently support by running \`/projects\` either here or in <#${
				ids.channels.bots
			}>;\n - Talk with the community in <#${ids.channels.offTopic}>\n\nWe hope you have fun on the server!`
		)

	if (sendDms) {
		member
			.send({ embeds: [dmEmbed] })
			.then(async () => await verifyLogs.send({ embeds: [logEmbed] }))
			.catch(async () => {
				logEmbed.setFooter({ text: "Message not sent because user had DMs off" })
				await verifyLogs.send({ embeds: [logEmbed] })
			})
	} else if (sendLogs) await verifyLogs.send({ embeds: [logEmbed] })
	if (sendLogs) await statsColl.insertOne({ type: "VERIFY", name: verifyType, user: member.id })
	// #endregion
}

async function getVeteranRole(member: GuildMember, project: CrowdinProject) {
	const medals = ["👻", "🥇", "🥈", "🥉", "🏅", "🎖️", "🏆", "💎", "💠", "⭐", "🌟", "👑"],
		years = Math.floor((Date.now() - project.joined_at_timestamp * 1000) / (1000 * 60 * 60 * 24 * 365))
	if (years === 0) return

	let role = member.guild.roles.cache.find(r => r.name.includes(`${years === 1 ? `${years} Year` : `${years} Years`} Veteran`))
	if (!medals[years]) throw "We've ran out of veteran medals!"

	role ??= await member.guild.roles.create({
		name: `${years === 1 ? `${years} Year` : `${years} Years`} Veteran`,
		position:
			member.guild.roles.cache
				.filter(r => r.name.includes(" Veteran"))
				.sort((a, b) => b.position - a.position)
				.first()!.position + 1,
		reason: "New veteran role!",
		unicodeEmoji: medals[years],
	})

	if (role.name !== `${years === 1 ? `${years} Year` : `${years} Years`} Veteran`)
		await role.setName(`${years === 1 ? `${years} Year` : `${years} Years`} Veteran`, "The name was wrong for some reason")
	if (role.unicodeEmoji !== medals[years] && role.guild.features.includes("ROLE_ICONS"))
		await role.setUnicodeEmoji(medals[years], "The emoji was wrong for some reason")

	return role
}

async function removeAllRoles(member: GuildMember) {
	const newRoles = member.roles.cache.filter(r => !isTranslatorRole(r))
	await member.roles.set(newRoles, "Removing all translator roles from user")
}

function isTranslatorRole(role: Role) {
	return ["Translator", "Proofreader", "Manager", "Veteran"].some(t => role.name.endsWith(t))
}

function isProjectRole(role: Role) {
	return Object.values(projectNames).some(t => role.name.startsWith(t))
}

// The types for the role names are only correct for projects using the default role structure.
// Projects with custom roles will have a different structure but we don't work with any like that
interface CrowdinProject {
	id: string
	name: string
	identifier: string
	join_policy: string
	last_activity: string
	created_at_timestamp: number
	last_activity_timestamp: number
	joined_at_timestamp: number
	last_seen_timestamp: number
	user_role: "pending" | "translator" | "proofreader" | "manager" | "owner"
	contributed_languages?: {
		name: string
		code: string
		organization_id?: string
		url: string
		user_role: {
			alias: "P" | "T"
			name: "Proofreader" | "Translator"
		}
	}[]
}
