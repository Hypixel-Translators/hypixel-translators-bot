import { ApplicationCommandOptionType, type ChatInputCommandInteraction, Colors, EmbedBuilder, type TextChannel } from "discord.js"

import { colors, ids } from "../../config.json"
import { generateTip } from "../../lib/util"

import type { Command } from "../../lib/imports"

const command: Command = {
	name: "channel",
	description: "Updates the specified channel",
	roleWhitelist: [ids.roles.admin],
	channelWhitelist: [ids.channels.staffBots, ids.channels.botDev, ids.channels.adminBots],
	options: [
		{
			type: ApplicationCommandOptionType.String,
			name: "channel",
			description: "The channel to update",
			required: false,
			choices: [
				{ name: "The rules channel", value: "rules" },
				{ name: "The server-info channel", value: "info" },
				{ name: "The verify channel", value: "verify" },
			],
		},
	],
	async execute(interaction) {
		if (!interaction.inCachedGuild()) return
		const channelInput = interaction.options.getString("channel", false),
			randomTip = generateTip()

		await interaction.deferReply()
		if (channelInput === "info") {
			await info(interaction)
			const successEmbed = new EmbedBuilder({
				color: colors.success,
				author: { name: "Channel updater" },
				title: "Updated the information channel!",
				description: `Check it out at <#${ids.channels.serverInfo}>!`,
				footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
			})
			await interaction.editReply({ embeds: [successEmbed] })
		} else if (channelInput === "rules") {
			await rules(interaction)
			const successEmbed = new EmbedBuilder({
				color: colors.success,
				author: { name: "Channel updater" },
				title: "Updated the rules channel!",
				description: `Check it out at ${interaction.guild.rulesChannel}!`,
				footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
			})
			await interaction.editReply({ embeds: [successEmbed] })
		} else if (channelInput === "verify") {
			await verify(interaction)
			const successEmbed = new EmbedBuilder({
				color: colors.success,
				author: { name: "Channel updater" },
				title: "Updated the verification channel!",
				description: `Check it out at <#${ids.channels.verify}>!`,
				footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
			})
			await interaction.editReply({ embeds: [successEmbed] })
		} else if (!channelInput) {
			await info(interaction)
			await verify(interaction)
			await rules(interaction)
			const successEmbed = new EmbedBuilder({
				color: colors.success,
				author: { name: "Channel updater" },
				title: "Updated all channels!",
				description: `Check them out at <#${ids.channels.serverInfo}>, ${interaction.guild!.rulesChannel} and <#${ids.channels.verify}>!`,
				footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
			})
			await interaction.editReply({ embeds: [successEmbed] })
		}
	},
}

