import { GuildMember, HexColorString, MessageEmbed } from "discord.js"
import { loadingColor, errorColor, successColor, ids } from "../../config.json"
import { generateTip } from "../../lib/util"

import type { Command, GetStringFunction } from "../../lib/imports"

const command: Command = {
	name: "ping",
	description: "Gives you the bot's ping",
	cooldown: 20,
	allowDM: true,
	channelWhitelist: [ids.channels.bots, ids.channels.staffBots, ids.channels.botDev, ids.channels.adminBots],
	async execute(interaction, getString: GetStringFunction) {
		const randomTip = generateTip(getString),
			member = interaction.member as GuildMember | null ?? interaction.user,
			ping = Date.now() - interaction.createdTimestamp,
			onlineSince = Math.round(interaction.client.readyTimestamp! / 1000)

		//Contributed by marzeq. Original idea by Rodry
		let color: HexColorString
		if (ping < 0) { //if ping is negative the color is red
			color = errorColor as HexColorString
			console.log("Something went terribly wrong and the ping is negative. Come pick me up I'm scared.")
		} else if (ping <= 200) { //if ping is less than 200 the color is green
			color = successColor as HexColorString
		} else if (ping <= 400) { //if the ping is between 200 and 400 the color is yellow
			color = loadingColor as HexColorString
		} else { //if ping is higher than 400 the color is red
			color = errorColor as HexColorString
		}
		const embed = new MessageEmbed()
			.setColor(color)
			.setAuthor(getString("moduleName"))
			.setTitle(getString("pong", { pingEmote: "<:ping:620954198493888512>" }))
			.setDescription(
				`${getString("message", { ping: ping })}\n\n${getString("onlineSince", {
					timestamp: `<t:${onlineSince}>`,
					timestampRelative: `<t:${onlineSince}:R>`
				})}`
			)
			.setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))
		await interaction.reply({ embeds: [embed] })
	}
}

export default command
