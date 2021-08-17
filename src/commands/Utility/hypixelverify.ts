import Discord from "discord.js"
import { successColor, errorColor } from "../../config.json"
import fetch, { FetchError } from "node-fetch"
import { db } from "../../lib/dbclient"
import { fetchSettings, getUUID, updateRoles } from "../../lib/util"
import { Command, GetStringFunction } from "../../index"

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
	cooldown: 60,
	channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058"], // bots staff-bots bot-dev 
	async execute(interaction, getString: GetStringFunction) {
		const executedBy = getString("executedBy", { user: interaction.user.tag }, "global") as string,
			uuid = await getUUID(interaction.options.getString("username", true)),
			memberInput = interaction.options.getMember("user", false) as Discord.GuildMember | null
		if (!uuid) throw "noUser"

		await interaction.deferReply()
		// make a response to the slothpixel api (hypixel api but we dont need an api key)
		await fetch(`https://api.slothpixel.me/api/players/${uuid}`, fetchSettings)
			.then(res => res.json()) // get the response json
			.then(async json => { // here we do stuff with the json

				// Handle errors
				if (json.error === "Player does not exist" || json.error === "Invalid username or UUID!") throw "falseUser"
				else if (json.error !== undefined || json.username === null) { // if other error we didn't plan for appeared
					if (json.error === undefined && json.username === null) throw "noPlayer"
					console.log("Welp, we didn't plan for this to happen. While you have a mental breakdown, enjoy this little error I have for you\n", json.error)
					throw "apiError"
				}
				if (json.links?.DISCORD === interaction.user.tag) {
					await db.collection("users").updateOne({ id: interaction.user.id }, { $set: { uuid: json.uuid } }).then(async r => {
						const role = await updateRoles(interaction.member as Discord.GuildMember, json) as Discord.Role
						if (r.modifiedCount) {
							const successEmbed = new Discord.MessageEmbed()
								.setColor(successColor as Discord.HexColorString)
								.setAuthor(getString("moduleName"))
								.setTitle(getString("success", { player: json.username }))
								.setDescription(getString("role", { role: role.toString() }))
								.setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
							return await interaction.editReply({ embeds: [successEmbed] })
						} else {
							const notChanged = new Discord.MessageEmbed()
								.setColor(errorColor as Discord.HexColorString)
								.setAuthor(getString("moduleName"))
								.setTitle(getString("alreadyVerified"))
								.setDescription(getString("nameChangeDisclaimer"))
								.setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
							return await interaction.editReply({ embeds: [notChanged] })
						}
					})
				} else if (memberInput && (interaction.member as Discord.GuildMember).roles.cache.has("764442984119795732")) { //Discord Administrator
					await db.collection("users").updateOne({ id: memberInput.id }, { $set: { uuid: json.uuid } }).then(async r => {
						const role = await updateRoles(memberInput, json) as Discord.Role
						if (r.modifiedCount) {
							const successEmbed = new Discord.MessageEmbed()
								.setColor(successColor as Discord.HexColorString)
								.setAuthor("Hypixel Verification")
								.setTitle(`Successfully verified ${memberInput.user.tag} as ${json.username}`)
								.setDescription(`They were given the ${role} role due to their rank on the server.`)
								.setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
							if (json.links?.DISCORD !== memberInput.user.tag)
								successEmbed.setDescription("⚠ This player's Discord is different from their user tag! I hope you know what you're doing.")
							return await interaction.editReply({ embeds: [successEmbed] })
						} else {
							const notChanged = new Discord.MessageEmbed()
								.setColor(errorColor as Discord.HexColorString)
								.setAuthor("Hypixel Verification")
								.setTitle("This user is already verified")
								.setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
							return await interaction.editReply({ embeds: [notChanged] })
						}
					})
				} else {
					const errorEmbed = new Discord.MessageEmbed()
						.setColor(errorColor as Discord.HexColorString)
						.setAuthor(getString("moduleName"))
						.setTitle(getString("error"))
						.setDescription(getString("tutorial", { tag: interaction.user.tag }))
						.setImage("https://i.imgur.com/JSeAHdG.gif")
						.setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
					await interaction.editReply({ embeds: [errorEmbed] })
				}
			})
			.catch(e => {
				if (e instanceof FetchError) {
					console.error("slothpixel is down, sending error.")
					throw "apiError"
				} else throw e
			})
	},
}

export default command
