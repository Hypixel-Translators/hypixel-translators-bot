import { EmbedBuilder } from "discord.js"

import { colors, ids } from "../../config.json"
import { generateTip } from "../../lib/util"

import type { Command, GetStringFunction } from "../../lib/imports"

const command: Command = {
	name: "translate",
	description: "Gives you useful information on how to translate the Bot.",
	cooldown: 120,
	allowDM: true,
	channelWhitelist: [ids.channels.bots, ids.channels.staffBots, ids.channels.botDev, ids.channels.adminBots],
	async execute(interaction, getString: GetStringFunction) {
		const randomTip = generateTip(getString),
			member = interaction.client.guilds.cache.get("549503328472530974")!.members.resolve(interaction.user.id)!

		if (member.roles.cache.find(role => role.name.startsWith("Bot ") && role.name !== "Bot Updates")) {
			const embed = new EmbedBuilder({
				color: colors.neutral,
				author: { name: getString("moduleName") },
				title: getString("alreadyTranslator"),
				description: getString("projectLink", { variables: { link: "https://crowdin.com/project/hypixel-translators-bot" } }),
				fields: [
					{ name: getString("question"), value: getString("askTranslators", { variables: { botTranslators: `<#${ids.channels.botTranslators}>` } }) },
					{ name: getString("newCrowdin"), value: getString("checkGuide", { variables: { gettingStarted: `<#${ids.channels.gettingStarted}>` } }) },
				],
				footer: { text: randomTip, iconURL: member.displayAvatarURL({ extension: "png" }) },
			})
			await interaction.reply({ embeds: [embed] })
		} else {
			const embed = new EmbedBuilder({
				color: colors.neutral,
				author: { name: getString("moduleName") },
				title: getString("newTranslator"),
				description: getString("join"),
				fields: [
					{
						name: getString("openProject"),
						value: getString("howOpen", { variables: { link: "https://crowdin.com/project/hypixel-translators-bot" } }),
					},
					{ name: getString("clickLanguage"), value: getString("requestJoin") },
					{ name: getString("lastThing"), value: getString("requestInfo", { variables: { tag: interaction.user.tag, id: interaction.user.id } }) },
					{ name: getString("noLanguage"), value: getString("langRequest") },
				],
				footer: { text: randomTip, iconURL: member.displayAvatarURL({ extension: "png" }) },
			})
			await interaction.reply({ embeds: [embed] })
		}
	},
}

export default command
