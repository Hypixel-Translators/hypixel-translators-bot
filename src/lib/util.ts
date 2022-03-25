// This file contains a bunch of functions used across the bot on multuple commands.
import { readdirSync } from "node:fs"
import process from "node:process"
import { setInterval } from "node:timers"

import axios from "axios"
import {
	ChatInputCommandInteraction,
	GuildMember,
	MessageActionRow,
	MessageButton,
	MessageEmbed,
	NewsChannel,
	Role,
	Snowflake,
	TextChannel,
	User,
} from "discord.js"
import puppeteer from "puppeteer"
import { v4 } from "uuid"

import { db } from "./dbclient"

import { ids } from "../config.json"
import { client } from "../index"

import type { GetStringFunction } from "./imports"
import type { ResponseObject, TranslationStatusModel } from "@crowdin/crowdin-api-client"

// #region Variables

export const fetchSettings = { headers: { "User-Agent": "Hypixel Translators Bot" }, timeout: 30_000 }

// Browser-related variables, not exported
let browser: puppeteer.Browser | null = null,
	interval: NodeJS.Timeout | null = null,
	lastRequest = 0,
	browserClosing = false,
	browserOpening = false
const activeConnections: string[] = []

// #endregion

// #region Functions

export function arrayEqual(a: unknown, b: unknown) {
	if (a === b) return true

	if (!Array.isArray(a) || !Array.isArray(b)) return false

	// .concat() to not mutate arguments
	let arr1 = a.concat().sort(),
		arr2 = b.concat().sort()

	// Remove duplicated values
	arr1 = arr1.filter((item: string, index: number) => arr1.indexOf(item) === index)
	arr2 = arr2.filter((item: string, pos: number) => arr2.indexOf(item) === pos)

	for (let i = 0; i < arr1.length; i++) if (arr1[i] !== arr2[i]) return false

	return true
}

