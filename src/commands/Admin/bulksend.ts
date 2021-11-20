import { HexColorString, MessageEmbed, TextChannel } from "discord.js"
import { successColor, ids } from "../../config.json"
import { updateProjectStatus } from "../../events/stats"
import { db } from "../../lib/dbclient"
import { CrowdinProject, generateTip } from "../../lib/util"

import type { Command } from "../../lib/imports"

const command: Command = {
	name: "bulksend",
	description: "Send messages in a channel, ready to be edited.",
	roleWhitelist: [ids.roles.admin],
	options: [{
		type: "CHANNEL",
		channelTypes: ["GUILD_TEXT"],
		name: "channel",
		description: "The channel to send bulk messages in",
		required: true
	},
	{
		type: "INTEGER",
		name: "amount",
		description: "The amount of messages to send in bulk",
		required: true
	},
	{
		type: "BOOLEAN",
		name: "update",
		description: "Whether to update language statistics once all messages have been sent",
		required: false
	}],
	async execute(interaction) {
		if (!interaction.inCachedGuild()) return
		const sendTo = interaction.options.getChannel("channel", true) as TextChannel

		if (!sendTo) throw "Couldn't resolve that channel!"
		let amount = interaction.options.getInteger("amount", true)
		await interaction.deferReply()
		for (amount; amount > 0; amount--) await sendTo.send("Language statistics will be here shortly!")
		const embed = new MessageEmbed()
			.setColor(successColor as HexColorString)
			.setAuthor("Bulk Send")
			.setTitle(`Success! Message${amount === 1 ? "" : "s"} sent!`)
			.setDescription(`${sendTo}`)
			.setFooter(generateTip(), interaction.member.displayAvatarURL({ format: "png", dynamic: true }))
		await interaction.editReply({ embeds: [embed] })
		if (interaction.options.getBoolean("update", false)) {
			const project = await db.collection<CrowdinProject>("crowdin").findOne({ shortName: sendTo.name.split("-")[0] })
			if (!project) return await interaction.followUp("Couldn't update language statistics because the project was not found!")
			await updateProjectStatus(project.id)
			await interaction.followUp(`Language statistics have been successfully updated on the ${project.name} project!`)
		}
	}
}

export default command