async function info(interaction: ChatInputCommandInteraction<"cached">) {
	const serverInfo = interaction.client.channels.cache.get(ids.channels.serverInfo) as TextChannel,
		channelsMessage = await serverInfo.messages.fetch("800415708851732491"),
		channelsEmbed = new EmbedBuilder({
			color: 0x0022ff,
			title: "Channels",
			description: "Each channel has important information pinned in it. We highly recommend checking it out.",
			fields: [
				{
					name: "**Important ❕**",
					value: `<#${ids.channels.announcements}> - Important messages from the server's admins.\n<#787050912005881876> - The channel where giveaways are hosted.\n<#${ids.channels.botUpdates}> - Here, updates to ${interaction.client.user} will be posted every now and then.\n<#646096405252800512> - In this channel we will post polls that you will be able to vote on in order to influence certain changes on the server.\n<#758314105328762912> - Updates from our bot's [GitHub repository](https://github.com/Hypixel-Translators/hypixel-translators-bot).\n<#${ids.channels.twitter}> - The feed of our [@HTranslators](https://twitter.com/HTranslators) Twitter page.\n${interaction.guild.rulesChannel} - All rules are listed here. Follow them, or there'll be consequences.\n<#${ids.channels.serverInfo}> - This channel has an overview of the server to help you understand how it works.\n<#699275092026458122> - A full guide on Crowdin available to all translators! Here you'll find basic and advanced tools to help you translate.\n<#${ids.channels.joinLeave}> - Displays members who join and leave the server.`,
				},
				{
					name: "**Main Channels 💬**",
					value: `<#621298919535804426> - You can use this channel to talk about anything you want really.\n<#619662798133133312> - A text channel where you can post your favorite memes.\n<#712046319375482910> - Post pics of your or someone else's cute pets here.\n<#644620638878695424> - A special channel for special people that have boosted our server. Thank you!\n<#550951034332381184> - A text channel where you can suggest things you would like to see on this Discord server.\n<#${ids.channels.bots}> -  A channel for you to use bot commands in.\n<#713084081579098152> - A text channel you can use when you can't speak in a voice chat.`,
				},
				{
					name: "**Translation Channels 🔠**",
					value:
						"We offer channels for each one of the currently supported projects: **Hypixel**, **Quickplay** and our **Bot**.\nEach category has 3 text channels: one for translators, one for proofreaders and one with the project's language status that gets updated every 20 minutes. They also have 2 voice channels: one for translators and one for proofreaders. If you have any questions related to your project, they should be sent here!",
				},
				{
					name: "**Language-specific channels 🌐**",
					value:
						"We offer channels where translators and proofreaders (of the Hypixel project) for specific languages can interact with one another! You can speak in English there, but we encourage you to speak the language you're translating. Please keep in mind these channels are not actively moderated. In case you need to report something that occured in these channels, please contact an administrator.",
				},
			],
		})
	await channelsMessage.edit({ content: null, embeds: [channelsEmbed] })

	const botsEmbed = new EmbedBuilder({
		color: 0x0055ff,
		title: "Bots",
		description: `Information about all bots on this server can be found here. They all support slash commands, so you can type \`/\` in <#${ids.channels.bots}> to see all their commands.`,
		fields: [
			{
				name: "**Bots**",
				value: `${interaction.client.user} - Our personalised bot! It is currently maintained by <@!240875059953139714> and has a bunch of useful features.\n<@!155149108183695360> - This is Dyno. He is used for moderation purposes and nothing else, so don't mind him.\n<@!472911936951156740> - VoiceMaster allows you to create custom voice channels by joining the <#880889993629941830> channel and you can use <#${ids.channels.bots}> to customise them.\n<@!819778342818414632> - Activities is a bot that lets you play games and do other fun things in voice chats! Try running the \`/activity\` command to try them out.`,
			},
			{
				name: "**How to verify link your Crowdin profile with our bot**",
				value:
					"Our server uses a custom verification system to always keep your roles synced with your Crowdin profile. In order to ensure that these are up to date, there are a few things you can do:\n - **Check if your profile is stored in our database.** This can be done by executing the `/profile` command (can be used anywhere)\n - **Update your roles manually.** If your roles have recently changed and you just can't wait for the bot to update them automatically, you can execute `/verify` and include your Crowdin profile (or not, if it's already stored) in the url parameter (press tab after typing the command to see all parameters)\nIf your profile is already stored, your roles will be automatically updated every day around 3am UTC, so you should not need to worry about this. If you notice a discrepancy in your roles, please contact the main developer of the bot.",
			},
		],
	})
	await serverInfo.messages.edit("800415710508744744", { content: null, embeds: [botsEmbed] })

	const rolesEmbed = new EmbedBuilder({
		color: 0x0077ff,
		title: "Roles",
		description: "Every role has a meaning behind it. Find out what they all are below!",
		fields: [
			{
				name: "**Discord staff**",
				value:
					"<@&549885900151193610> - The Discord Owner, <@!241926666400563203>, and Co-Owner, <@!240875059953139714>!\n<@&764442984119795732> - The Discord Administrator, <@!435546264432803840>!\n<@&621071221462663169> - Our beloved Discord Moderators who keep the chats clean.\n<@&621071248079716355> - Our amazing Discord Helpers, they're basically minimods.",
			},
			{
				name: "**Official Hypixel staff members**",
				value:
					"They do not moderate the Discord but they can be helpful when it comes to asking things regarding translation or the server (refer to rule 5).\n<@&624880339722174464> - Official Hypixel Administrators.\n<@&822787676482699297> - Official Hypixel Game Masters.",
			},
			{
				name: "**Translators**",
				value: `Each of the following roles applies to all 3 projects we support: **Hypixel**, **Quickplay** and our **Bot**.\n**Managers** - The managers of each project are the ones responsible for new strings, proofreader promotions, amongst other things. Please avoid tagging people with these roles (refer to rule 5).\n**Proofreaders** - The proofreaders of each language are the ones responsible for reviewing and approving strings. If you notice any mistakes, these are the people you should message.\n**Translators** - A translator's job is to suggest and vote on translations, which helps the proofreaders' job a lot.\n\nAdditionally, **Hypixel** translators get access to **Veteran Roles**, roles showing how long you've been on the project for, and **Language Roles**, which give you access to your language's private channels (refer to the [language-specific channels section](${channelsMessage.url}))`,
			},
			{
				name: "**Miscellaneous**",
				value:
					"<@&549894155174674432> - A role given to all bots in the Discord.\n<@&732586582787358781> - A role given to the current developer(s) of our bot.\n<@&618502156638617640> - A role given to people who have helped create art for this server.\n<@&766339653615484930> - A role given to the person who won the Trick'cord Treat contest in October 2020, <@!435546264432803840>\n<@&719263346909773864> - A role given to all of the people who've hosted giveaways in <#787050912005881876>!\n<@&557090185670557716> - A role given to all users that joined in the first 6 months of this server (August 28, 2019).",
			},
			{
				name: "**Self-roles**",
				value: `You can click on the buttons below to receive their corresponding roles. Here's what they do:\n<@&646098170794868757> - Click on the "📊 Polls" button to be notified whenever a new poll is posted on <#646096405252800512>.\n<@&732615152246980628> - Click on the "🤖 Bot Updates" button to be notified whenever a new major update to ${interaction.client.user} is posted on <#${ids.channels.botUpdates}>.\n<@&801052623745974272> - Click on the  "🎉 Giveaway Pings" button to be notified of future giveaways in <#787050912005881876>. Note that you must be at least chat level 5 to receive this role (you can check your level by doing /rank in <#${ids.channels.bots}>).\n<@&898319248953311272> - Click on the "<:crowdin:878439498717999196> Crowdin Updates" button to be notified whenever strings are added or removed from a project, or whenever the Hypixel project is built.`,
			},
		],
		footer: { text: "Need help? Ask your questions in #off-topic" },
	})
	await serverInfo.messages.edit("800415711864029204", { content: null, embeds: [rolesEmbed] })
}

