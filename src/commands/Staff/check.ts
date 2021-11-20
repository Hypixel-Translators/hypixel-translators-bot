import Discord from "discord.js"
import { ids } from "../../config.json"
import { client, Command } from "../../index"
import { generateTip } from "../../lib/util"

const command: Command = {
	name: "check",
	description: "Shows information about the specified user.",
	options: [{
		type: "USER",
		name: "user",
		description: "The user to check",
		required: true
	}],
	roleWhitelist: [ids.roles.staff, ids.roles.hypixelManager, ids.roles.sbaManager, ids.roles.qpManager, ids.roles.botManager],
	channelWhitelist: [ids.channels.bots, ids.channels.staffBots, ids.channels.botDev, ids.channels.managers],
	async execute(interaction) {
		const memberInput = interaction.options.getMember("user", true) as Discord.GuildMember,
			member = interaction.member as Discord.GuildMember

		const userDb = await client.getUser(memberInput.id)
		let note: string | undefined = undefined
		if (memberInput.id === interaction.guild!.ownerId) note = "Discord Owner"
		else if (memberInput.roles.cache.find(r => r.name === "Discord Owner")) note = "Discord Co-Owner"
		else if (memberInput.roles.cache.find(r => r.name === "Discord Administrator")) note = "Discord Administrator"
		else if (memberInput.roles.cache.find(r => r.name === "Discord Moderator")) note = "Discord Moderator"
		else if (memberInput.roles.cache.find(r => r.name === "Discord Helper")) note = "Discord Helper"
		else if (memberInput.roles.cache.find(r => r.name.endsWith(" Manager"))) note = "Project Manager"
		else if (memberInput.roles.cache.find(r => r.name === "Hypixel Staff")) note = "Hypixel Staff Member"
		else if (userDb?.profile) note = userDb.profile

		let color: Discord.ColorResolvable = memberInput.displayHexColor
		if (color === "#000000") color = "BLURPLE"
		const joinedAgo = Math.round(memberInput.joinedAt!.getTime() / 1000),
			createdAgo = Math.round(memberInput.user.createdAt.getTime() / 1000),
			rolesCache = memberInput.roles.cache
		let userRoles: string
		if (rolesCache.size !== 1) {
			rolesCache.delete(ids.guilds.main)
			userRoles = rolesCache.sort((a, b) => b.position - a.position).map(r => r).join(", ")
		} else userRoles = "No roles yet!"

		const embed = new Discord.MessageEmbed()
			.setColor(color)
			.setAuthor({ name: "User information", iconURL: memberInput.user.displayAvatarURL({ format: "png", dynamic: true }) })
			.setTitle(memberInput.user.tag)
			.setDescription(`${memberInput} (ID: ${memberInput.id})`)
			.addFields(
				{ name: "Joined on", value: `<t:${joinedAgo}:F> (<t:${joinedAgo}:R>)`, inline: true },
				{ name: "Account created on", value: `<t:${createdAgo}:F> (<t:${createdAgo}:R>)`, inline: true },
				{ name: "Roles", value: userRoles },
			)
			.setThumbnail(memberInput.user.displayAvatarURL({ format: "png", dynamic: true }))
			.setFooter(generateTip(), member.displayAvatarURL({ format: "png", dynamic: true }))
		if (note) embed.addField("Note", note)
		await interaction.reply({ embeds: [embed] })
	}
}

export default command
