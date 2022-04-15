import { EmbedBuilder } from "discord.js"

import { colors, ids } from "../../config.json"
import { generateTip } from "../../lib/util"

import type { Command, GetStringFunction } from "../../lib/imports"

const command: Command = {
	name: "projects",
	description: "Gives you links and information about all the translation projects we support on the server.",
	cooldown: 120,
	allowDM: true,
	channelWhitelist: [ids.channels.bots, ids.channels.staffBots, ids.channels.botDev, ids.channels.adminBots],
	async execute(interaction, getString: GetStringFunction) {
		const member = interaction.client.guilds.cache.get(ids.guilds.main)!.members.cache.get(interaction.user.id)!
		let joinedHypixel: string, joinedQuickplay: string, joinedSba: string, joinedBot: string
		if (member.roles.cache.find(role => role.name === "Hypixel Translator" || role.name === "Hypixel Proofreader" || role.name === "Hypixel Manager"))
			joinedHypixel = `<:vote_yes:839262196797669427> **${getString("alreadyJoined")}**`
		else joinedHypixel = `<:vote_no:839262184882044931> **${getString("notJoined")}**`
		if (
			member.roles.cache.find(
				role => role.name === "Quickplay Translator" || role.name === "Quickplay Proofreader" || role.name === "Quickplay Manager",
			)
		)
			joinedQuickplay = `<:vote_yes:839262196797669427> **${getString("alreadyJoined")}**`
		else joinedQuickplay = `<:vote_no:839262184882044931> **${getString("notJoined")}**`
		if (
			member.roles.cache.find(
				role => role.name === "SkyblockAddons Translator" || role.name === "SkyblockAddons Proofreader" || role.name === "SkyblockAddons Manager",
			)
		)
			joinedSba = `<:vote_yes:839262196797669427> **${getString("alreadyJoined")}**`
		else joinedSba = `<:vote_no:839262184882044931> **${getString("notJoined")}**`
		if (member.roles.cache.find(role => role.name === "Bot Translator" || role.name === "Bot Proofreader" || role.name === "Bot Manager"))
			joinedBot = `<:vote_yes:839262196797669427> **${getString("alreadyJoined")}**`
		else joinedBot = `<:vote_no:839262184882044931> **${getString("notJoined")}**`
		const embed = new EmbedBuilder({
			color: colors.neutral,
			author: { name: getString("moduleName") },
			title: getString("allProjects"),
			description: getString("description"),
			fields: [
				{
					name: "Hypixel",
					value: `${getString("projectInfo", {
						variables: {
							project: "**Hypixel**",
							link: "https://crowdin.com/project/hypixel",
							command: "`/tag hypixel`",
						},
					})}\n${joinedHypixel}`,
				},
				{
					name: "Quickplay",
					value: `${getString("projectInfo", {
						variables: {
							project: "**Quickplay**",
							link: "https://crowdin.com/project/quickplay",
							command: "`/tag quickplay`",
						},
					})}\n${joinedQuickplay}`,
				},
				{
					name: "SkyblockAddons",
					value: `${getString("projectInfo", {
						variables: {
							project: "**SkyblockAddons**",
							link: "https://crowdin.com/project/skyblockaddons",
							command: "`/tag skyblockaddons`",
						},
					})}\n${joinedSba}`,
				},
				{
					name: "Hypixel Translators Bot",
					value: `${getString("projectInfo", {
						variables: {
							project: "**Hypixel Translators Bot**",
							link: "https://crowdin.com/project/hypixel-translators-bot",
							command: "`/tag bot`",
						},
					})}\n${joinedBot}`,
				},
			],
			footer: { text: generateTip(getString), iconURL: member.displayAvatarURL({ extension: "png" }) },
		})
		await interaction.reply({ embeds: [embed] })
	},
}

export default command