export async function closeConnection(uuid: string) {
	//* Check if connection exists. If it does, remove connection from connection list.
	const index = activeConnections.indexOf(uuid)
	if (~index) activeConnections.splice(index, 1)

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

export function generateTip(getString?: GetStringFunction, newLang?: string): string {
	const strings = require("../../strings/en/global.json"),
		keys = getString ? Object.keys(getString("tips", { file: "global" })) : Object.keys(strings.tips)

	return getString
		? `${getString("tip", { file: "global", lang: newLang }).toUpperCase()}: ${getString(`tips.${keys[(keys.length * Math.random()) << 0]}`, {
				variables: {
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
					feedback: "/feedback",
				},
				file: "global",
				lang: newLang,
		  })}`
		: `${strings.tip.toUpperCase()}: ${strings.tips[keys[(keys.length * Math.random()) << 0]]
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

export async function getActivePunishments(user: User) {
	const punishExpireTimestamp = new Date().setDate(new Date().getDate() - 30), // Timestamp 30 days ago in ms
		warnExpireTimestamp = new Date().setDate(new Date().getDate() - 7), // Timestamp 7 days ago in ms
		verbalExpireTimestamp = new Date().setDate(new Date().getDate() - 1) // Timestamp 7 days ago in ms
	return (await db.collection<PunishmentLog>("punishments").find({ id: user.id }).toArray()).filter(punishment => {
		if (punishment.revoked || !punishment.points) return false
		else if (punishment.type === "VERBAL") return punishment.timestamp > verbalExpireTimestamp
		else if (punishment.type === "WARN") return punishment.timestamp > warnExpireTimestamp
		else if (punishment.ended) return punishment.endTimestamp! > punishExpireTimestamp
		else return true
	})
}

export async function getBrowser() {
	//* If browser is currently closing wait for it to fully close.
	await new Promise<void>(resolve => {
		const timer = setInterval(() => {
			if (!browserClosing) {
				clearInterval(timer)
				resolve()
			}
		}, 100)
	})

	lastRequest = Date.now()

	//* Open a browser if there isn't one already.
	await new Promise<void>(resolve => {
		const timer = setInterval(() => {
			if (!browserOpening) {
				clearInterval(timer)
				resolve()
			}
		}, 100)
	})
	if (!browser) {
		browserOpening = true
		browser = await puppeteer.launch({
			args: ["--no-sandbox"],
			headless: process.env.NODE_ENV === "production" || process.platform === "linux",
		})
		browserOpening = false
	}

	//* Add closing interval if there isn't one already.
	interval ??= setInterval(async () => {
		if (lastRequest < Date.now() - 15 * 60 * 1000) {
			await browser!.close()
			browser = null
			clearInterval(interval!)
			interval = null
		}
	}, 5000)

	//* Open new connection and return the browser with connection id.
	const browserUUID = v4()
	activeConnections.push(browserUUID)
	return { pupBrowser: browser, uuid: browserUUID }
}

export async function getInviteLink() {
	const guild = client.guilds.cache.get(ids.guilds.main)!,
		inviteCode =
			(await guild
				.fetchVanityData()
				.then(v => v.code)
				.catch(() => null)) ?? (await guild.invites.fetch().then(invites => invites.find(i => i.channelId === ids.channels.verify)!.code))!
	return `https://discord.gg/${inviteCode}`
}

export async function getMCProfile(uuid: string) {
	return await axios
		.get<MinecraftProfile>(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`, fetchSettings)
		.then(json => json.data)
		.catch(() => null)
}

export async function getUUID(username: string): Promise<string | null> {
	return await axios
		.get(`https://api.mojang.com/users/profiles/minecraft/${username}`, fetchSettings)
		.then(data => data.data.id ?? null)
		.catch(() => null)
}

// Source: https://github.com/Mee6/Mee6-documentation/blob/master/docs/levels_xp.md
export const getXpNeeded = (lvl = NaN, xp = 0) => 5 * lvl ** 2 + 50 * lvl + 100 - xp

// Support for syntax highlighting inside graphql strings (with the right extensions) (also makes it a one liner)
export function gql(cleanText: TemplateStringsArray, ...substitutions: unknown[]) {
	let returnQuery = ""
	for (let i = 0; i < cleanText.length; i++) returnQuery += cleanText[i] + (substitutions[i] ?? "")

	return returnQuery.replaceAll("\t", "").replaceAll("\n", " ")
}

export function parseToNumberString(num: number, getString: GetStringFunction): string {
	if (num >= 1_000_000) {
		return `${Number((num / 1_000_000).toFixed(2)).toLocaleString(getString("region.dateLocale", { file: "global" }))}${getString(
			"numberStrings.million",
			{
				file: "global",
			},
		)}`
	}
	if (num >= 1000) {
		return `${Number((num / 1000).toFixed(2)).toLocaleString(getString("region.dateLocale", { file: "global" }))}${getString(
			"numberStrings.thousand",
			{
				file: "global",
			},
		)}`
	}
	return `${num}`
}

export async function restart(interaction?: ChatInputCommandInteraction) {
	await axios.delete("https://api.heroku.com/apps/hypixel-translators/dynos", {
		headers: {
			"User-Agent": `${interaction?.user.tag ?? client.user.tag}`,
			Authorization: `Bearer ${process.env.HEROKU_API}`,
			Accept: "application/vnd.heroku+json; version=3",
		},
	})
}

export async function sendHolidayMessage(holidayName: "easter" | "halloween" | "christmas" | "newYear") {
	let strings: HolidayStrings | null = require("../../strings/en/holidays.json")
	const holiday: string[] = [],
		log: { [Language: string]: string } = {}
	holiday.push(strings![holidayName])
	readdirSync("./strings").forEach(lang => {
		if (lang === "empty") return
		try {
			strings = require(`../../strings/${lang}/holidays.json`)
		} catch {
			strings = null
		}
		if (!strings) return
		if (!holiday.includes(strings[holidayName])) {
			holiday.push(strings[holidayName])
			log[lang] = strings[holidayName]
		}
	})
	let logMsg = ""
	for (const lang in log) {
		if (!Object.prototype.hasOwnProperty.call(log, lang)) continue

		logMsg = logMsg.concat(`${lang}: ${log[lang]}\n`)
	}
	const announcement = holiday.join(" "),
		announcements = client.channels.cache.get(ids.channels.announcements) as NewsChannel,
		adminBots = client.channels.cache.get(ids.channels.adminBots) as TextChannel,
		holidayNameFormatted = holidayName.charAt(0).toUpperCase() + holidayName.slice(1).replace(/([A-Z])/, " $1")
	if (announcement) {
		await announcements.send(`${announcement}\n\n - From the Hypixel Translators Team. ❤`).then(msg => msg.crosspost())
		await adminBots.send(`${holidayNameFormatted} announcement sent! Here's each language's translation:\n${logMsg}`)
		console.table(log)
		console.log(`Sent the ${holidayNameFormatted} announcement`)
	} else
		return await adminBots.send(`For some reason there is nothing in the ${holidayNameFormatted} announcement so I can't send it. Fix your code bro.`)
}

export function transformDiscordLocale(discordLocale: string): string {
	if (discordLocale === "uk") return "ua"
	const localeWithCountryCode = discordLocale.replace(/([a-z]+)(?:-([A-Z]+))?/, (_, a, b) => (b ? `${a}${b.toLowerCase()}` : a)),
		locale = discordLocale.replace(/([a-z]+)(?:-([A-Z]+))?/, "$1"),
		locales = readdirSync("./strings")

	if (locales.includes(localeWithCountryCode)) return localeWithCountryCode
	else if (locales.includes(locale)) return locale
	else return "en"
}

export function createButtonControls(
	pageIndex: number,
	pages: unknown[],
	options: { getString?: GetStringFunction; itemName?: string } = { itemName: "page" },
) {
	const isFirst = pageIndex === 0,
		isLast = pageIndex === pages.length - 1,
		disabledStyle = (disabled: boolean) => (disabled ? "SECONDARY" : "SUCCESS")

	return new MessageActionRow({
		components: [
			new MessageButton({
				style: disabledStyle(isFirst),
				emoji: "⏮️",
				customId: "first",
				label: options.getString?.("pagination.first", { file: "global" }) ?? `First ${options.itemName}`,
				disabled: isFirst,
			}),
			new MessageButton({
				style: disabledStyle(isFirst),
				emoji: "◀️",
				customId: "previous",
				label: options.getString?.("pagination.previous", { file: "global" }) ?? `Previous ${options.itemName}`,
				disabled: isFirst,
			}),
			new MessageButton({
				style: disabledStyle(isLast),
				emoji: "▶️",
				customId: "next",
				label: options.getString?.("pagination.next", { file: "global" }) ?? `Next ${options.itemName}`,
				disabled: isLast,
			}),
			new MessageButton({
				style: disabledStyle(isLast),
				emoji: "⏭️",
				customId: "last",
				label: options.getString?.("pagination.last", { file: "global" }) ?? `Last ${options.itemName}`,
				disabled: isLast,
			}),
		],
	})
}

export function updateModlogFields(embed: MessageEmbed, modlog: PunishmentLog, modlogs?: PunishmentLog[]) {
	embed.setAuthor({ name: "Log message", url: `https://discord.com/channels/${ids.guilds.main}/${ids.channels.punishments}/${modlog.logMsg}` })
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
			{
				name: modlog.ended ? "Ended" : "Ends",
				value: modlog.endTimestamp ? `<t:${Math.round(modlog.endTimestamp / 1000)}:R>` : "Never",
				inline: true,
			},
			{ name: modlog.revoked ? "Revoked by" : "Revoked", value: modlog.revoked ? `<@!${modlog.revokedBy}>` : "No", inline: true },
		)
	} else {
		embed.setFields(
			{ name: "Moderator", value: `<@!${modlog.moderator}>`, inline: true },
			{ name: "Applied on", value: `<t:${Math.round(modlog.timestamp / 1000)}:F>`, inline: true },
			{ name: expireTimestamp > Date.now() ? "Expires" : "Expired", value: `<t:${Math.round(expireTimestamp / 1000)}:R>`, inline: true },

			{ name: "Type", value: modlog.type, inline: true },
			{ name: "Points", value: `${modlog.points ?? "N/A"}`, inline: true },
			{ name: "Reason", value: modlog.reason, inline: true },
		)
	}
	if (modlogs) {
		embed.setDescription(`Case #${modlog.case}`).setFooter({
			text: `Modlog ${modlogs.indexOf(modlog) + 1}/${modlogs.length}`,
			iconURL: embed.footer!.iconURL!,
		})
	}
	return embed
}

