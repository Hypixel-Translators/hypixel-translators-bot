//This file contains a bunch of functions used across the bot on multuple commands.
import axios from "axios"
import { CommandInteraction, GuildMember, HexColorString, MessageActionRow, MessageButton, MessageEmbed, Snowflake, User } from "discord.js"
import { Browser, launch } from "puppeteer"
import { v4 } from "uuid"
import { db } from "./dbclient"
import { client } from "../index"
import { ids } from "../config.json"

import type { GetStringFunction } from "./imports"

// source: https://github.com/Mee6/Mee6-documentation/blob/master/docs/levels_xp.md
export const getXpNeeded = (lvl = NaN, xp = 0) => 5 * (lvl ** 2) + (50 * lvl) + 100 - xp

export function updateButtonColors(row: MessageActionRow, page: number, pages: any[]) {
	if (page == 0) {
		row.components.forEach(button => {
			if (button.customId === "first" || button.customId === "previous") (button as MessageButton)
				.setStyle("SECONDARY")
				.setDisabled(true)
			else (button as MessageButton)
				.setStyle("SUCCESS")
				.setDisabled(false)
		})
	} else if (page == pages.length - 1) {
		row.components.forEach(button => {
			if (button.customId === "last" || button.customId === "next") (button as MessageButton)
				.setStyle("SECONDARY")
				.setDisabled(true)
			else (button as MessageButton)
				.setStyle("SUCCESS")
				.setDisabled(false)
		})
	} else {
		row.components.forEach(button => (button as MessageButton)
			.setStyle("SUCCESS")
			.setDisabled(false)
		)
	}
	return row
}

export const fetchSettings = { headers: { "User-Agent": "Hypixel Translators Bot" }, timeout: 30_000 },
	crowdinFetchSettings = {
		headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.CTOKEN_V2}`, "User-Agent": "Hypixel Translators Bot" },
		timeout: 10_000
	}

export async function getUUID(username: string): Promise<string | undefined> {
	return await axios.get(`https://api.mojang.com/users/profiles/minecraft/${username}`, fetchSettings)
		.then(data => data.data.id)
		.catch(() => {
			return
		})
}

