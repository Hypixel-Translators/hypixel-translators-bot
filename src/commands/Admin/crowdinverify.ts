import { GuildMember, HexColorString, MessageEmbed } from "discord.js"
import { successColor, ids } from "../../config.json"
import crowdinVerify from "../../events/crowdinverify"
import { generateTip } from "../../lib/util"

import type { Command } from "../../lib/imports"

const command: Command = {
	name: "crowdinverify",
	description: "Goes through all the stored profiles and updates the user's roles accordingly",
	options: [{
		type: "INTEGER",
		name: "limit",
		description: "The amount of profiles to check. All by default",
		required: false
	}],
	roleWhitelist: [ids.roles.admin],
	async execute(interaction) {
		const limit = interaction.options.getInteger("limit", false) ?? undefined,
			member = interaction.member as GuildMember
		await interaction.deferReply()
		await crowdinVerify(limit)
		const embed = new MessageEmbed()
			.setColor(successColor as HexColorString)
			.setAuthor("Role updater")
			.setTitle("All verified users had their roles updated!")
			.setDescription("Check the console for any errors that may have occured in the process")
			.setFooter(generateTip(), member.displayAvatarURL({ format: "png", dynamic: true }))
		await interaction.editReply({ embeds: [embed] })
			.catch(async () => {
				await interaction.channel!.send({ content: "The interaction expired, so here's the embed so you don't feel sad", embeds: [embed] })
			})
	}
}

export default command
