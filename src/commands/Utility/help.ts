import Discord from "discord.js"
import fs from "fs"
import { Command, client, GetStringFunction } from "../../index"
import { DbUser } from "../../lib/dbclient"

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
			{ name: "Information commands", value: 2 },
			{ name: "Crowdin Projects", value: 3 }
		],
		required: false
	}],
	cooldown: 60,
	channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058"], //bots staff-bots bot-dev 
	allowDM: true,
	async execute(interaction, getString: GetStringFunction) {
		const executedBy = getString("executedBy", { user: interaction.user.tag }, "global"),
			madeBy = getString("madeBy", { developer: (await client.users.fetch("807917674477649943")).tag }) //QkeleQ10

		// Define categories to get commands from and all pages
		const categories = ["Utility", "Info", "Projects"],
			pages = [
				{ number: 0, badge: "🏠", titleString: "mainPage" },
				{ number: 1, badge: "🛠️", titleString: "utilityHelp" },
				{ number: 2, badge: "ℹ️", titleString: "infoHelp" },
				{ number: 3, badge: "<:crowdin:820381256016723988>", titleString: "projectsHelp" }
			] as Page[]

		let pageIndex = 1
		categories.forEach(category => {
			const categoryCommands: string[] = []
			fs.readdirSync(`./src/commands/${category}/`).forEach(command => categoryCommands.push(command.split(".").shift()!))
			categoryCommands.forEach(cmd => {
				if (client.commands.get(cmd)!.dev) categoryCommands.splice(categoryCommands.indexOf(cmd), 1)
				else if (!client.commands.get(cmd)!.allowDM && (interaction.channel as Discord.TextChannel | Discord.DMChannel).type === "DM") categoryCommands.splice(categoryCommands.indexOf(cmd), 1)
			})
			pages[pageIndex].commands = categoryCommands
			pageIndex++
		})

		const commandInput = interaction.options.getString("command", false),
			pageInput = interaction.options.getInteger("page", false)

		if (!commandInput) {

			let page = 0
			if (pageInput) page = pageInput

			const page1 = new Discord.MessageEmbed()
				.setColor("BLURPLE")
				.setAuthor(getString("moduleName"))
				.setTitle(`${pages[0].badge} ${getString("mainPage")}`)
				.setDescription(getString("commandsListTooltip", { developer: client.users.cache.get("240875059953139714")!.toString(), github: "(https://github.com/Hypixel-Translators/hypixel-translators-bot)" }))
				.setFooter(`${executedBy} | ${madeBy}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
			pages.forEach(page => {
				if (page.number === 0) return
				page1.addField(getString("pageNumber", { number: page.number, total: pages.length }), `${page.badge} ${getString(page.titleString)}`, true)
			})

			pages[0].embed = page1

			//Determine which page to use
			let pageEmbed = fetchPage(page, pages, getString, executedBy, interaction) as Discord.MessageEmbed
			const pageMenu = new Discord.MessageActionRow()
				.addComponents(
					new Discord.MessageSelectMenu()
						.setCustomId("page")
				)

			pages.forEach(p => (pageMenu.components[0] as Discord.MessageSelectMenu).addOptions({
				label: getString(p.titleString),
				value: `${p.number}`,
				emoji: p.badge,
				default: p.number === page
			}))

			const msg = await interaction.reply({ embeds: [pageEmbed], components: [pageMenu], fetchReply: true }) as Discord.Message,
				collector = msg.createMessageComponentCollector({ time: this.cooldown! * 1000 })

			collector.on("collect", async componentInteraction => {
				if (!componentInteraction.isSelectMenu()) return //this is just to set the typings properly, it won't actually trigger
				const userDb: DbUser = await client.getUser(componentInteraction.user.id),
					option = componentInteraction.values[0]
				if (interaction.user.id !== componentInteraction.user.id) return await componentInteraction.reply({ content: getString("pagination.notYours", { command: `/${this.name}` }, "global", userDb.lang), ephemeral: true })
				else page = Number(option)
				pageEmbed = fetchPage(page, pages, getString, executedBy, interaction) as Discord.MessageEmbed
				(pageMenu.components[0] as Discord.MessageSelectMenu).options.forEach(o => o.default = option === o.value)
				await componentInteraction.update({ embeds: [pageEmbed], components: [pageMenu] })
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
			} else if (command.category === "Staff" && (interaction.member as Discord.GuildMember | null)?.roles.cache.has("768435276191891456") || command.category === "Admin" && (interaction.member as Discord.GuildMember | null)?.roles.cache.has("764442984119795732")) {
				cmdDesc = command.description
			}

			if (command.dev && !(interaction.member as Discord.GuildMember | null)?.roles.cache.has("768435276191891456")) cmdDesc = getString("inDev") // Discord Staff

			const embed = new Discord.MessageEmbed()
				.setColor("BLURPLE")
				.setAuthor(getString("moduleName"))
				.setTitle(getString("commandInfoFor") + `\`/${command.name}\``)
				.setDescription(cmdDesc || getString("staffOnly"))
				.setFooter(`${executedBy} | ${madeBy}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
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

function fetchPage(page: number, pages: Page[], getString: GetStringFunction, executedBy: string, interaction: Discord.CommandInteraction) {
	if (page > pages.length - 1) page = pages.length - 1
	if (page < 0) page = 0
	let pageEmbed: Discord.MessageEmbed

	if (pages[page]) {
		if (pages[page].embed) pageEmbed = pages[page].embed!
		else if (pages[page].commands) {
			pageEmbed = new Discord.MessageEmbed()
				.setColor("BLURPLE")
				.setAuthor(getString("moduleName"))
				.setTitle(`${pages[page].badge} ${getString(pages[page].titleString!)}`)
				.setFooter(`${getString("pagination.page", { number: page + 1, total: pages.length }, "global")} | ${executedBy}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
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
	embed?: Discord.MessageEmbed
}

export default command
