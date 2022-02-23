import { readdirSync } from "node:fs"

import {
	ChatInputCommandInteraction,
	GuildMember,
	Message,
	ActionRow,
	Embed,
	SelectMenuComponent,
	Colors,
	ComponentType,
	ApplicationCommandOptionType,
} from "discord.js"

import { ids } from "../../config.json"
import { client } from "../../index"
import { generateTip, transformDiscordLocale } from "../../lib/util"

import type { DbUser } from "../../lib/dbclient"
import type { Command, GetStringFunction } from "../../lib/imports"

const command: Command = {
	name: "help",
	description: "Shows you all available commands and general info about the bot.",
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
				{ name: "Main page", value: 0 },
				{ name: "Tools & Utilities", value: 1 },
				{ name: "Information commands", value: 2 },
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
			categories = ["Utility", "Info"],
			pages: Page[] = [
				{ number: 0, badge: "🏠", titleString: "mainPage" },
				{ number: 1, badge: "🛠️", titleString: "utilityHelp" },
				{ number: 2, badge: "ℹ️", titleString: "infoHelp" },
			]

		let pageIndex = 1
		categories.forEach(category => {
			const categoryCommands: string[] = []
			readdirSync(`./src/commands/${category}/`).forEach(cmd => categoryCommands.push(cmd.split(".").shift()!))
			categoryCommands.forEach(cmd => {
				if (client.commands.get(cmd)!.dev && interaction.channelId !== ids.channels.botDev) categoryCommands.splice(categoryCommands.indexOf(cmd), 1)
				else if (!client.commands.get(cmd)!.allowDM && interaction.channel!.isDMBased()) categoryCommands.splice(categoryCommands.indexOf(cmd), 1)
			})
			pages[pageIndex].commands = categoryCommands
			pageIndex++
		})

		const commandInput = interaction.options.getString("command", false),
			pageInput = interaction.options.getInteger("page", false)

		if (!commandInput) {
			let pageNum = 0
			if (pageInput) pageNum = pageInput

			const page1 = new Embed({
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
				page1.addField({
					name: getString("pageNumber", { variables: { number: page.number, total: pages.length } }),
					value: `${page.badge} ${getString(page.titleString)}`,
					inline: true,
				})
			})

			pages[0].embed = page1

			// Determine which page to use
			let pageEmbed = fetchPage(pageNum, pages, getString, interaction)!
			const pageMenu = new ActionRow({
					// TODO remove toJSON() because it's redundant but it's needed due to a typings error
					components: [
						new SelectMenuComponent({
							customId: "page",
							options: pages.map(p => ({
								label: getString(p.titleString),
								value: `${p.number}`,
								emoji: { name: p.badge },
								default: p.number === pageNum,
							})),
						}).toJSON(),
					],
				}),
				msg = (await interaction.reply({ embeds: [pageEmbed], components: [pageMenu], fetchReply: true })) as Message,
				collector = msg.createMessageComponentCollector<ComponentType.SelectMenu>({ idle: this.cooldown! * 1000 })

			collector.on("collect", async menuInteraction => {
				const userDb: DbUser = await client.getUser(menuInteraction.user.id),
					option = menuInteraction.values[0]
				if (interaction.user.id !== menuInteraction.user.id) {
					return await menuInteraction.reply({
						content: getString("pagination.notYours", {
							variables: { command: `/${this.name}` },
							file: "global",
							lang: userDb.lang ?? transformDiscordLocale(menuInteraction.locale),
						}),
						ephemeral: true,
					})
				} else pageNum = Number(option)
				pageEmbed = fetchPage(pageNum, pages, getString, interaction)!
				;(pageMenu.components[0] as SelectMenuComponent).options.forEach(o => o.setDefault(option === o.value))
				await menuInteraction.update({ embeds: [pageEmbed], components: [pageMenu] })
			})

			collector.on("end", async () => {
				pageMenu.components.forEach(component => component.setDisabled(true))
				await interaction.editReply({
					content: getString("pagination.timeOut", { variables: { command: `\`/${this.name}\`` }, file: "global" }),
					embeds: [pageEmbed],
					components: [pageMenu],
				})
			})
		} else {
			const cmd = client.commands.get(commandInput)
			if (!cmd || !cmd.name) throw "noCommand"

			let cmdDesc: string | undefined
			if (cmd.category !== "Admin" && cmd.category !== "Staff") cmdDesc = getString(`${cmd.name}.description`)
			else if (
				(cmd.category === "Staff" && member?.roles.cache.has(ids.roles.staff)) ||
				(cmd.category === "Admin" && member?.roles.cache.has(ids.roles.admin))
			)
				cmdDesc = cmd.description

			if (cmd.dev && !member?.roles.cache.has(ids.roles.staff)) cmdDesc = getString("inDev")

			const embed = new Embed({
				color: Colors.Blurple,
				author: { name: getString("moduleName") },
				title: `${getString("commandInfoFor")}\`/${cmd.name}\``,
				description: cmdDesc ?? getString("staffOnly"),
				footer: { text: randomTip, iconURL: (member ?? interaction.user).displayAvatarURL({ extension: "png" }) },
			})
			if (cmdDesc !== getString("inDev")) {
				if (cmd.cooldown) {
					if (cmd.cooldown >= 120)
						embed.addField({ name: getString("cooldownField"), value: `${cmd.cooldown / 60} ${getString("minutes")}`, inline: true })
					else if (cmd.cooldown === 1)
						embed.addField({ name: getString("cooldownField"), value: `${cmd.cooldown} ${getString("second")}`, inline: true })
					else embed.addField({ name: getString("cooldownField"), value: `${cmd.cooldown} ${getString("seconds")}`, inline: true })
				}
			}
			await interaction.reply({ embeds: [embed] })
		}
	},
}

function fetchPage(page: number, pages: Page[], getString: GetStringFunction, interaction: ChatInputCommandInteraction) {
	if (page > pages.length - 1) page = pages.length - 1
	if (page < 0) page = 0
	let pageEmbed: Embed

	if (pages[page]) {
		if (pages[page].embed) pageEmbed = pages[page].embed!
		else if (pages[page].commands) {
			pageEmbed = new Embed({
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
			pages[page].commands!.forEach(cmd => pageEmbed!.addField({ name: `\`/${cmd}\``, value: getString(`${cmd}.description`) }))
		} else return console.error(`Help page ${page} has no embed fields specified!`)
	} else return console.error(`Tried accessing help page ${page} but it doesn't exist in the pages array!`)

	return pageEmbed
}

interface Page {
	number: number
	commands?: string[]
	badge: string
	titleString: string
	embed?: Embed
}

export default command
