//This file contains a bunch of functions used across the bot on multuple commands.
import Discord from "discord.js"
import { ObjectId } from "mongodb"
import fetch from "node-fetch"

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

export const fetchSettings = { headers: { "User-Agent": "Hypixel Translators Bot" }, timeout: 30_000 }

export async function getUUID(username: string): Promise<string | undefined> {
	return await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`, fetchSettings)
		.then(res => res.json())
		.then(json => json.id)
		.catch(() => {
			return
		})
}

export async function updateRoles(member: Discord.GuildMember, json?: JsonResponse) {
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

interface JsonResponse { // Just declaring the variables we need
	username: string,
	rank: string
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
	_id: ObjectId,
	name: string,
	emoji: string,
	color?: Discord.HexColorString,
	code: string,
	id: string
	flag: string
}

export interface CrowdinProject {
	_id: ObjectId
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

