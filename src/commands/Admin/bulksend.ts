import { successColor } from "../../config.json"
import Discord from "discord.js"
import type { Command } from "../../index"
import { db } from "../../lib/dbclient"
import { updateProjectStatus } from "../../events/stats"
import { CrowdinProject, generateTip } from "../../lib/util"

const command: Command = {
	name: "bulksend",
	description: "Send messages in a channel, ready to be edited.",
	roleWhitelist: ["764442984119795732"], //Discord Administrator
	options: [{
		type: "CHANNEL",
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
		const sendTo = interaction.options.getChannel("channel", true) as Discord.GuildChannel | Discord.ThreadChannel
		if (!sendTo) throw "Couldn't resolve that channel!"
		if (!sendTo.isText()) throw "You must provide a text channel to send messages in!"
		let amount = interaction.options.getInteger("amount", true)
		await interaction.deferReply()
		for (amount; amount > 0; amount--) await sendTo.send("Language statistics will be here shortly!")
		const embed = new Discord.MessageEmbed()
			.setColor(successColor as Discord.HexColorString)
			.setAuthor("Bulk Send")
			.setTitle(`Success! Message${amount === 1 ? "" : "s"} sent!`)
			.setDescription(`${sendTo}`)
			.setFooter(generateTip(), interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
		await interaction.editReply({ embeds: [embed] })
		if (interaction.options.getBoolean("update", false)) {
			const project = await db.collection<CrowdinProject>("crowdin").findOne({ shortName: sendTo.name.split("-")[0] })
			if (!project) return await interaction.followUp("Couldn't update language statistics because the project was not found!")
			await updateProjectStatus(interaction.client, project.id)
			await interaction.followUp(`Language statistics have been successfully updated on the ${project.name} project!`)
		}
	}
}

export default command
