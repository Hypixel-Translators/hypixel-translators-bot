import axios from "axios"
import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js"

import { colors, ids } from "../../config.json"
import { db, type DbUser } from "../../lib/dbclient"
import { fetchSettings, generateTip, getUUID, updateRoles, type GraphQLQuery } from "../../lib/util"

import type { Command, GetStringFunction } from "../../lib/imports"

const command: Command = {
	name: "hypixelverify",
	description: "Links your Discord account with your Hypixel player",
	options: [
		{
			type: ApplicationCommandOptionType.String,
			name: "username",
			description: "Your Hypixel IGN. Must have your Discord linked in-game",
			required: true,
		},
		{
			type: ApplicationCommandOptionType.User,
			name: "user",
			description: "The user to verify. Admin-only",
			required: false,
		},
	],
	cooldown: 600,
	channelWhitelist: [ids.channels.bots, ids.channels.staffBots, ids.channels.botDev],
	async execute(interaction, getString: GetStringFunction) {
		if (!interaction.inCachedGuild()) return
		await interaction.deferReply()
		const randomTip = generateTip(getString),
			uuid = await getUUID(interaction.options.getString("username", true)),
			memberInput = interaction.options.getMember("user"),
			collection = db.collection<DbUser>("users")
		if (!uuid) throw "noUser"

		// Make a response to the slothpixel api (hypixel api but we dont need an api key)
		const json = await axios
			.get<GraphQLQuery["data"]["players"]["player"] & { error?: string }>(`https://api.slothpixel.me/api/players/${uuid}`, fetchSettings)
			.then(res => res.data)
			.catch(e => {
				if (e.code === "ECONNABORTED") {
					// This means the request timed out
					console.error("slothpixel is down, sending error.")
					throw "apiError"
				} else throw e
			})

		// Handle errors
		if (json.error === "Player does not exist" || json.error === "Invalid username or UUID!") throw "falseUser"
		else if (json.error || !json.username) {
			// If other error we didn't plan for appeared
			if (!json.error && !json.username) throw "noPlayer"
			console.log("Welp, we didn't plan for this to happen. While you have a mental breakdown, enjoy this little error I have for you\n", json.error)
			throw "apiError"
		}
		if (json.links?.DISCORD === interaction.user.tag) {
			const result = await collection.updateOne({ id: interaction.user.id }, { $set: { uuid: json.uuid } }),
				role = await updateRoles(interaction.member, json)
			if (result.modifiedCount) {
				const successEmbed = new EmbedBuilder({
					color: colors.success,
					author: { name: getString("moduleName") },
					title: getString("success", { variables: { player: json.username } }),
					description: getString("role", { variables: { role: `${role}` } }),
					footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
				})
				await interaction.editReply({ embeds: [successEmbed] })
			} else {
				const notChanged = new EmbedBuilder({
					color: colors.error,
					author: { name: getString("moduleName") },
					title: getString("alreadyVerified"),
					description: getString("nameChangeDisclaimer"),
					footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
				})
				await interaction.editReply({ embeds: [notChanged] })
			}
		} else if (memberInput && interaction.member.roles.cache.has(ids.roles.admin)) {
			const result = await collection.updateOne({ id: memberInput.id }, { $set: { uuid: json.uuid } }),
				role = await updateRoles(memberInput, json)
			if (result.modifiedCount) {
				const successEmbed = new EmbedBuilder({
					color: colors.success,
					author: { name: "Hypixel Verification" },
					title: `Successfully verified ${memberInput.user.tag} as ${json.username}`,
					description: `They were given the ${role} role due to their rank on the server.${
						json.links?.DISCORD !== memberInput.user.tag
							? "\n\n⚠ This player's Discord is different from their user tag! I hope you know what you're doing."
							: ""
					}`,
					footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
				})
				await interaction.editReply({ embeds: [successEmbed] })
			} else {
				const notChanged = new EmbedBuilder({
					color: colors.error,
					author: { name: "Hypixel Verification" },
					title: "This user is already verified",
					footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
				})
				await interaction.editReply({ embeds: [notChanged] })
			}
		} else {
			const errorEmbed = new EmbedBuilder({
				color: colors.error,
				author: { name: getString("moduleName") },
				title: getString("error"),
				description: getString("tutorial", { variables: { tag: interaction.user.tag } }),
				image: { url: "https://i.imgur.com/JSeAHdG.gif" },
				footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
			})
			await interaction.editReply({ embeds: [errorEmbed] })
		}
	},
}

export default command
