import { successColor, ids } from "../../config.json"
import Discord from "discord.js"
import crowdin from "../../events/crowdinverify"
import { client, Command } from "../../index"
import { generateTip } from "../../lib/util"

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
			member = interaction.member as Discord.GuildMember
		await interaction.deferReply()
		await crowdin(client, true, limit)
		const embed = new Discord.MessageEmbed()
			.setColor(successColor as Discord.HexColorString)
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
