import { HexColorString, MessageEmbed, OverwriteResolvable } from "discord.js"
import { getLanguage } from "language-flag-colors"
import { crowdin } from "../../index"
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
		const lang = interaction.options.getString("code", true),
			langdbEntry = (await db.collection<LangDbEntry>("langdb").findOne({ code: lang }))!,
			member = interaction.member
		let { country, flag: { emoji } } = getLanguage(langdbEntry.id)!
		if (langdbEntry) {
			emoji = langdbEntry.emoji
		}
		console.log(lang)
		const { data: language } = await crowdin.languagesApi.getLanguage(langdbEntry.id)
		const translatorRole = await interaction.guild!.roles.create({
			name: `${language.name} Translator`,
			color: `${interaction.options.getString("color", false) as HexColorString | null ?? "#000000"}`,
			hoist: false,
			position: 22,
			permissions: ["VIEW_CHANNEL", "CHANGE_NICKNAME", "SEND_MESSAGES", "ADD_REACTIONS", "USE_EXTERNAL_EMOJIS", "READ_MESSAGE_HISTORY", "CONNECT", "SPEAK", "STREAM", "USE_VAD"],
			mentionable: false,
			unicodeEmoji: langdbEntry?.emoji ?? null,
			reason: `Added language ${language.name}`
		})
		const proofreaderRole = await interaction.guild!.roles.create({
			name: `${language.name} Proofreader`,
			color: `${interaction.options.getString("color", false) as HexColorString | null ?? "#000000"}`,
			hoist: false,
			position: 49,
			permissions: ["VIEW_CHANNEL", "CHANGE_NICKNAME", "SEND_MESSAGES", "ADD_REACTIONS", "USE_EXTERNAL_EMOJIS", "READ_MESSAGE_HISTORY", "CONNECT", "SPEAK", "STREAM", "USE_VAD"],
			mentionable: false,
			unicodeEmoji: langdbEntry?.emoji ?? null,
			reason: `Added language ${language.name}`
		})
		const overwrites = [
			{
				id: interaction.guild!.id,
				deny: ["VIEW_CHANNEL", "CONNECT"]
			},
			{
				id: ids.roles.bot,
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
		const category = await interaction.guild!.channels.create(`${country} ${emoji}`, {
			type: "GUILD_CATEGORY",
			permissionOverwrites: overwrites,
			position: 9,
			reason: `Added language ${language.name}`
		})
		const translatorsChannel = await interaction.guild!.channels.create(`${language.name}-translators`, {
			type: "GUILD_TEXT",
			topic: `A text channel where you can discuss ${language.name} translations! ${emoji}\n\nTRANSLATION`,
			parent: category,
			permissionOverwrites: overwrites,
			reason: `Added language ${language.name}`
		})
		const proofreadersChannel = await interaction.guild!.channels.create(`${language.name}-proofreaders`, {
			type: "GUILD_TEXT",
			parent: category,
			permissionOverwrites: pfOverwrites,
			reason: `Added language ${language.name}`
		})
		const translatorsVoice = await interaction.guild!.channels.create(`${language.name} Translators`, {
			type: "GUILD_VOICE",
			userLimit: 10,
			parent: category,
			permissionOverwrites: overwrites,
			reason: `Added language ${language.name}`
		})
		const proofreadersVoice = await interaction.guild!.channels.create(`${language.name} Proofreaders`, {
			type: "GUILD_VOICE",
			userLimit: 10,
			parent: category,
			permissionOverwrites: pfOverwrites,
			reason: `Added language ${language.name}`
		})
		const embed = new MessageEmbed({
			color: colors.success,
			author: { name: "Channel creator" },
			title: `Successfully created the new ${country} category, channels and roles!`,
			description: "Make sure their names were set correctly, put them in their correct positions, check the role colors and don't forget to translate the channel topic!",
			fields: [
				{ name: "Text Channels", value: `${translatorsChannel} and ${proofreadersChannel}` },
				{ name: "Voice Channels", value: `${translatorsVoice} and ${proofreadersVoice}` },
				{ name: "Roles", value: `${translatorRole} and ${proofreaderRole}` }
			],
			footer: { text: generateTip(), iconURL: member.displayAvatarURL({ format: "png", dynamic: true }) }
		})
		await interaction.editReply({ embeds: [embed] })
	}
}

export default command
