import { access, constants, readdir, readdirSync } from "node:fs"
import { GuildMember, MessageEmbed } from "discord.js"
import { colors, ids } from "../../config.json"
import { db, DbUser } from "../../lib/dbclient"
import { generateTip, LangDbEntry } from "../../lib/util"

import type { Command, GetStringFunction } from "../../lib/imports"

const command: Command = {
	name: "language",
	description: "Changes your language, shows your current one or a list of available languages.",
	options: [
		{
			type: "SUB_COMMAND",
			name: "set",
			description: "Sets your language to a new one. Leave empty to see your current language",
			options: [
				{
					type: "STRING",
					name: "language",
					description: "The new language you want to set",
					required: false,
					autocomplete: true
				}
			]
		},
		{
			type: "SUB_COMMAND",
			name: "list",
			description: "Gives you a list of all the available languages"
		},
		{
			type: "SUB_COMMAND",
			name: "stats",
			description: "Gives you usage statistics for a given language. Admin only",
			options: [
				{
					type: "STRING",
					name: "language",
					description: "The language to get usage statistics for",
					required: true,
					autocomplete: true
				}
			]
		}
	],
	channelWhitelist: [ids.channels.bots, ids.channels.staffBots, ids.channels.botDev],
	allowDM: true,
	cooldown: 5,
	async execute(interaction, getString: GetStringFunction) {
		let randomTip: string = generateTip(getString)
		const collection = db.collection<DbUser>("users"),
			stringsFolder = "./strings/",
			member = interaction.member as GuildMember | null,
			subCommand = interaction.options.getSubcommand()
		let language = interaction.options.getString("language", subCommand === "stats")?.toLowerCase()

		if (subCommand === "list") {
			const files = readdirSync(stringsFolder),
				langList: string[] = []
			files.forEach(async (element, index, array) => {
				if (element === "empty" && !member?.roles.cache.has(ids.roles.admin)) return
				let languageString: string
				if (element === "empty") languageString = "Empty"
				else languageString = getString(element)
				langList.push(getString("listElement", { code: element, language: languageString ?? "Unknown" }))
				if (index === array.length - 1) {
					const embed = new MessageEmbed({
						color: colors.neutral,
						author: { name: getString("moduleName") },
						title: getString("listTitle"),
						description: langList.join("\n")
					})
					await interaction.reply({ embeds: [embed] })
				}
			})
		} else if (subCommand === "stats") {
			if (!member?.roles.cache.has(ids.roles.admin))
				return await interaction.reply({ content: getString("errors.noAccess", "global"), ephemeral: true })
			const files = readdirSync(stringsFolder)
			if (!files.includes(language!)) throw "falseLang"
			const langUsers = await collection.find({ lang: language! }).toArray(),
				users: string[] = []
			langUsers.forEach(u => users.push(`<@!${u.id}>`))
			const embed = new MessageEmbed({
				color: colors.neutral,
				author: { name: "Language" },
				title: `There ${langUsers.length === 1 ? `is ${langUsers.length} user` : `are ${langUsers.length} users`} using that language at the moment.`,
				footer: { text: randomTip, iconURL: member.displayAvatarURL({ format: "png", dynamic: true }) }
			})

			if (language !== "en") embed.setDescription(users.join(", "))
			await interaction.reply({ embeds: [embed] })
		} else if (subCommand === "set" && language) {
			if (language === "se") language = "sv"
			const langdb = await db.collection<LangDbEntry>("langdb").find().toArray(),
				langdbEntry = langdb.find(l => l.name.toLowerCase() === language)
			if (langdbEntry) language = langdbEntry.code
			if (language === "empty" && !member?.roles.cache.has(ids.roles.admin)) language = "denied"
			access(`./strings/${language}/language.json`, constants.F_OK, async err => {
				if (!err) {
					if (
						getString("changedToTitle", this.name, "en") !== getString("changedToTitle", this.name, language) ||
						language === "en"
					) {
						const result = await collection.updateOne({ id: interaction.user.id }, { $set: { lang: language! } })
						if (result.modifiedCount) {
							randomTip = generateTip(getString, language)
							const embed = new MessageEmbed({
								color: colors.success,
								author: { name: getString("moduleName", this.name, language) },
								title: getString("changedToTitle", this.name, language),
								description: getString("credits", this.name, language),
								footer: { text: randomTip, iconURL: (member ?? interaction.user).displayAvatarURL({ format: "png", dynamic: true }) }
							})
							return await interaction.reply({ embeds: [embed] })
						} else {
							const embed = new MessageEmbed({
								color: colors.error,
								author: { name: getString("moduleName", this.name, language) },
								title: getString("didntChange", language),
								description: getString("alreadyThis", this.name, language),
								footer: { text: randomTip, iconURL: (member ?? interaction.user).displayAvatarURL({ format: "png", dynamic: true }) }
							})
							return await interaction.reply({ embeds: [embed] })
						}
					} else {
						const embed = new MessageEmbed({
							color: colors.error,
							author: { name: getString("moduleName") },
							title: getString("didntChange"),
							description: getString("notTranslated"),
							footer: { text: randomTip, iconURL: (member ?? interaction.user).displayAvatarURL({ format: "png", dynamic: true }) }
						})
						return await interaction.reply({ embeds: [embed] })
					}
				} else {
					readdir(stringsFolder, async (_err, files) => {
						const emptyIndex = files.indexOf("empty")
						if (emptyIndex > -1 && !member?.roles.cache.has(ids.roles.admin)) files.splice(emptyIndex, 1)
						const embed = new MessageEmbed({
							color: colors.error,
							author: { name: getString("moduleName") },
							title: getString("errorTitle"),
							description: `${getString("errorDescription")}\n\`${files.join("`, `")}\`\n${getString("suggestAdd")}`,
							footer: { text: randomTip, iconURL: (member ?? interaction.user).displayAvatarURL({ format: "png", dynamic: true }) }
						})
						await interaction.reply({ embeds: [embed] })
					})
				}
			})
		} else {
			const files = readdirSync(stringsFolder),
				emptyIndex = files.indexOf("empty")
			if (emptyIndex > -1 && !member?.roles.cache.has(ids.roles.admin)) files.splice(emptyIndex, 1)
			const embed = new MessageEmbed({
				color: colors.neutral,
				author: { name: getString("moduleName") },
				title: getString("current"),
				description: `${getString("errorDescription")}\n\`${files.join("`, `")}\`\n\n${getString("credits")}`,
				footer: { text: randomTip, iconURL: (member ?? interaction.user).displayAvatarURL({ format: "png", dynamic: true }) }
			})
			await interaction.reply({ embeds: [embed] })
		}
	}
}

export default command
