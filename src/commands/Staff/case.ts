import { GuildMember, Colors, ApplicationCommandOptionType } from "discord.js"

import { ids } from "../../config.json"
import { db } from "../../lib/dbclient"
import { generateTip, type PunishmentLog, createModlogEmbed } from "../../lib/util"

import type { Command } from "../../lib/imports"

const command: Command = {
	name: "case",
	description: "Gives you information about any given case",
	options: [
		{
			type: ApplicationCommandOptionType.Integer,
			name: "case",
			description: "Case number",
			required: true,
			autocomplete: true,
		},
	],
	roleWhitelist: [ids.roles.staff],
	channelWhitelist: [ids.channels.staffBots, ids.channels.adminBots],
	async execute(interaction) {
		if (!interaction.inCachedGuild()) return
		const caseNumber = interaction.options.getInteger("case", true),
			collection = db.collection<PunishmentLog>("punishments"),
			modLog = await collection.findOne({ case: caseNumber })

		if (!modLog) throw `Couldn't find that case number! You must enter a number between 1 and ${await collection.estimatedDocumentCount()}`

		const offender = interaction.guild!.members.cache.get(modLog.id) ?? (await interaction.client.users.fetch(modLog.id)),
			embed = createModlogEmbed(
				{
					color: Colors.Blurple,
					author: { name: "Punishment case" },
					title: `Here's case #${caseNumber}`,
					description: `Offender: ${offender instanceof GuildMember ? offender : offender.tag}`,
					footer: { text: generateTip(), iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
				},
				modLog
			)
		await interaction.reply({ embeds: [embed] })
	},
}

export default command
