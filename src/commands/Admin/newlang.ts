import { flag } from "country-emoji"
import { demonym, name } from "countryjs"
import { HexColorString, MessageEmbed, OverwriteResolvable } from "discord.js"
import { colors, ids } from "../../config.json"
import { db } from "../../lib/dbclient"
import { generateTip, LangDbEntry } from "../../lib/util"

import type { Command } from "../../lib/imports"

const command: Command = {
	name: "newlang",
	description: "Creates a new language category with the appropriate channels and roles.",
	options: [{
		type: "STRING",
		name: "code",
		description: "The ISO code of the language to add",
		required: true
	},
	{
		type: "STRING",
		name: "color",
		description: "The HEX color code for this language's role (without the #)",
		required: false
	}],
	roleWhitelist: [ids.roles.admin],
	async execute(interaction) {
		if (!interaction.inCachedGuild()) return
		await interaction.deferReply()
		const lang = interaction.options.getString("code", true).toLowerCase(),
			code = interaction.options.getString("code", true).toUpperCase(),
			langdbEntry = await db.collection<LangDbEntry>("langdb").findOne({ code: lang }),
			member = interaction.member
		let nationality = demonym(code)
		if (!nationality) throw "Couldn't find that country!"
		let emoji = flag(lang)
		if (langdbEntry) {
			nationality = langdbEntry.name
			emoji = langdbEntry.emoji
		}
		console.log(lang)
		console.log(nationality)
		const translatorRole = await interaction.guild!.roles.create({
			name: `${nationality} Translator`,
			color: `${interaction.options.getString("color", false) as HexColorString | null ?? "#000000"}`,
			hoist: false,
			position: 22,
			permissions: ["VIEW_CHANNEL", "CHANGE_NICKNAME", "SEND_MESSAGES", "ADD_REACTIONS", "USE_EXTERNAL_EMOJIS", "READ_MESSAGE_HISTORY", "CONNECT", "SPEAK", "STREAM", "USE_VAD"],
			mentionable: false,
			unicodeEmoji: langdbEntry?.emoji ?? null,
			reason: `Added language ${nationality}`
		})
		const proofreaderRole = await interaction.guild!.roles.create({
			name: `${nationality} Proofreader`,
			color: `${interaction.options.getString("color", false) as HexColorString | null ?? "#000000"}`,
			hoist: false,
			position: 49,
			permissions: ["VIEW_CHANNEL", "CHANGE_NICKNAME", "SEND_MESSAGES", "ADD_REACTIONS", "USE_EXTERNAL_EMOJIS", "READ_MESSAGE_HISTORY", "CONNECT", "SPEAK", "STREAM", "USE_VAD"],
			mentionable: false,
			unicodeEmoji: langdbEntry?.emoji ?? null,
			reason: `Added language ${nationality}`
		})
		const overwrites = [
			{
				id: interaction.guild!.roles.everyone.id,
				deny: ["VIEW_CHANNEL", "CONNECT"]
			},
			{
				id: interaction.guild!.roles.cache.find(role => role.name === "Muted")!.id,
				deny: ["SEND_MESSAGES", "ADD_REACTIONS", "SPEAK"]
			},
			{
				id: interaction.guild!.roles.cache.find(role => role.name === "Bot")!.id,
				allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "CONNECT", "SPEAK"]
			},
			{
				id: translatorRole.id,
				allow: ["VIEW_CHANNEL", "CONNECT"]
			},
			{
				id: proofreaderRole.id,
				allow: ["VIEW_CHANNEL", "MANAGE_MESSAGES", "MANAGE_THREADS", "CONNECT", "PRIORITY_SPEAKER", "MOVE_MEMBERS"]
			},
			{
				id: ids.roles.hypixelManager,
				allow: ["VIEW_CHANNEL", "MANAGE_MESSAGES", "MANAGE_THREADS", "CONNECT", "PRIORITY_SPEAKER", "MOVE_MEMBERS"]
			},
			{
				id: ids.roles.admin,
				allow: ["VIEW_CHANNEL", "MANAGE_MESSAGES", "MANAGE_THREADS", "CONNECT", "PRIORITY_SPEAKER", "MOVE_MEMBERS"]
			}
		] as OverwriteResolvable[]
		const pfOverwrites = Array.from(overwrites)
		pfOverwrites.splice(3, 1)
		const category = await interaction.guild!.channels.create(`${name(code)} ${emoji}`, {
			type: "GUILD_CATEGORY",
			permissionOverwrites: overwrites,
			position: 9,
			reason: `Added language ${nationality}`
		})
		const translatorsChannel = await interaction.guild!.channels.create(`${nationality}-translators`, {
			type: "GUILD_TEXT",
			topic: `A text channel where you can discuss ${nationality!.charAt(0).toUpperCase() + nationality!.slice(1)} translations! ${emoji}\n\nTRANSLATION`,
			parent: category,
			permissionOverwrites: overwrites,
			reason: `Added language ${nationality}`
		})
		const proofreadersChannel = await interaction.guild!.channels.create(`${nationality}-proofreaders`, {
			type: "GUILD_TEXT",
			parent: category,
			permissionOverwrites: pfOverwrites,
			reason: `Added language ${nationality}`
		})
		const translatorsVoice = await interaction.guild!.channels.create(`${nationality} Translators`, {
			type: "GUILD_VOICE",
			userLimit: 10,
			parent: category,
			permissionOverwrites: overwrites,
			reason: `Added language ${nationality}`
		})
		const proofreadersVoice = await interaction.guild!.channels.create(`${nationality} Proofreaders`, {
			type: "GUILD_VOICE",
			userLimit: 10,
			parent: category,
			permissionOverwrites: pfOverwrites,
			reason: `Added language ${nationality}`
		})
		const embed = new MessageEmbed()
			.setColor(colors.success)
			.setAuthor("Channel creator")
			.setTitle(`Successfully created the new ${name(code)} category, channels and roles!`)
			.setDescription("Make sure their names were set correctly, put them in their correct positions, check the role colors and don't forget to translate the channel topic!")
			.addFields(
				{ name: "Text Channels", value: `${translatorsChannel} and ${proofreadersChannel}` },
				{ name: "Voice Channels", value: `${translatorsVoice} and ${proofreadersVoice}` },
				{ name: "Roles", value: `${translatorRole} and ${proofreaderRole}` }
			)
			.setFooter(generateTip(), member.displayAvatarURL({ format: "png", dynamic: true }))
		await interaction.editReply({ embeds: [embed] })
	}
}

export default command
