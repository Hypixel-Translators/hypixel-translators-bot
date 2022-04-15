import { ApplicationCommandOptionType, ChannelType, EmbedBuilder, type OverwriteResolvable } from "discord.js"
import { getLanguage } from "language-flag-colors"

import { colors, ids } from "../../config.json"
import { crowdin } from "../../index"
import { db } from "../../lib/dbclient"
import { generateTip, type MongoLanguage } from "../../lib/util"

import type { Command } from "../../lib/imports"

const command: Command = {
	name: "newlang",
	description: "Creates a new language category with the appropriate channels and roles.",
	options: [
		{
			type: ApplicationCommandOptionType.String,
			name: "code",
			description: "The ISO code of the language to add",
			required: true,
		},
	],
	roleWhitelist: [ids.roles.admin],
	async execute(interaction) {
		if (!interaction.inCachedGuild()) return
		await interaction.deferReply()
		const {
				ids: { osxLocale: id },
				country,
				flag: {
					emoji,
					primaryColor: { hex: color },
				},
			} = getLanguage(interaction.options.getString("code", true))!,
			mongoLanguage = await db.collection<MongoLanguage>("languages").findOne({ code: id }),
			{ data: language } = await crowdin.languagesApi.getLanguage(id),
			translatorRole = await interaction.guild!.roles.create({
				name: `${language.name} Translator`,
				color,
				hoist: false,
				position: 22,
				permissions: [
					"ViewChannel",
					"ChangeNickname",
					"SendMessages",
					"AddReactions",
					"UseExternalEmojis",
					"ReadMessageHistory",
					"Connect",
					"Speak",
					"Stream",
					"UseVAD",
				],
				mentionable: false,
				unicodeEmoji: mongoLanguage?.emoji ?? null,
				reason: `Added language ${language.name}`,
			}),
			proofreaderRole = await interaction.guild!.roles.create({
				name: `${language.name} Proofreader`,
				color,
				hoist: false,
				position: 49,
				permissions: [
					"ViewChannel",
					"ChangeNickname",
					"SendMessages",
					"AddReactions",
					"UseExternalEmojis",
					"ReadMessageHistory",
					"Connect",
					"Speak",
					"Stream",
					"UseVAD",
				],
				mentionable: false,
				unicodeEmoji: mongoLanguage?.emoji ?? null,
				reason: `Added language ${language.name}`,
			}),
			overwrites: OverwriteResolvable[] = [
				{
					id: interaction.guild!.id,
					deny: ["ViewChannel", "Connect"],
				},
				{
					id: ids.roles.bot,
					allow: ["ViewChannel", "SendMessages", "Connect", "Speak"],
				},
				{
					id: translatorRole.id,
					allow: ["ViewChannel", "Connect"],
				},
				{
					id: proofreaderRole.id,
					allow: ["ViewChannel", "ManageMessages", "ManageThreads", "Connect", "PrioritySpeaker", "MoveMembers"],
				},
				{
					id: ids.roles.hypixelManager,
					allow: ["ViewChannel", "ManageMessages", "ManageThreads", "Connect", "PrioritySpeaker", "MoveMembers"],
				},
				{
					id: ids.roles.admin,
					allow: ["ViewChannel", "ManageMessages", "ManageThreads", "Connect", "PrioritySpeaker", "MoveMembers"],
				},
			],
			pfOverwrites = Array.from(overwrites)
		pfOverwrites.splice(3, 1)
		const category = await interaction.guild!.channels.create(`${country} ${emoji}`, {
				type: ChannelType.GuildCategory,
				permissionOverwrites: overwrites,
				position: 9,
				reason: `Added language ${language.name}`,
			}),
			translatorsChannel = await interaction.guild!.channels.create(`${language.name}-translators`, {
				topic: `A text channel where you can discuss ${language.name} translations! ${emoji}\n\nTRANSLATION`,
				parent: category,
				permissionOverwrites: overwrites,
				reason: `Added language ${language.name}`,
			}),
			proofreadersChannel = await interaction.guild!.channels.create(`${language.name}-proofreaders`, {
				parent: category,
				permissionOverwrites: pfOverwrites,
				reason: `Added language ${language.name}`,
			}),
			translatorsVoice = await interaction.guild!.channels.create(`${language.name} Translators`, {
				type: ChannelType.GuildVoice,
				userLimit: 10,
				parent: category,
				permissionOverwrites: overwrites,
				reason: `Added language ${language.name}`,
			}),
			proofreadersVoice = await interaction.guild!.channels.create(`${language.name} Proofreaders`, {
				type: ChannelType.GuildVoice,
				userLimit: 10,
				parent: category,
				permissionOverwrites: pfOverwrites,
				reason: `Added language ${language.name}`,
			}),
			embed = new EmbedBuilder({
				color: colors.success,
				author: { name: "Channel creator" },
				title: `Successfully created the new ${country} category, channels and roles!`,
				description:
					"Make sure their names were set correctly, put them in their correct positions, check the role colors and don't forget to translate the channel topic!",
				fields: [
					{ name: "Text Channels", value: `${translatorsChannel} and ${proofreadersChannel}` },
					{ name: "Voice Channels", value: `${translatorsVoice} and ${proofreadersVoice}` },
					{ name: "Roles", value: `${translatorRole} and ${proofreaderRole}` },
				],
				footer: { text: generateTip(), iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
			})
		await interaction.editReply({ embeds: [embed] })
	},
}

export default command
