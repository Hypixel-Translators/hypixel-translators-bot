import axios from "axios"
import { GuildMember, HexColorString, MessageEmbed, Role } from "discord.js"
import { successColor, errorColor, ids } from "../../config.json"
import { db, DbUser } from "../../lib/dbclient"
import { fetchSettings, generateTip, getUUID, updateRoles, GraphQLQuery } from "../../lib/util"

import type { Command, GetStringFunction } from "../../lib/imports"

const command: Command = {
	name: "hypixelverify",
	description: "Links your Discord account with your Hypixel player",
	options: [{
		type: "STRING",
		name: "username",
		description: "Your Hypixel IGN. Must have your Discord linked in-game",
		required: true
	},
	{
		type: "USER",
		name: "user",
		description: "The user to verify. Admin-only",
		required: false
	}],
	cooldown: 600,
	channelWhitelist: [ids.channels.bots, ids.channels.staffBots, ids.channels.botDev],
	async execute(interaction, getString: GetStringFunction) {
		await interaction.deferReply()
		const randomTip = generateTip(getString),
			member = interaction.member as GuildMember,
			uuid = await getUUID(interaction.options.getString("username", true)),
			memberInput = interaction.options.getMember("user", false) as GuildMember | null,
			collection = db.collection<DbUser>("users")
		if (!uuid) throw "noUser"

		// make a response to the slothpixel api (hypixel api but we dont need an api key)
		const json = await axios
			.get<GraphQLQuery["data"]["players"]["player"] & { error?: string }>(`https://api.slothpixel.me/api/players/${uuid}`, fetchSettings)
			.then(res => res.data)
			.catch(e => {
				if (e.code === "ECONNABORTED") { //this means the request timed out
					console.error("slothpixel is down, sending error.")
					throw "apiError"
				} else throw e
			})

		// Handle errors
		if (json.error === "Player does not exist" || json.error === "Invalid username or UUID!") throw "falseUser"
		else if (json.error || !json.username) { // if other error we didn't plan for appeared
			if (!json.error && !json.username) throw "noPlayer"
			console.log("Welp, we didn't plan for this to happen. While you have a mental breakdown, enjoy this little error I have for you\n", json.error)
			throw "apiError"
		}
		if (json.links?.DISCORD === interaction.user.tag) {
			const result = await collection.updateOne({ id: interaction.user.id }, { $set: { uuid: json.uuid } }),
				role = await updateRoles(interaction.member as GuildMember, json)
			if (result.modifiedCount) {
				const successEmbed = new MessageEmbed()
					.setColor(successColor as HexColorString)
					.setAuthor(getString("moduleName"))
					.setTitle(getString("success", { player: json.username }))
					.setDescription(getString("role", { role: role.toString() }))
					.setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))
				return await interaction.editReply({ embeds: [successEmbed] })
			} else {
				const notChanged = new MessageEmbed()
					.setColor(errorColor as HexColorString)
					.setAuthor(getString("moduleName"))
					.setTitle(getString("alreadyVerified"))
					.setDescription(getString("nameChangeDisclaimer"))
					.setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))
				return await interaction.editReply({ embeds: [notChanged] })
			}
		} else if (memberInput && (interaction.member as GuildMember).roles.cache.has(ids.roles.admin)) {
			const result = await collection.updateOne({ id: memberInput.id }, { $set: { uuid: json.uuid } }),
				role = await updateRoles(memberInput, json) as Role
			if (result.modifiedCount) {
				const successEmbed = new MessageEmbed()
					.setColor(successColor as HexColorString)
					.setAuthor("Hypixel Verification")
					.setTitle(`Successfully verified ${memberInput.user.tag} as ${json.username}`)
					.setDescription(`They were given the ${role} role due to their rank on the server.`)
					.setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))
				if (json.links?.DISCORD !== memberInput.user.tag)
					successEmbed.setDescription("⚠ This player's Discord is different from their user tag! I hope you know what you're doing.")
				return await interaction.editReply({ embeds: [successEmbed] })
			} else {
				const notChanged = new MessageEmbed()
					.setColor(errorColor as HexColorString)
					.setAuthor("Hypixel Verification")
					.setTitle("This user is already verified")
					.setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))
				return await interaction.editReply({ embeds: [notChanged] })
			}
		} else {
			const errorEmbed = new MessageEmbed()
				.setColor(errorColor as HexColorString)
				.setAuthor(getString("moduleName"))
				.setTitle(getString("error"))
				.setDescription(getString("tutorial", { tag: interaction.user.tag }))
				.setImage("https://i.imgur.com/JSeAHdG.gif")
				.setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))
			await interaction.editReply({ embeds: [errorEmbed] })
		}
	},
}

export default command
