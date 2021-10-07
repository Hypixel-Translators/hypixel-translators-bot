import Discord from "discord.js"
import { successColor, errorColor, ids } from "../../config.json"
import { db, DbUser } from "../../lib/dbclient"
import { client, Command, GetStringFunction } from "../../index"
import { generateTip, updateRoles } from "../../lib/util"

const command: Command = {
	name: "hypixelunverify",
	description: "Unlinks your Discord account from your Hypixel player",
	cooldown: 60,
	options: [{
		type: "USER",
		name: "user",
		description: "The user to unverify. Admin-only",
		required: false
	}],
	channelWhitelist: [ids.channels.bots, ids.channels.staffBots, ids.channels.botDev],
	async execute(interaction, getString: GetStringFunction) {
		const randomTip = generateTip(getString),
			member = interaction.member as Discord.GuildMember,
			memberInput = interaction.options.getMember("user", false) as Discord.GuildMember | null,
			collection = db.collection<DbUser>("users")

		if (memberInput && (interaction.member as Discord.GuildMember).roles.cache.has(ids.roles.admin)) {
			await updateRoles(memberInput)
			const result = await collection.updateOne({ id: memberInput.id }, { $unset: { uuid: true } })
			if (result.modifiedCount) {
				const embed = new Discord.MessageEmbed()
					.setColor(successColor as Discord.HexColorString)
					.setAuthor("Hypixel Verification")
					.setTitle(`Successfully unverified ${memberInput.user.tag}`)
					.setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))
				return await interaction.reply({ embeds: [embed] })
			} else {
				const embed = new Discord.MessageEmbed()
					.setColor(errorColor as Discord.HexColorString)
					.setAuthor("Hypixel Verification")
					.setTitle(`Couldn't unverify ${memberInput.user.tag}!`)
					.setDescription("This happened because this user isn't verified yet.")
					.setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))
				return await interaction.reply({ embeds: [embed], ephemeral: true })
			}
		} else {
			await updateRoles(interaction.member as Discord.GuildMember)
			client.cooldowns.get(this.name)!.delete(interaction.user.id)
			const result = await collection.updateOne({ id: interaction.user.id }, { $unset: { uuid: true } })
			if (result.modifiedCount) {
				const embed = new Discord.MessageEmbed()
					.setColor(successColor as Discord.HexColorString)
					.setAuthor(getString("moduleName"))
					.setTitle(getString("unverified"))
					.setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))
				return await interaction.reply({ embeds: [embed] })
			} else {
				const embed = new Discord.MessageEmbed()
					.setColor(errorColor as Discord.HexColorString)
					.setAuthor(getString("moduleName"))
					.setTitle(getString("notUnverified"))
					.setDescription(getString("whyNotUnverified"))
					.setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))
				return await interaction.reply({ embeds: [embed], ephemeral: true })
			}
		}
	}
}

export default command