export async function getMCProfile(uuid: string) {
	return await axios.get<MinecraftProfile>(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`, fetchSettings)
		.then(json => json.data)
		.catch(() => null)
}

interface MinecraftProfile {
	id: string
	name: string
	properties: {
		name: string
		value: string
		signature?: string
	}[]
}

export async function updateRoles(member: GuildMember, json?: GraphQLQuery["data"]["players"]["player"]) {
	const roles: Snowflake[] = [
		ids.roles.unranked,
		ids.roles.vip,
		ids.roles.vipPlus,
		ids.roles.mvp,
		ids.roles.mvpPlus,
		ids.roles.mvpPlusPlus,
		ids.roles.youtuber,
		ids.roles.hypixelGm,
		ids.roles.hypixelAdmin,
		ids.roles.hypixelStaff
	]
	if (!json) return await member.roles.remove(roles, "Unverified")
	let role = member.guild.roles.cache.get(ids.roles.unranked)!
	switch (json.rank) {
		case "ADMIN":
			roles.splice(roles.indexOf(ids.roles.hypixelAdmin), 1)
			roles.splice(roles.indexOf(ids.roles.hypixelStaff), 1)
			await member.roles.remove(roles, "Updated roles")
			await member.roles.add([ids.roles.hypixelAdmin, ids.roles.hypixelStaff], `Successfully verified as ${json.username}`)
			role = member.guild.roles.cache.get(ids.roles.hypixelAdmin)!
			break
		case "GAME_MASTER":
			roles.splice(roles.indexOf(ids.roles.hypixelGm), 1)
			roles.splice(roles.indexOf(ids.roles.hypixelStaff), 1)
			await member.roles.remove(roles, "Updated roles")
			await member.roles.add([ids.roles.hypixelGm, ids.roles.hypixelStaff], `Successfully verified as ${json.username}`)
			break
		case "YOUTUBER":
			roles.splice(roles.indexOf(ids.roles.youtuber), 1)
			await member.roles.remove(roles, "Updated roles")
			await member.roles.add(ids.roles.youtuber, `Successfully verified as ${json.username}`)
			role = member.guild.roles.cache.get(ids.roles.youtuber)!
			break
		case "MVP_PLUS_PLUS":
			roles.splice(roles.indexOf(ids.roles.mvpPlusPlus), 1)
			await member.roles.remove(roles, "Updated roles")
			await member.roles.add(ids.roles.mvpPlusPlus, `Successfully verified as ${json.username}`)
			role = member.guild.roles.cache.get(ids.roles.mvpPlusPlus)!
			break
		case "MVP_PLUS":
			roles.splice(roles.indexOf(ids.roles.mvpPlus), 1)
			await member.roles.remove(roles, "Updated roles")
			await member.roles.add(ids.roles.mvpPlus, `Successfully verified as ${json.username}`)
			role = member.guild.roles.cache.get(ids.roles.mvpPlus)!
			break
		case "MVP":
			roles.splice(roles.indexOf(ids.roles.mvp), 1)
			await member.roles.remove(roles, "Updated roles")
			await member.roles.add(ids.roles.mvp, `Successfully verified as ${json.username}`)
			role = member.guild.roles.cache.get(ids.roles.mvp)!
			break
		case "VIP_PLUS":
			roles.splice(roles.indexOf(ids.roles.vipPlus), 1)
			await member.roles.remove(roles, "Updated roles")
			await member.roles.add(ids.roles.vipPlus, `Successfully verified as ${json.username}`)
			role = member.guild.roles.cache.get(ids.roles.vipPlus)!
			break
		case "VIP":
			roles.splice(roles.indexOf(ids.roles.vip), 1)
			await member.roles.remove(roles, "Updated roles")
			await member.roles.add(ids.roles.vip, `Successfully verified as ${json.username}`)
			role = member.guild.roles.cache.get(ids.roles.vip)!
			break
		default:
			roles.splice(roles.indexOf(ids.roles.unranked), 1)
			await member.roles.remove(roles, "Updated roles")
			await member.roles.add(ids.roles.unranked, `Successfully verified as ${json.username}`)
			break
	}
	return role
}

// support for syntax highlighting inside graphql strings (with the right extensions) (also makes it a one liner)
export function gql(cleanText: TemplateStringsArray, ...substitutions: any[]) {
	let returnQuery = ""
	for (let i = 0; i < cleanText.length; i++) {
		returnQuery += cleanText[i] + (substitutions[i] ?? "")
	}
	return returnQuery.replaceAll("\t", "").replaceAll("\n", " ")
}

export interface GraphQLQuery {
	errors?: {
		message: string
		locations: {
			line: number
			column: number
		}[]
		path: string[]
	}[]
	data: {
		players: {
			player: {
				uuid: string
				username: string
				online: boolean
				rank: string
				rank_formatted: string
				prefix: string | null
				level: number
				achievement_points: number
				first_login: number
				last_login: number | null
				last_logout: number | null
				last_game: string | null
				language: string
				links: {
					TWITTER: string | null
					YOUTUBE: string | null
					INSTAGRAM: string | null
					TWITCH: string | null
					DISCORD: string | null
					HYPIXEL: string | null
				}
			}
		}
		guild: {
			guild: true | null
			name: string
			created: number
			tag: string | null
			tag_color: string
			level: number
			description: string | null
			guild_master: {
				uuid: string
				rank: string
			}
			members: {
				uuid: string
				rank: string
			}[]
			ranks: {
				name: string
			}[]
		}
	}
}

export interface LanguageStatus {
	data: {
		languageId: string,
		words: {
			total: number,
			translated: number,
			approved: number
		},
		phrases: {
			total: number,
			translated: number,
			approved: number
		},
		translationProgress: number,
		approvalProgress: number
	},
	language: LangDbEntry
}

export interface LangDbEntry {
	name: string,
	emoji: string,
	color?: HexColorString,
	code: string,
	id: string
	flag: string
}

export interface CrowdinProject {
	id: string
	identifier: string
	name: string
	shortName: string
	stringCount: number
	lastBuild?: number
}

export interface EventDb {
	name: "event"
	ids: Snowflake[]
}

export interface Quote {
	author: Snowflake[]
	id: number
	quote: string
	url?: string
	imageURL?: string
}

export async function restart(interaction?: CommandInteraction) {
	await axios.delete("https://api.heroku.com/apps/hypixel-translators/dynos", {
		headers: {
			"User-Agent": `${interaction?.user.tag ?? client.user.tag}`,
			Authorization: `Bearer ${process.env.HEROKU_API}`,
			Accept: "application/vnd.heroku+json; version=3"
		}
	})
}

export async function getActivePunishments(user: User) {
	const punishExpireTimestamp = new Date().setDate(new Date().getDate() - 30), //Timestamp 30 days ago in ms
		warnExpireTimestamp = new Date().setDate(new Date().getDate() - 7), //Timestamp 7 days ago in ms
		verbalExpireTimestamp = new Date().setDate(new Date().getDate() - 1) //Timestamp 7 days ago in ms
	return (await db.collection<PunishmentLog>("punishments").find({ id: user.id }).toArray()).filter(punishment => {
		if (punishment.revoked || !punishment.points) return false
		else if (punishment.type === "VERBAL") return punishment.timestamp > verbalExpireTimestamp
		else if (punishment.type === "WARN") return punishment.timestamp > warnExpireTimestamp
		else if (punishment.ended) return punishment.endTimestamp! > punishExpireTimestamp
		else return true
	})
}

export function updateModlogFields(embed: MessageEmbed, modlog: PunishmentLog, modlogs?: PunishmentLog[]) {
	embed.setAuthor({ name: "Log message", url: `https://discord.com/channels/549503328472530974/800820574405656587/${modlog.logMsg}` })
	const expireTimestamp =
		modlog.type === "VERBAL"
			? new Date(modlog.timestamp).setDate(new Date(modlog.timestamp).getDate() + 1)
			: modlog.type === "WARN"
				? new Date(modlog.timestamp).setDate(new Date(modlog.timestamp).getDate() + 7)
				: new Date(modlog.endTimestamp ?? modlog.timestamp).setDate(new Date(modlog.endTimestamp ?? modlog.timestamp).getDate() + 30)
	if (typeof modlog.duration === "number") {
		embed.setFields(
			{ name: "Moderator", value: `<@!${modlog.moderator}>`, inline: true },
			{ name: "Applied on", value: `<t:${Math.round(modlog.timestamp / 1000)}:F>`, inline: true },
			{ name: expireTimestamp > Date.now() ? "Expires" : "Expired", value: `<t:${Math.round(expireTimestamp / 1000)}:R>`, inline: true },

			{ name: "Type", value: modlog.type, inline: true },
			{ name: "Duration", value: modlog.duration ? `${modlog.duration} ${modlog.type === "BAN" ? "days" : "hours"}` : "Permanent", inline: true },
			{ name: "Points", value: `${modlog.points ?? "N/A"}`, inline: true },

			{ name: "Reason", value: modlog.reason, inline: true },
			{ name: modlog.ended ? "Ended" : "Ends", value: modlog.endTimestamp ? `<t:${Math.round(modlog.endTimestamp / 1000)}:R>` : "Never", inline: true },
			{ name: modlog.revoked ? "Revoked by" : "Revoked", value: modlog.revoked ? `<@!${modlog.revokedBy}>` : "No", inline: true }
		)
	} else {
		embed.setFields(
			{ name: "Moderator", value: `<@!${modlog.moderator}>`, inline: true },
			{ name: "Applied on", value: `<t:${Math.round(modlog.timestamp / 1000)}:F>`, inline: true },
			{ name: expireTimestamp > Date.now() ? "Expires" : "Expired", value: `<t:${Math.round(expireTimestamp / 1000)}:R>`, inline: true },

			{ name: "Type", value: modlog.type, inline: true },
			{ name: "Points", value: `${modlog.points ?? "N/A"}`, inline: true },
			{ name: "Reason", value: modlog.reason, inline: true }
		)
	}
	if (modlogs) embed
		.setDescription(`Case #${modlog.case}`)
		.setFooter(
			`Modlog ${modlogs.indexOf(modlog) + 1}/${modlogs.length}`,
			embed.footer!.iconURL
		)
	return embed
}


export function arrayEqual(a: any, b: any) {
	if (a == b) return true

	if (!Array.isArray(a) || !Array.isArray(b)) return false

	// .concat() to not mutate arguments
	let arr1 = a.concat().sort(),
		arr2 = b.concat().sort()

	// Remove duplicated values
	arr1 = arr1.filter((item: string, index: number) => arr1.indexOf(item) == index)
	arr2 = arr2.filter((item: string, pos: number) => arr2.indexOf(item) == pos)

	for (let i = 0; i < arr1.length; i++) {
		if (arr1[i] !== arr2[i]) return false
	}

	return true
}

export function generateTip(getString?: GetStringFunction, newLang?: string): string {
	const strings = require("../../strings/en/global.json"),
		keys = getString ? Object.keys(getString("tips", "global")) : Object.keys(strings.tips)

	return getString
		? `${getString("tip", "global", newLang).toUpperCase()}: ${getString(
			`tips.${keys[(keys.length * Math.random()) << 0]}`,
			{
				langIb: "/language set language:ib",
				translate: "/translate",
				prefix: "/prefix",
				bots: "#bots",
				gettingStarted: "#getting-started",
				twitter: "https://twitter.com/HTranslators",
				rules: "#rules",
				serverInfo: "#server-info",
				hypixelstats: "/hypixelstats",
				languagestats: "/languagestats",
				verify: "/verify",
				langList: "/language list",
				botUpdates: "#bot-updates",
				feedback: "/feedback"
			},
			"global",
			newLang
		)}`
		: `${strings.tip.toUpperCase()}: ${strings.tips[keys[keys.length * Math.random() << 0]]
			.replace("%%langIb%%", "/language set language:ib")
			.replace("%%translate%%", "/translate")
			.replace("%%prefix%%", "/prefix")
			.replace("%%bots%%", "#bots")
			.replace("%%gettingStarted%%", "#getting-started")
			.replace("%%twitter%%", "https://twitter.com/HTranslators")
			.replace("%%rules%%", "#rules")
			.replace("%%serverInfo%%", "#server-info")
			.replace("%%hypixelstats%%", "/hypixelstats")
			.replace("%%languagestats%%", "/languagestats")
			.replace("%%verify%%", "/verify")
			.replace("%%langList%%", "/language list")
			.replace("%%botUpdates%%", "#bot-updates")
			.replace("%%feedback%%", "/feedback")}`
}

export interface PunishmentLog {
	case: number
	id: Snowflake
	type: "VERBAL" | "WARN" | "MUTE" | "BAN" | "UNMUTE" | "UNBAN"
	points?: PunishmentPoints
	reason: string
	timestamp: number
	duration?: number
	endTimestamp?: number
	ended?: boolean,
	revoked?: true
	revokedBy?: Snowflake
	moderator: Snowflake,
	logMsg: Snowflake
}

export type PunishmentPoints = 1 | 2 | 3 | 4 | 5 | 6

export interface Stats {
	type: "COMMAND" | "MESSAGE" | "STRINGS" | "VERIFY"
	name: string
	user?: Snowflake
	value?: number
	error?: boolean
	errorMessage?: string
}

let browser: Browser | null = null,
	interval: NodeJS.Timeout | null = null,
	lastRequest = 0,
	browserClosing = false,
	browserOpening = false
const activeConnections: string[] = []

/**
 * Returns the browser and a connection ID.
 */
export async function getBrowser() {
	//* If browser is currently closing wait for it to fully close.
	await new Promise<void>((resolve) => {
		const timer = setInterval(() => {
			if (!browserClosing) {
				clearInterval(timer)
				resolve()
			}
		}, 100)
	})

	lastRequest = Date.now()

	//* Open a browser if there isn't one already.
	await new Promise<void>((resolve) => {
		const timer = setInterval(() => {
			if (!browserOpening) {
				clearInterval(timer)
				resolve()
			}
		}, 100)
	})
	if (!browser) {
		browserOpening = true
		browser = await launch({
			args: ["--no-sandbox"],
			headless: process.env.NODE_ENV === "production" || process.platform === "linux"
		})
		browserOpening = false
	}

	//* Add closing interval if there isn't one already.
	if (!interval) {
		interval = setInterval(async () => {
			if (lastRequest < Date.now() - 15 * 60 * 1000) {
				await browser!.close()
				browser = null
				clearInterval(interval!)
				interval = null
			}
		}, 5000)
	}

	//* Open new connection and return the browser with connection id.
	const browserUUID = v4()
	activeConnections.push(browserUUID)
	return { pupBrowser: browser, uuid: browserUUID }
}

/**
 * Close connection, and close browser if there are no more connections.
 * @param {string} uuid The connection ID
 */
export async function closeConnection(uuid: string) {
	//* Check if connection exists. If it does remove connection from connection list.
	const index = activeConnections.indexOf(uuid)
	if (index > -1) activeConnections.splice(index, 1)

	//* Close browser if connection list is empty.
	if (!activeConnections.length) {
		browserClosing = true
		await browser!.close()
		browser = null
		clearInterval(interval!)
		interval = null
		browserClosing = false
	}
}
