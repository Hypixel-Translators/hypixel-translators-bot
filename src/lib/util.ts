//This file contains a bunch of functions used across the bot on multuple commands.
import Discord from "discord.js"
import axios from "axios"
import { client, GetStringFunction } from "../index"
import { db } from "./dbclient"

// source: https://github.com/Mee6/Mee6-documentation/blob/master/docs/levels_xp.md
export const getXpNeeded = (lvl = NaN, xp = 0) => 5 * (lvl ** 2) + (50 * lvl) + 100 - xp

export function updateButtonColors(row: Discord.MessageActionRow, page: number, pages: any[]) {
	if (page == 0) {
		row.components.forEach(button => {
			if (button.customId === "first" || button.customId === "previous") (button as Discord.MessageButton)
				.setStyle("SECONDARY")
				.setDisabled(true)
			else (button as Discord.MessageButton)
				.setStyle("SUCCESS")
				.setDisabled(false)
		})
	} else if (page == pages.length - 1) {
		row.components.forEach(button => {
			if (button.customId === "last" || button.customId === "next") (button as Discord.MessageButton)
				.setStyle("SECONDARY")
				.setDisabled(true)
			else (button as Discord.MessageButton)
				.setStyle("SUCCESS")
				.setDisabled(false)
		})
	} else {
		row.components.forEach(button => (button as Discord.MessageButton)
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

export async function updateRoles(member: Discord.GuildMember, json?: GraphQLQuery["data"]["players"]["player"]) {
	const roles: Discord.Snowflake[] = [
		"816435344689987585", //Unranked
		"808032608456802337", //VIP
		"808032624215457823", //VIP+
		"808032640631832637", //MVP
		"808032657505255424", //MVP+
		"808032672160153641", //MVP++
		"808032689709514852", //YouTuber
		"551758392339857418", //Hypixel Helper
		"551758392021090304", //Hypixel Mod
		"822787676482699297", //Hypixel Game Master
		"624880339722174464", //Hypixel Admin
		"715674953697198141"  //Hypixel Staff
	]
	if (!json) return await member.roles.remove(roles, "Unverified")
	let role = member.guild.roles.cache.get("816435344689987585")!, rolesToGive: Discord.Snowflake[] = []
	switch (json.rank) {
		case "ADMIN":
			rolesToGive = ["624880339722174464", "715674953697198141"] // Hypixel Admin and Hypixel Staff
			member.roles.cache.forEach(r => { if (rolesToGive.includes(r.id)) rolesToGive.splice(rolesToGive.indexOf(r.id), 1) })
			roles.splice(roles.indexOf("624880339722174464"), 1) // Hypixel Admin
			roles.splice(roles.indexOf("715674953697198141"), 1) // Hypixel Staff
			await member.roles.remove(roles, "Updated roles")
			await member.roles.add(rolesToGive, `Successfully verified as ${json.username}`)
			role = member.guild.roles.cache.get("624880339722174464")!
			break
		case "GAME_MASTER":
			rolesToGive = ["822787676482699297", "715674953697198141"] // Hypixel Game Master and Hypixel Staff
			member.roles.cache.forEach(r => { if (rolesToGive.includes(r.id)) rolesToGive.splice(rolesToGive.indexOf(r.id), 1) })
			roles.splice(roles.indexOf("822787676482699297"), 1) // Hypixel Game Master
			roles.splice(roles.indexOf("715674953697198141"), 1) // Hypixel Staff
			await member.roles.remove(roles, "Updated roles")
			await member.roles.add(rolesToGive, `Successfully verified as ${json.username}`)
			break
		case "MODERATOR":
			rolesToGive = ["551758392021090304", "715674953697198141"] // Hypixel Mod and Hypixel Staff
			member.roles.cache.forEach(r => { if (rolesToGive.includes(r.id)) rolesToGive.splice(rolesToGive.indexOf(r.id), 1) })
			roles.splice(roles.indexOf("551758392021090304"), 1) // Hypixel Moderator
			roles.splice(roles.indexOf("715674953697198141"), 1) // Hypixel Staff
			await member.roles.remove(roles, "Updated roles")
			await member.roles.add(rolesToGive, `Successfully verified as ${json.username}`)
			role = member.guild.roles.cache.get("551758392021090304")!
			break
		case "HELPER":
			rolesToGive = ["551758392339857418", "715674953697198141"] // Hypixel Helper and Hypixel Staff
			member.roles.cache.forEach(r => { if (rolesToGive.includes(r.id)) rolesToGive.splice(rolesToGive.indexOf(r.id), 1) })
			roles.splice(roles.indexOf("551758392339857418"), 1) // Hypixel Helper
			roles.splice(roles.indexOf("715674953697198141"), 1) // Hypixel Staff
			await member.roles.remove(roles, "Updated roles")
			await member.roles.add(rolesToGive, `Successfully verified as ${json.username}`)
			role = member.guild.roles.cache.get("551758392339857418")!
			break
		case "YOUTUBER":
			rolesToGive = ["808032689709514852"] // YouTuber
			member.roles.cache.forEach(r => { if (rolesToGive.includes(r.id)) rolesToGive.splice(rolesToGive.indexOf(r.id), 1) })
			roles.splice(roles.indexOf("808032689709514852"), 1) // YouTuber
			await member.roles.remove(roles, "Updated roles")
			await member.roles.add(rolesToGive, `Successfully verified as ${json.username}`)
			role = member.guild.roles.cache.get("808032689709514852")!
			break
		case "MVP_PLUS_PLUS":
			rolesToGive = ["808032672160153641"] // MVP++
			member.roles.cache.forEach(r => { if (rolesToGive.includes(r.id)) rolesToGive.splice(rolesToGive.indexOf(r.id), 1) })
			roles.splice(roles.indexOf("808032672160153641"), 1) // MVP++
			await member.roles.remove(roles, "Updated roles")
			await member.roles.add(rolesToGive, `Successfully verified as ${json.username}`)
			role = member.guild.roles.cache.get("808032672160153641")!
			break
		case "MVP_PLUS":
			rolesToGive = ["808032657505255424"] // MVP+
			member.roles.cache.forEach(r => { if (rolesToGive.includes(r.id)) rolesToGive.splice(rolesToGive.indexOf(r.id), 1) })
			roles.splice(roles.indexOf("808032657505255424"), 1) // MVP+
			await member.roles.remove(roles, "Updated roles")
			await member.roles.add(rolesToGive, `Successfully verified as ${json.username}`)
			role = member.guild.roles.cache.get("808032657505255424")!
			break
		case "MVP":
			rolesToGive = ["808032640631832637"] // MVP
			member.roles.cache.forEach(r => { if (rolesToGive.includes(r.id)) rolesToGive.splice(rolesToGive.indexOf(r.id), 1) })
			roles.splice(roles.indexOf("808032640631832637"), 1) // MVP
			await member.roles.remove(roles, "Updated roles")
			await member.roles.add(rolesToGive, `Successfully verified as ${json.username}`)
			role = member.guild.roles.cache.get("808032640631832637")!
			break
		case "VIP_PLUS":
			rolesToGive = ["808032624215457823"] // VIP+
			member.roles.cache.forEach(r => { if (rolesToGive.includes(r.id)) rolesToGive.splice(rolesToGive.indexOf(r.id), 1) })
			roles.splice(roles.indexOf("808032624215457823"), 1) // VIP+
			await member.roles.remove(roles, "Updated roles")
			await member.roles.add(rolesToGive, `Successfully verified as ${json.username}`)
			role = member.guild.roles.cache.get("808032624215457823")!
			break
		case "VIP":
			rolesToGive = ["808032608456802337"] // VIP
			member.roles.cache.forEach(r => { if (rolesToGive.includes(r.id)) rolesToGive.splice(rolesToGive.indexOf(r.id), 1) })
			roles.splice(roles.indexOf("808032608456802337"), 1) // VIP
			await member.roles.remove(roles, "Updated roles")
			await member.roles.add(rolesToGive, `Successfully verified as ${json.username}`)
			role = member.guild.roles.cache.get("808032608456802337")!
			break
		default:
			rolesToGive = ["816435344689987585"] // Unranked
			member.roles.cache.forEach(r => { if (rolesToGive.includes(r.id)) rolesToGive.splice(rolesToGive.indexOf(r.id), 1) })
			roles.splice(roles.indexOf("816435344689987585"), 1) // Unranked
			await member.roles.remove(roles, "Updated roles")
			await member.roles.add("816435344689987585", `Successfully verified as ${json.username}`)
			break
	}
	return role
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
	color?: Discord.HexColorString,
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
}

export interface EventDb {
	name: "event"
	ids: Discord.Snowflake[]
}

export interface Quote {
	author: Discord.Snowflake[]
	id: number
	quote: string
	url?: string
}

export async function restart(interaction?: Discord.CommandInteraction) {
	await axios.delete("https://api.heroku.com/apps/hypixel-translators/dynos", {
		headers: {
			"User-Agent": `${interaction?.user.tag ?? client.user.tag}`,
			Authorization: `Bearer ${process.env.HEROKU_API}`,
			Accept: "application/vnd.heroku+json; version=3"
		}
	})
}

export async function getActivePunishments(user: Discord.User) {
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

export function updateModlogFields(embed: Discord.MessageEmbed, modlog: PunishmentLog, modlogs?: PunishmentLog[]) {
	embed.setAuthor("Log message", "", `https://discord.com/channels/549503328472530974/800820574405656587/${modlog.logMsg}`)
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
	id: Discord.Snowflake
	type: "VERBAL" | "WARN" | "MUTE" | "BAN" | "UNMUTE" | "UNBAN"
	points?: PunishmentPoints
	reason: string
	timestamp: number
	duration?: number
	endTimestamp?: number
	ended?: boolean,
	revoked?: true
	revokedBy?: Discord.Snowflake
	moderator: Discord.Snowflake,
	logMsg: Discord.Snowflake
}

export type PunishmentPoints = 1 | 2 | 3 | 4 | 5 | 6
