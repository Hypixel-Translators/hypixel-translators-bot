import { readdirSync } from "node:fs"
import { CommandInteraction, GuildMember, Message, MessageActionRow, MessageEmbed, MessageSelectMenu } from "discord.js"
import { client } from "../../index"
import { ids } from "../../config.json"
import { generateTip } from "../../lib/util"

import type { DbUser } from "../../lib/dbclient"
import type { Command, GetStringFunction } from "../../lib/imports"

const command: Command = {
	name: "help",
	description: "Shows you all available commands and general info about the bot.",
	options: [{
		type: "STRING",
		name: "command",
		description: "The command to get information for",
		required: false
	},
	{
		type: "INTEGER",
		name: "page",
		description: "The help page to open",
		choices: [
			{ name: "Main page", value: 0 },
			{ name: "Tools & Utilities", value: 1 },
			{ name: "Information commands", value: 2 }
		],
		required: false
	}],
	cooldown: 60,
	channelWhitelist: [ids.channels.bots, ids.channels.staffBots, ids.channels.botDev],
	allowDM: true,
	async execute(interaction, getString: GetStringFunction) {
		const randomTip = generateTip(getString),
			member = interaction.member as GuildMember | null

		// Define categories to get commands from and all pages
		const categories = ["Utility", "Info"],
			pages: Page[] = [
				{ number: 0, badge: "🏠", titleString: "mainPage" },
				{ number: 1, badge: "🛠️", titleString: "utilityHelp" },
				{ number: 2, badge: "ℹ️", titleString: "infoHelp" }
			]

		let pageIndex = 1
		categories.forEach(category => {
			const categoryCommands: string[] = []
			readdirSync(`./src/commands/${category}/`).forEach(command => categoryCommands.push(command.split(".").shift()!))
			categoryCommands.forEach(cmd => {
				if (client.commands.get(cmd)!.dev && interaction.channelId !== ids.channels.botDev) categoryCommands.splice(categoryCommands.indexOf(cmd), 1)
				else if (!client.commands.get(cmd)!.allowDM && interaction.channel!.type === "DM") categoryCommands.splice(categoryCommands.indexOf(cmd), 1)
			})
			pages[pageIndex].commands = categoryCommands
			pageIndex++
		})

		const commandInput = interaction.options.getString("command", false),
			pageInput = interaction.options.getInteger("page", false)

		if (!commandInput) {

			let page = 0
			if (pageInput) page = pageInput

			const page1 = new MessageEmbed()
				.setColor("BLURPLE")
				.setAuthor(getString("moduleName"))
				.setTitle(`${pages[0].badge} ${getString("mainPage")}`)
				.setDescription(getString("commandsListTooltip", { developer: client.users.cache.get(ids.users.rodry)!.toString(), github: "(https://github.com/Hypixel-Translators/hypixel-translators-bot)" }))
				.setFooter(randomTip, (member ?? interaction.user).displayAvatarURL({ format: "png", dynamic: true }))
			pages.forEach(page => {
				if (page.number === 0) return
				page1.addField(getString("pageNumber", { number: page.number, total: pages.length }), `${page.badge} ${getString(page.titleString)}`, true)
			})

			pages[0].embed = page1

			//Determine which page to use
			let pageEmbed = fetchPage(page, pages, getString, interaction)!
			const pageMenu = new MessageActionRow()
				.addComponents(
					new MessageSelectMenu()
						.setCustomId("page")
						.addOptions(
							pages.map(p => ({
								label: getString(p.titleString),
								value: `${p.number}`,
								emoji: p.badge,
								default: p.number === page
							}))
						)
				)

			const msg = await interaction.reply({ embeds: [pageEmbed], components: [pageMenu], fetchReply: true }) as Message,
				collector = msg.createMessageComponentCollector<"SELECT_MENU">({ idle: this.cooldown! * 1000 })

			collector.on("collect", async menuInteraction => {
				const userDb: DbUser = await client.getUser(menuInteraction.user.id),
					option = menuInteraction.values[0]
				if (interaction.user.id !== menuInteraction.user.id) return await menuInteraction.reply({ content: getString("pagination.notYours", { command: `/${this.name}` }, "global", userDb.lang), ephemeral: true })
				else page = Number(option)
				pageEmbed = fetchPage(page, pages, getString, interaction)!;
				(pageMenu.components[0] as MessageSelectMenu).options.forEach(o => o.default = option === o.value)
				await menuInteraction.update({ embeds: [pageEmbed], components: [pageMenu] })
			})

			collector.on("end", async () => {
				pageMenu.components.forEach(component => component.setDisabled(true))
				await interaction.editReply({ content: getString("pagination.timeOut", { command: `\`/${this.name}\`` }, "global"), embeds: [pageEmbed], components: [pageMenu] })
			})

		} else {

			const command = client.commands.get(commandInput)
			if (!command || !command.name) throw "noCommand"

			let cmdDesc: string | undefined = undefined
			if (command.category !== "Admin" && command.category !== "Staff") {
				cmdDesc = getString(`${command.name}.description`)
			} else if (command.category === "Staff" && member?.roles.cache.has(ids.roles.staff) || command.category === "Admin" && member?.roles.cache.has(ids.roles.admin)) {
				cmdDesc = command.description
			}

			if (command.dev && !member?.roles.cache.has(ids.roles.staff)) cmdDesc = getString("inDev")

			const embed = new MessageEmbed()
				.setColor("BLURPLE")
				.setAuthor(getString("moduleName"))
				.setTitle(getString("commandInfoFor") + `\`/${command.name}\``)
				.setDescription(cmdDesc ?? getString("staffOnly"))
				.setFooter(randomTip, (member ?? interaction.user).displayAvatarURL({ format: "png", dynamic: true }))
			if (cmdDesc !== getString("inDev")) {
				if (command.cooldown) {
					if (command.cooldown >= 120) embed.addField(getString("cooldownField"), `${command.cooldown / 60} ${getString("minutes")}`, true)
					else if (command.cooldown === 1) embed.addField(getString("cooldownField"), `${command.cooldown} ${getString("second")}`, true)
					else embed.addField(getString("cooldownField"), `${command.cooldown} ${getString("seconds")}`, true)
				}
			}
			await interaction.reply({ embeds: [embed] })
		}
	}
}

function fetchPage(page: number, pages: Page[], getString: GetStringFunction, interaction: CommandInteraction) {
	if (page > pages.length - 1) page = pages.length - 1
	if (page < 0) page = 0
	let pageEmbed: MessageEmbed

	if (pages[page]) {
		if (pages[page].embed) pageEmbed = pages[page].embed!
		else if (pages[page].commands) {
			pageEmbed = new MessageEmbed()
				.setColor("BLURPLE")
				.setAuthor(getString("moduleName"))
				.setTitle(`${pages[page].badge} ${getString(pages[page].titleString!)}`)
				.setFooter(
					getString("pagination.page", { number: page + 1, total: pages.length }, "global"),
					((interaction.member as GuildMember | null) ?? interaction.user).displayAvatarURL({ format: "png", dynamic: true })
				)
			pages[page].commands!.forEach(command => pageEmbed!.addField(`\`/${command}\``, getString(`${command}.description`)))
		} else return console.error(`Help page ${page} has no embed fields specified!`)
	} else return console.error(`Tried accessing help page ${page} but it doesn't exist in the pages array!`)

	return pageEmbed
}

interface Page {
	number: number
	commands?: string[]
	badge: string
	titleString: string
	embed?: MessageEmbed
}

export default command
