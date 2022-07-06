import { setTimeout } from "node:timers/promises"

import { type GuildMember, EmbedBuilder, type Role, type TextChannel, Colors } from "discord.js"

import { db, type DbUser } from "./dbclient"
import { closeConnection, getBrowser, type MongoLanguage, type Stats } from "./util"

import { colors, ids } from "../config.json"
import { client } from "../index"

type ValidProjects = "Hypixel" | "Quickplay" | "Bot" | "SkyblockAddons"

const projectIDs: {
	[id: string]: {
		name: ValidProjects
		langRoles: boolean
	}
} = {
	128098: { name: "Hypixel", langRoles: true },
	369653: { name: "Quickplay", langRoles: false },
	436418: { name: "Bot", langRoles: false },
	369493: { name: "SkyblockAddons", langRoles: false },
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
		errorEmbed = new EmbedBuilder({
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
			errorEmbed
				.setDescription(
					"Hey there! We noticed you tried to send us your Crowdin profile but the link you sent was invalid. This may have happened because you either typed the wrong name in the link or you sent us the generic Crowdin profile link. If you don't know how to obtain the profile URL, make sure it follows the format `https://crowdin.com/profile/<username>` and replace <username> with your username like shown below.\n\nIf you have any questions, be sure to send them to us!",
				)
				.setImage("https://i.imgur.com/7FVOSfT.png")
			if (sendDms) {
				member
					.send({ embeds: [errorEmbed] })
					.then(
						async () =>
							await verifyLogs.send(
								`${member} didn't send a valid profile URL. Let's hope they work their way around with the message I just sent them.`,
							),
					)
					.catch(async () => {
						errorEmbed.setFooter({ text: "This message will be deleted in a minute" })
						const msg = await verify.send({ content: `${member} you had DMs disabled, so here's our message,`, embeds: [errorEmbed] })
						await verifyLogs.send(
							`${member} didn't send a valid profile URL. Let's hope they work their way around with the message I just sent in <#${ids.channels.verify}> since they had DMs off.`,
						)
						await setTimeout(60_000)
						await msg.delete().catch(() => null)
					})
			} else await verifyLogs.send(`The profile stored/provided for ${member} was invalid. Please fix this or ask them to fix this.`)
			if (sendLogs) await statsColl.insertOne({ type: "VERIFY", name: verifyType, user: member.id, error: true, errorMessage: "invalidURL" })
			return
			// #endregion
		}
	}
	if (url.startsWith("http://")) url = url.replace("http://", "https://")
	else if (!url.startsWith("https://")) url = `https://${url}`
	url = url.toLowerCase().replace(/([a-z]{1,4}[.])?(crowdin[.]com)/gi, "$2")
	const browser = await getBrowser(),
		page = await browser.pupBrowser.newPage()
	try {
		await page.goto(url, { timeout: 10_000 })
		await page.waitForSelector(".project-name", { timeout: 10_000 })
	} catch {
		// If no projects are available
		const isPrivate = (await page.$(".private-profile")) !== null,
			isValid = (await page.$(".project-list-container")) !== null
		/*
		Possible scenarios:
		private profile: isPrivate = true && isValid = false
		public profile with no projects: isPrivate = false && isValid = true
		404 page: isPrivate = false && isValid = false
		*/
		await page.close()
		closeConnection(browser.uuid)
		if (!isPrivate && !isValid) {
			// If profile leads to a 404 page
			// #region return message
			await member.roles.remove(ids.roles.verified, "Tried to verify with an invalid URL")
			await usersColl.updateOne({ id: member.id }, { $set: { unverifiedTimestamp: Date.now() } })
			errorEmbed
				.setDescription(
					"Hey there! We noticed you tried to send us your Crowdin profile but the link you sent was invalid. This may have happened because you either typed the wrong name in the link or you sent us the generic Crowdin profile link. If you don't know how to obtain the profile URL, make sure it follows the format `https://crowdin.com/profile/<username>` and replace <username> with your username like shown below.\n\nIf you have any questions, be sure to send them to us!",
				)
				.setImage("https://i.imgur.com/7FVOSfT.png")
			if (sendDms) {
				await member
					.send({ embeds: [errorEmbed] })
					.then(
						async () =>
							await verifyLogs.send(
								`${member} sent the wrong profile link (<${url}>). Let's hope they work their way around with the message I just sent them.`,
							),
					)
					.catch(async () => {
						errorEmbed.setFooter({ text: "This message will be deleted in a minute" })
						const msg = await verify.send({ content: `${member} you had DMs disabled, so here's our message,`, embeds: [errorEmbed] })
						await verifyLogs.send(
							`${member} sent the wrong profile link (<${url}>). Let's hope they work their way around with the message I just sent in <#${ids.channels.verify}> since they had DMs off.`,
						)
						await setTimeout(60_000)
						await msg.delete().catch(() => null)
					})
			} else if (sendLogs)
				await verifyLogs.send(`The profile stored/provided for ${member} was invalid (<${url}>). Please fix this or ask them to fix this.`)
			else {
				await verifyLogs.send(
					`${member}'s profile seems to be invalid: <${url}>\nIf it is, please remove it from the database, otherwise ignore this message or maybe even delete it.`,
				)
			}
			if (sendLogs) await statsColl.insertOne({ type: "VERIFY", name: verifyType, user: member.id, error: true, errorMessage: "invalidURL" })
			// #endregion
		} else if (sendLogs && isPrivate) {
			// If the profile is private
			// #region return message
			await member.roles.remove(ids.roles.verified, "Tried to verify with a private profile")
			await usersColl.updateOne({ id: member.id }, { $set: { unverifiedTimestamp: Date.now() } })
			errorEmbed
				.setDescription(
					"Hey there! We noticed you sent us your Crowdin profile, however, it was private so we couldn't check it. Please make it public, at least until you get verified, and send us your profile again on the channel. If you don't know how to, then go to your Crowdin profile settings (found [here](https://crowdin.com/settings#account)) and make sure the \"Private Profile\" setting is turned off (see the image below)\n\nIf you have any questions, be sure to send them to us!",
				)
				.setImage("https://i.imgur.com/YX8VLeu.png")
			if (sendDms) {
				await member
					.send({ embeds: [errorEmbed] })
					.then(async () => await verifyLogs.send(`${member}'s profile (<${url}>) was private, I let them know about that.`))
					.catch(async () => {
						errorEmbed.setFooter({ text: "This message will be deleted in a minute" })
						const msg = await verify.send({ content: `${member} you had DMs disabled, so here's our message,`, embeds: [errorEmbed] })
						await verifyLogs.send(
							`${member}'s profile was private (<${url}>), I let them know about that in <#${ids.channels.verify}> since they had DMs off.`,
						)
						await setTimeout(60_000)
						await msg.delete().catch(() => null)
					})
			} else await verifyLogs.send(`${member}'s profile is private (<${url}>). Please ask them to change this.`)
			await statsColl.insertOne({ type: "VERIFY", name: verifyType, user: member.id, error: true, errorMessage: "privateProfile" })
			// #endregion
		} else {
			const dmEmbed = new EmbedBuilder({
					color: Colors.Blurple,
					author: { name: "Received message from staff" },
					description:
						"Hey there!\nYou have successfully verified your Crowdin account!\nSadly you didn't receive any roles because you don't translate for any of the projects we currently support.\nWhen you have started translating you can refresh your roles by running `/verify`\nIf you wanna know more about all the projects we currently support, run `/projects` here.",
					footer: { text: "Any messages you send here will be sent to staff upon confirmation." },
				}),
				logEmbed = new EmbedBuilder({
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
	page.on("console", msg => console.log(msg.text()))
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
		errorEmbed
			.setDescription(
				`Hey there!\nWe noticed you sent us your Crowdin profile, however, you forgot to add your Discord tag to it! Just add ${member.user.tag} to your about section like shown in the image below. Once you've done so, send us the profile link again.\n\nIf you have any questions, be sure to send them to us!`,
			)
			.setImage("https://i.imgur.com/BM2bJ4W.png")
		if (sendDms) {
			await member
				.send({ embeds: [errorEmbed] })
				.then(
					async () =>
						await verifyLogs.send(
							`${member} forgot to add their Discord to their profile (<${url}>). Let's hope they fix that with the message I just sent them.`,
						),
				)
				.catch(async () => {
					errorEmbed.setFooter({ text: "This message will be deleted in a minute" })
					const msg = await verify.send({ content: `${member} you had DMs disabled, so here's our message,`, embeds: [errorEmbed] })
					await verifyLogs.send(
						`${member} forgot to add their Discord to their profile (<${url}>). Let's hope they fix that with the message I just sent in <#${ids.channels.verify}> since they had DMs off.`,
					)
					await setTimeout(60_000)
					await msg.delete().catch(() => null)
				})
		}
		if (sendLogs) await statsColl.insertOne({ type: "VERIFY", name: verifyType, user: member.id, error: true, errorMessage: "missingDiscordTag" })
		return
		// #endregion
	}

	const highestLangRoles: {
			[name: string]: {
				type: string
				projects: ValidProjects[]
			}
		} = {},
		highestProjectRoles: {
			[name: string]: string
		} = {}
	// eslint-disable-next-line no-var
	var veteranRole: Role | undefined // Yes we have to use var here
	const joinedProjects: string[] = []

	projects
		.filter(project => Object.keys(projectIDs).includes(project.id))
		.forEach(async project => {
			if (!project.contributed_languages?.length && !["owner", "manager"].includes(project.user_role) && projectIDs[project.id].langRoles)
				return removeProjectRoles("Hypixel", member)
			joinedProjects.push(projectIDs[project.id].name)

			if (project.user_role === "pending") return

			const role = project.contributed_languages?.length
				? project.contributed_languages.map(lang => ({
						lang: lang.code,
						role: lang.user_role.name,
				  }))
				: [{ role: project.user_role }]
			let highestRole = "Translator"
			role.forEach(r => {
				if (r.role !== "Translator") {
					if (r.role !== "Manager") highestRole = r.role
					if (highestRole === "manager" || highestRole === "owner") highestRole = "Manager"
				}
			})
			highestProjectRoles[projectIDs[project.id].name] = highestRole

			updateProjectRoles(projectIDs[project.id].name, member, project)
			if (projectIDs[project.id].langRoles) {
				project.contributed_languages?.forEach(lang => {
					if (highestLangRoles[lang.code] && highestLangRoles[lang.code].type !== "Proofreader" && lang.user_role?.name === "Proofreader") {
						highestLangRoles[lang.code].type = "Proofreader"
						highestLangRoles[lang.code].projects.push(projectIDs[project.id].name)
					} else if (!highestLangRoles[lang.code] && lang.user_role) {
						highestLangRoles[lang.code] = {
							type: lang.user_role.name,
							projects: [projectIDs[project.id].name],
						}
					}
				})
			}
			if (project.id === String(ids.projects.hypixel)) veteranRole = await veteranMedals(member, project)
		})

	updateLanguageRoles(highestLangRoles, member)
	Object.values(projectIDs)
		.map(i => i.name)
		.filter(pj => !joinedProjects.includes(pj))
		.forEach(project => removeProjectRoles(project, member))

	await member.roles.remove(ids.roles.alerted, "User is now Verified")
	await member.roles.add(ids.roles.verified, "User is now Verified")
	await usersColl.updateOne({ id: member.id }, { $set: { profile: url }, $unset: { unverifiedTimestamp: true } })

	const endingMessageProjects: {
		[name: string]: Role[]
	} = {}
	for (const [key, value] of Object.entries(highestProjectRoles))
		endingMessageProjects[key] = [member.guild!.roles.cache.find(r => r.name.toLowerCase() === `${key} ${value}`.toLowerCase())!]

	for (const [key, value] of Object.entries(highestLangRoles)) {
		const lang = (await languages.findOne({ id: key }))!.name
		value.projects.forEach(p => {
			endingMessageProjects[p].push(member.guild!.roles.cache.find(r => r.name === `${lang} ${value.type}`)!)
		})
	}

	const logEmbed = new EmbedBuilder({
		color: Colors.Blurple,
		title: `${member.user.tag} is now verified!`,
		description: Object.keys(endingMessageProjects).length
			? `${member} has received the following roles:`
			: `${member} has not received any roles. They do not translate for any of the projects.`,
	})

	if (Object.keys(endingMessageProjects).length)
		for (const [k, v] of Object.entries(endingMessageProjects)) logEmbed.addFields({ name: k, value: v.join(",\n") })

	// Set the user's language based off of their highest role if this is a manual verification
	if (sendDms) {
		const highestRole = Object.assign({}, endingMessageProjects)
			.Hypixel?.filter(r => r.color)
			.sort((a, b) => b.position - a.position)
			.shift()
		if (highestRole) {
			const lang = await languages.findOne({ name: highestRole.name.replace(" Translator", "").replace(" Proofreader", "") })
			if (lang) {
				await usersColl.updateOne(
					{ id: member.id, $or: [{ lang: "en" }, { lang: { $exists: false } }] },
					{ $set: { lang: lang.id.replace("-", "_") } },
				)
			}
		}
	}

	if (veteranRole) logEmbed.addFields({ name: "Veteran role", value: `${veteranRole}` })
	logEmbed.addFields({ name: "Profile", value: url })

	// #region return message
	const dmEmbed = new EmbedBuilder({
		color: Colors.Blurple,
		author: { name: "Received message from staff" },
		description: `Hey there!\nYou have successfully verified your Crowdin account${
			Object.keys(endingMessageProjects).length
				? ` and you also received the corresponding roles on our Discord server! Make sure to check out <#${ids.channels.gettingStarted}> if you want to learn more about Crowdin.`
				: "!\nSadly you didn't receive any roles because you don't translate for any of the projects we currently support.\nWhen you have started translating you can refresh your roles by running `/verify`"
		}\nIf you wanna know more about all the projects we currently support, run \`/projects\` here.`,
		footer: { text: "Any messages you send here will be sent to staff upon confirmation." },
	})

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

async function updateProjectRoles(projectName: ValidProjects, member: GuildMember, project: CrowdinProject) {
	if (project.user_role === "pending") return

	const languages = project.contributed_languages?.length
			? project.contributed_languages.map(lang => ({
					lang: lang.code,
					role: lang.user_role.name,
			  }))
			: [{ role: project.user_role }],
		addedProjectRoles = []

	member.roles.cache.forEach(role => {
		if (role.name.includes("Translator") || role.name.includes("Proofreader")) addedProjectRoles.push(role.name)
	})

	let highestRole = "translator"
	languages.forEach(language => {
		if (language.role !== "Translator") {
			if (language.role !== "Manager") highestRole = language.role.toLowerCase()
			if (highestRole === "manager" || highestRole === "owner") highestRole = "manager"
		}
	})

	const projectTransRole = member.guild.roles.cache.find(r => r.name === `${projectName} Translator`)!.id,
		projectProofRole = member.guild.roles.cache.find(r => r.name === `${projectName} Proofreader`)!.id,
		projectManagerRole = member.guild.roles.cache.find(r => r.name === `${projectName} Manager`)!.id

	if (highestRole === "translator") {
		await member.roles.remove(projectProofRole, "User no longer has this role on Crowdin")

		await member.roles.remove(projectManagerRole, "User no longer has this role on Crowdin")

		await member.roles.add(projectTransRole, "User has received this role on Crowdin")
	} else if (highestRole === "proofreader") {
		await member.roles.remove(projectTransRole, "User no longer has this role on Crowdin")

		await member.roles.remove(projectManagerRole, "User no longer has this role on Crowdin")

		await member.roles.add(projectProofRole, "User has received this role on Crowdin")
	} else {
		await member.roles.remove(projectTransRole, "User no longer has this role on Crowdin")

		await member.roles.remove(projectProofRole, "User no longer has this role on Crowdin")

		await member.roles.add(projectManagerRole, "User has received this role on Crowdin")
	}
}

async function updateLanguageRoles(
	highestLangRoles: {
		[name: string]: {
			type: string
			projects: ValidProjects[]
		}
	},
	member: GuildMember,
) {
	const activeRoles: string[] = [],
		addedRoles: string[] = []

	for (const [key, value] of Object.entries(highestLangRoles))
		activeRoles.push(`${(await db.collection<MongoLanguage>("languages").findOne({ id: key }))!.name} ${value.type}`)

	member.roles.cache.forEach(role => {
		if (role.name.includes("Translator") || role.name.includes("Proofreader")) addedRoles.push(role.name)
	})

	activeRoles
		.filter(pj => !addedRoles.includes(pj))
		.forEach(async p => await member.roles.add(member.guild.roles.cache.find(r => r.name === p)!.id, "User has received this role on Crowdin"))

	addedRoles
		.filter(r => !activeRoles.includes(r))
		.filter(pj => {
			const exclude = Object.values(projectIDs).map(i => i.name)
			let included = true
			for (let i = 0; i < exclude.length; i++) if (pj.includes(exclude[i])) included = false

			return included
		})
		.forEach(async role => {
			await member.roles.remove(member.guild.roles.cache.find(r => r.name === role)!.id, "User no longer has this role on Crowdin")
		})
}

async function removeProjectRoles(projectName: ValidProjects, member: GuildMember) {
	await member.roles.remove(
		member.guild.roles.cache.find(r => r.name === `${projectName} Translator`)!.id,
		"User is no longer in this Crowdin project",
	)

	await member.roles.remove(
		member.guild.roles.cache.find(r => r.name === `${projectName} Proofreader`)!.id,
		"User is no longer in this Crowdin project",
	)

	await member.roles.remove(member.guild.roles.cache.find(r => r.name === `${projectName} Manager`)!.id, "User is no longer in this Crowdin project")
}

async function veteranMedals(member: GuildMember, project: CrowdinProject) {
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
	if (role.unicodeEmoji !== medals[years]) await role.setUnicodeEmoji(medals[years], "The emoji was wrong for some reason")
	if (!member.roles.cache.has(role.id)) {
		member.roles.cache
			.filter(r => r.name.endsWith(" Veteran"))
			.forEach(async oldRole => await member.roles.remove(oldRole.id, "Giving a new Veteran role"))
		await member.roles.add(role.id, `Been on the Hypixel project for ${years === 1 ? `${years} year` : `${years} years`}`)
	}
	return role
}

function removeAllRoles(member: GuildMember) {
	const roles = member.roles.cache.filter(
		r => r.name.endsWith(" Translator") || r.name.endsWith(" Proofreader") || r.name.endsWith(" Manager") || r.name.endsWith(" Veteran"),
	)
	roles.forEach(async role => await member.roles.remove(role, "Removing all roles from user"))
}

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
			alias: string
			name: string
		}
	}[]
}
