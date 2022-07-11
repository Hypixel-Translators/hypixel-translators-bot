import { readdirSync } from "node:fs"

import {
	type ChatInputCommandInteraction,
	type GuildMember,
	EmbedBuilder,
	SelectMenuBuilder,
	Colors,
	ComponentType,
	ApplicationCommandOptionType,
} from "discord.js"

import { ids } from "../../config.json"
import { client } from "../../index"
import { generateTip, transformDiscordLocale } from "../../lib/util"

import type { Command, GetStringFunction } from "../../lib/imports"

const command: Command = {
	name: "help",
	description: "Shows you all available commands and general info about the bot",
	options: [
		{
			type: ApplicationCommandOptionType.String,
			name: "command",
			description: "The command to get information for",
			required: false,
			autocomplete: true,
		},
		{
			type: ApplicationCommandOptionType.Integer,
			name: "page",
			description: "The help page to open",
			choices: [
				{ name: "Main Page", value: 0 },
				{ name: "Tools & Utilities", value: 1 },
				{ name: "Information Commands", value: 2 },
			],
			required: false,
		},
	],
	cooldown: 60,
	channelWhitelist: [ids.channels.bots, ids.channels.staffBots, ids.channels.botDev],
	allowDM: true,
	async execute(interaction, getString: GetStringFunction) {
		const randomTip = generateTip(getString),
			member = interaction.member as GuildMember | null,
			// Define categories to get commands from and all pages
			pages: Page[] = [
				{ number: 0, badge: "🏠", titleString: "mainPage" },
				{ number: 1, badge: "🛠️", titleString: "utilityHelp" },
				{ number: 2, badge: "ℹ️", titleString: "infoHelp" },
			]

		let pageIndex = 1
		;["Utility", "Info"].forEach(category => {
			const categoryCommands: string[] = []
			readdirSync(`./src/commands/${category}/`).forEach(cmd => categoryCommands.push(cmd.split(".").shift()!))
			categoryCommands.forEach(cmd => {
				if (client.commands.get(cmd)!.dev && interaction.channelId !== ids.channels.botDev)
					categoryCommands.splice(categoryCommands.indexOf(cmd), 1)
				else if (!client.commands.get(cmd)!.allowDM && interaction.channel!.isDMBased())
					categoryCommands.splice(categoryCommands.indexOf(cmd), 1)
			})
			pages[pageIndex].commands = categoryCommands
			pageIndex++
		})

		const commandInput = interaction.options.getString("command", false),
			pageInput = interaction.options.getInteger("page", false)

		if (!commandInput) {
			let pageNum = 0
			if (pageInput) pageNum = pageInput

			const page1 = new EmbedBuilder({
				color: Colors.Blurple,
				author: { name: getString("moduleName") },
				title: `${pages[0].badge} ${getString("mainPage")}`,
				description: getString("commandsListTooltip", {
					variables: {
						developer: client.users.cache.get(ids.users.rodry)!.toString(),
						github: "(https://github.com/Hypixel-Translators/hypixel-translators-bot)",
					},
				}),
				footer: { text: randomTip, iconURL: (member ?? interaction.user).displayAvatarURL({ extension: "png" }) },
			})
			pages.forEach(page => {
				if (page.number === 0) return
				page1.addFields({
					name: getString("pageNumber", { variables: { number: page.number } }),
					value: `${page.badge} ${getString(page.titleString)}`,
					inline: true,
				})
			})

			pages[0].embed = page1

			// Determine which page to use
			let pageEmbed = fetchPage(pageNum, pages, getString, interaction)!
			const createMenu = (selected: number) => {
					const isSelected = (index: number) => selected === index
					return new SelectMenuBuilder({
						customId: "page",
						options: pages.map(p => ({
							label: getString(p.titleString),
							value: `${p.number}`,
							emoji: p.badge,
							default: isSelected(p.number),
						})),
					})
				},
				msg = await interaction.reply({
					embeds: [pageEmbed],
					components: [{ type: ComponentType.ActionRow, components: [createMenu(pageNum)] }],
					fetchReply: true,
				}),
				collector = msg.createMessageComponentCollector<ComponentType.SelectMenu>({
					idle: this.cooldown! * 1000,
					filter: menuInteraction => interaction.user.id === menuInteraction.user.id,
				})

			collector.on("ignore", async menuInteraction => {
				const userDb = await client.getUser(menuInteraction.user.id)
				await menuInteraction.reply({
					content: getString("pagination.notYours", {
						variables: { command: `/${this.name}` },
						file: "global",
						lang: userDb.lang ?? transformDiscordLocale(menuInteraction.locale),
					}),
					ephemeral: true,
				})
			})

			collector.on("collect", async menuInteraction => {
				pageNum = Number(menuInteraction.values[0])
				pageEmbed = fetchPage(pageNum, pages, getString, interaction)!
				await menuInteraction.update({
					embeds: [pageEmbed],
					components: [{ type: ComponentType.ActionRow, components: [createMenu(pageNum)] }],
				})
			})

			collector.on("end", async () => {
				await interaction.editReply({
					content: getString("pagination.timeOut", { variables: { command: `\`/${this.name}\`` }, file: "global" }),
					embeds: [pageEmbed],
					components: [{ type: ComponentType.ActionRow, components: [createMenu(pageNum).setDisabled()] }],
				})
			})
		} else {
			const cmd = client.commands.get(commandInput)
			if (!cmd || !cmd.name) throw "noCommand"

			let cmdDesc: string | undefined
			if (cmd.category !== "Admin" && cmd.category !== "Staff") cmdDesc = getString(`descriptions.${cmd.name}`)
			else if (
				(cmd.category === "Staff" && member?.roles.cache.has(ids.roles.staff)) ||
				(cmd.category === "Admin" && member?.roles.cache.has(ids.roles.admin))
			)
				cmdDesc = cmd.description

			if (cmd.dev && !member?.roles.cache.has(ids.roles.staff)) cmdDesc = getString("inDev")

			const embed = new EmbedBuilder({
				color: Colors.Blurple,
				author: { name: getString("moduleName") },
				title: `${getString("commandInfoFor")}\`/${cmd.name}\``,
				description: cmdDesc ?? getString("staffOnly"),
				footer: { text: randomTip, iconURL: (member ?? interaction.user).displayAvatarURL({ extension: "png" }) },
			})
			if (cmdDesc !== getString("inDev")) {
				if (cmd.cooldown) {
					if (cmd.cooldown >= 60) {
						embed.addFields({
							name: getString("cooldownField"),
							value: getString("minutes", { variables: { number: cmd.cooldown / 60 } }),
							inline: true,
						})
					} else {
						embed.addFields({
							name: getString("cooldownField"),
							value: getString("seconds", { variables: { number: cmd.cooldown } }),
							inline: true,
						})
					}
				}
			}
			await interaction.reply({ embeds: [embed] })
		}
	},
}

