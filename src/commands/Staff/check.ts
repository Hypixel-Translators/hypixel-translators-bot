import { type ColorResolvable, MessageEmbed, User } from "discord.js"

import { ids } from "../../config.json"
import { client } from "../../index"
import { generateTip } from "../../lib/util"

import type { Command } from "../../lib/imports"

const command: Command = {
	name: "check",
	description: "Shows information about the specified user.",
	options: [
		{
			type: "USER",
			name: "user",
			description: "The user to check",
			required: true,
		},
	],
	roleWhitelist: [ids.roles.staff, ids.roles.hypixelManager, ids.roles.sbaManager, ids.roles.qpManager, ids.roles.botManager],
	channelWhitelist: [ids.channels.bots, ids.channels.staffBots, ids.channels.botDev, ids.channels.managers],
	async execute(interaction) {
		if (!interaction.inCachedGuild()) return
		const memberInput = interaction.options.getMember("user", false) ?? interaction.options.getUser("user", true)
		if (memberInput instanceof User)
			return await interaction.reply({ content: `Couldn't find member ${memberInput}! Are you sure they're on this server?`, ephemeral: true })
		const userDb = await client.getUser(memberInput.id)

		let note: string | undefined
		if (memberInput.id === interaction.guild!.ownerId) note = "Discord Owner"
		else if (memberInput.roles.cache.find(r => r.name === "Discord Owner")) note = "Discord Co-Owner"
		else if (memberInput.roles.cache.find(r => r.name === "Discord Administrator")) note = "Discord Administrator"
		else if (memberInput.roles.cache.find(r => r.name === "Discord Moderator")) note = "Discord Moderator"
		else if (memberInput.roles.cache.find(r => r.name === "Discord Helper")) note = "Discord Helper"
		else if (memberInput.roles.cache.find(r => r.name.endsWith(" Manager"))) note = "Project Manager"
		else if (memberInput.roles.cache.find(r => r.name === "Hypixel Staff")) note = "Hypixel Staff Member"
		else if (userDb?.profile) note = userDb.profile

		let color: ColorResolvable = memberInput.displayHexColor
		if (color === "#000000") color = "BLURPLE"
		const joinedAgo = Math.round(memberInput.joinedAt!.getTime() / 1000),
			createdAgo = Math.round(memberInput.user.createdAt.getTime() / 1000),
			rolesCache = memberInput.roles.cache
		let userRoles: string
		if (rolesCache.size !== 1) {
			rolesCache.delete(ids.guilds.main)
			userRoles = rolesCache
				.sort((a, b) => b.position - a.position)
				.map(r => r)
				.join(", ")
		} else userRoles = "No roles yet!"

		const embed = new MessageEmbed({
			color,
			author: { name: "User information", iconURL: memberInput.user.displayAvatarURL({ format: "png", dynamic: true }) },
			title: memberInput.user.tag,
			description: `${memberInput} (ID: ${memberInput.id})`,
			fields: [
				{ name: "Joined on", value: `<t:${joinedAgo}:F> (<t:${joinedAgo}:R>)`, inline: true },
				{ name: "Account created on", value: `<t:${createdAgo}:F> (<t:${createdAgo}:R>)`, inline: true },
				{ name: "Roles", value: userRoles },
			],
			thumbnail: { url: memberInput.displayAvatarURL({ format: "png", dynamic: true }) },
			footer: { text: generateTip(), iconURL: interaction.member.displayAvatarURL({ format: "png", dynamic: true }) },
		})
		if (note) embed.addField("Note", note)
		await interaction.reply({ embeds: [embed] })
	},
}

export default command