export async function updateRoles(member: GuildMember): Promise<void>
export async function updateRoles(member: GuildMember, json: GraphQLQuery["data"]["players"]["player"]): Promise<Role>
export async function updateRoles(member: GuildMember, json?: GraphQLQuery["data"]["players"]["player"]): Promise<Role | void> {
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
		ids.roles.hypixelStaff,
	]
	if (!json) return void (await member.roles.remove(roles, "Unverified"))
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

// #endregion

// #region Interfaces/Types

export interface CrowdinProject {
	id: number
	identifier: string
	name: string
	shortName: string
	stringCount: number
	lastBuild?: number
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

interface HolidayStrings {
	easter: string
	halloween: string
	christmas: string
	newYear: string
}

export interface MongoLanguage {
	name: string
	emoji: string
	color?: number
	code: string
	id: string
	flag: string
	botLang?: true
}

export interface LanguageStatus extends ResponseObject<TranslationStatusModel.LanguageProgress> {
	language: MongoLanguage
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

export interface PunishmentLog {
	case: number
	id: Snowflake
	type: "VERBAL" | "WARN" | "MUTE" | "BAN" | "UNMUTE" | "UNBAN"
	points?: PunishmentPoints
	reason: string
	timestamp: number
	duration?: number
	endTimestamp?: number
	ended?: boolean
	revoked?: true
	revokedBy?: Snowflake
	moderator: Snowflake
	logMsg: Snowflake
}

export type PunishmentPoints = 1 | 2 | 3 | 4 | 5 | 6

export interface Quote {
	author: Snowflake[]
	id: number
	quote: string
	url?: string
	imageURL?: string
}

export interface Stats {
	type: "COMMAND" | "MESSAGE" | "STRINGS" | "VERIFY"
	name: string
	user?: Snowflake
	value?: number
	error?: boolean
	errorMessage?: string
}

// #endregion