function fetchPage(page: number, pages: Page[], getString: GetStringFunction, interaction: ChatInputCommandInteraction) {
	if (page > pages.length - 1) page = pages.length - 1
	if (page < 0) page = 0
	let pageEmbed: EmbedBuilder

	if (pages[page]) {
		if (pages[page].embed) pageEmbed = pages[page].embed!
		else if (pages[page].commands) {
			pageEmbed = new EmbedBuilder({
				color: Colors.Blurple,
				author: { name: getString("moduleName") },
				title: `${pages[page].badge} ${getString(pages[page].titleString!)}`,
				footer: {
					text: getString("pagination.page", {
						variables: {
							number: page + 1,
							total: pages.length,
						},
						file: "global",
					}),
					iconURL: ((interaction.member as GuildMember | null) ?? interaction.user).displayAvatarURL({ extension: "png" }),
				},
			})
			pages[page].commands!.forEach(cmd => pageEmbed!.addFields({ name: `\`/${cmd}\``, value: getString(`descriptions.${cmd}`) }))
		} else return console.error(`Help page ${page} has no embed fields specified!`)
	} else return console.error(`Tried accessing help page ${page} but it doesn't exist in the pages array!`)

	return pageEmbed
}

interface Page {
	number: number
	commands?: string[]
	badge: string
	titleString: string
	embed?: EmbedBuilder
}

export default command