async function rules(interaction: ChatInputCommandInteraction<"cached">) {
	const rulesEmbed = new EmbedBuilder({
		color: Colors.Blurple,
		title: "Server Rules",
		description:
			"Welcome to the rules channel! In this channel, you will find every rule on this discord server. Please do not break any of the rules listed below or there will be consequences.",
		fields: [
			{
				name: "1 - Do not say anything that might be offensive to someone else.",
				value: "This includes racial slurs and sexist terms, etc.",
			},
			{
				name: "2 - Do not impersonate anyone.",
				value:
					"This is currently mentioned specifically when you first join the discord but it also applies to other situations after you've been verified so please refrain from doing it.",
			},
			{
				name: "3 - Do not encourage self-harm or even threaten to kill anybody.",
				value: "These offenses will result in a permanent ban from the discord and a report to Discord's ToS team.",
			},
			{
				name: "4 - Nicks",
				value:
					'Your nickname must not contain zalgo or a prefix for a language you do not translate. Additionally, prefixes should only include the flag(s) of the language(s) you translate, separated by a dash ("-") (e.g. `[🇵🇹]` or `[🇩🇪-🇪🇸]`) and nothing else (e.g. your role on the project or alternative acronyms to resemble your language). The only exception applies to Chinese translators, who can include "CS" or "CT" in their prefixes if they do not wish to use the flags. Nicknames should also obey the remaining rules.',
			},
			{
				name: "5 - Do not excessively tag Discord and Hypixel Staff members/project managers.",
				value:
					"You are allowed to tag staff but please keep it to a minimum and only do so if you need an important question answered. Otherwise, please refrain from doing it. Please do not tag project managers unless they allow you to.",
			},
			{
				name: "6 - Always try to speak in English.",
				value:
					"If you make a reference in another language on a public channel, please explain to the people who don't speak that language what it means.",
			},
			{
				name: "7 - Follow all Hypixel rules.",
				value: "If you are not familiar with those, check them out [here](https://hypixel.net/rules).",
			},
			{
				name: "8- Follow Discord's ToS and Community Guidelines",
				value:
					"This includes not using modified Discord clients, self bots and more. Click [here](https://discord.com/terms) to read the ToS, or [here](https://discord.com/guidelines) to read the Community Guidelines",
			},
			{
				name: "And most importantly have fun!",
				value:
					"If you see something against the rules or something that makes you feel unsafe, please let staff know. We want this server to be a welcoming space for everyone!",
			},
		],
		footer: { text: "Have any questions? Ask any staff member, they're here to help!" },
	})
	await interaction.guild!.rulesChannel!.messages.edit("800412977220026398", { content: null, embeds: [rulesEmbed] })
}

async function verify(interaction: ChatInputCommandInteraction<"cached">) {
	const verifyEmbed = new EmbedBuilder({
		color: Colors.Blurple,
		author: { name: "Welcome!" },
		thumbnail: { url: interaction.guild.iconURL({ extension: "png" })! },
		title: `The ${interaction.guild.name}`,
		description: `Hello there and welcome to the __**Unofficial**__ Hypixel Translators Server! In order to verify yourself to have access to other channels, please follow the instructions below. While you wait we also suggest you check out ${
			interaction.guild!.rulesChannel
		} to be more familiar with the server rules once you've joined.`,
		fields: [
			{
				name: "Translator/Proofreader",
				value:
					'If you are a translator or proofreader for either the **Hypixel** or **Quickplay** projects, please send us the link to your Crowdin profile (e.g. <https://crowdin.com/profile/ImRodry> **and not** <https://crowdin.com/profile>) on **this channel** so that you can be automatically verified. Keep in mind that in order to be verified, your profile must be **public** and you must include your Discord username and discriminator in your "About" section (eg: Rodry#4020). If you don\'t receive your roles within 1 minute, please contact <@!240875059953139714>.',
			},
			{
				name: "Not a translator",
				value:
					"If you're not a translator for either one of the projects mentioned above and just want to join the server for fun, please run `/verify` in order to receive your roles. If this doesn't work, please mention <@!240875059953139714> on this channel saying so.",
			},
			{
				name: "Need help?",
				value:
					"Feel free to send a message on this channel, or DM either <@!240875059953139714>, <@!241926666400563203> or <@!435546264432803840> with any questions you might have!",
			},
		],
		footer: { text: "Have fun on our server!" },
	})
	await (interaction.client.channels.cache.get(ids.channels.verify) as TextChannel).messages.edit("787366444970541056", {
		content: "**Please read the entire message before sending anything on the channel.**",
		embeds: [verifyEmbed],
	})
}

export default command
