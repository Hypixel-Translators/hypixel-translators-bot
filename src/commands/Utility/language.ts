import { access, constants, readdir } from "node:fs"

import { type GuildMember, EmbedBuilder, ApplicationCommandOptionType } from "discord.js"

import { colors, ids } from "../../config.json"
import { client } from "../../index"
import { db, type DbUser } from "../../lib/dbclient"
import { generateTip, type MongoLanguage, transformDiscordLocale, botLocales } from "../../lib/util"

import type { Command, GetStringFunction } from "../../lib/imports"

const command: Command = {
	name: "language",
	description: "Changes your language, shows your current one or a list of available languages",
	options: [
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: "set",
			description: "Sets your language to a new one. Leave empty to see your current language",
			options: [
				{
					type: ApplicationCommandOptionType.String,
					name: "language",
					description: "The new language you want to set",
					required: true,
					autocomplete: true,
				},
			],
		},
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: "reset",
			description: "Resets your language",
		},
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: "list",
			description: "Gives you a list of all the available languages",
		},
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: "stats",
			description: "Gives you usage statistics for a given language. Admin-only",
			options: [
				{
					type: ApplicationCommandOptionType.String,
					name: "language",
					description: "The language to get usage statistics for",
					required: true,
					autocomplete: true,
				},
			],
		},
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
		let language = interaction.options.getString("language", ["set", "stats"].includes(subCommand))

		if (subCommand === "list") {
			const authorLanguage = (await client.getUser(interaction.user.id)).lang ?? transformDiscordLocale(interaction.locale),
				langList = botLocales
					.map<string | null>(locale => {
						if (locale === "empty" && !member?.roles.cache.has(ids.roles.admin)) return null
						const languageString = locale === "empty" ? "Empty" : getString(locale)
						return authorLanguage === locale ? `**${languageString}**` : languageString
					})
					.filter((value): value is string => Boolean(value))
					.sort((a, b) => a.replaceAll("**", "").localeCompare(b.replaceAll("**", ""), authorLanguage.replace("_", "-"))),
				embed = new EmbedBuilder({
					color: colors.neutral,
					author: { name: getString("moduleName") },
					title: getString("listTitle"),
					description: langList.join(", "),
				})
			await interaction.reply({ embeds: [embed] })
		} else if (subCommand === "stats") {
			if (!member?.roles.cache.has(ids.roles.admin))
				return void (await interaction.reply({ content: getString("errors.noAccess", { file: "global" }), ephemeral: true }))
			if (!botLocales.includes(language!)) throw "falseLang"
			const langUsers = await collection.find({ lang: language! }).toArray(),
				users: string[] = []
			langUsers.forEach(u => users.push(`<@!${u.id}>`))
			const embed = new EmbedBuilder({
				color: colors.neutral,
				author: { name: "Language" },
				title: `There ${
					langUsers.length === 1 ? `is ${langUsers.length} user` : `are ${langUsers.length} users`
				} using that language at the moment.`,
				footer: { text: randomTip, iconURL: member.displayAvatarURL({ extension: "png" }) },
			})

			if (language !== "en") embed.setDescription(users.join(", "))
			await interaction.reply({ embeds: [embed] })
		} else if (subCommand === "set") {
			if (language === "se") language = "sv"
			const languages = await db.collection<MongoLanguage>("languages").find().toArray(),
				mongoLanguage = languages.find(l => l.name.toLowerCase() === language)
			if (mongoLanguage) language = mongoLanguage.code
			if (language === "empty" && !member?.roles.cache.has(ids.roles.admin)) language = "denied"
			access(`./strings/${language}/language.json`, constants.F_OK, async err => {
				if (!err) {
					if (getString("changedToTitle", { lang: "en" }) !== getString("changedToTitle", { lang: language! }) || language === "en") {
						const result = await collection.updateOne({ id: interaction.user.id }, { $set: { lang: language! } })
						if (result.modifiedCount) {
							randomTip = generateTip(getString, language!)
							const embed = new EmbedBuilder({
								color: colors.success,
								author: { name: getString("moduleName", { lang: language! }) },
								title: getString("changedToTitle", { lang: language! }),
								description: getString("credits", { lang: language! }),
								footer: { text: randomTip, iconURL: (member ?? interaction.user).displayAvatarURL({ extension: "png" }) },
							})
							return await interaction.reply({ embeds: [embed] })
						} else {
							const embed = new EmbedBuilder({
								color: colors.error,
								author: { name: getString("moduleName", { lang: language! }) },
								title: getString("didntChange", { lang: language! }),
								description: getString("alreadyThis", { lang: language! }),
								footer: { text: randomTip, iconURL: (member ?? interaction.user).displayAvatarURL({ extension: "png" }) },
							})
							return await interaction.reply({ embeds: [embed] })
						}
					} else {
						const embed = new EmbedBuilder({
							color: colors.error,
							author: { name: getString("moduleName") },
							title: getString("didntChange"),
							description: getString("notTranslated"),
							footer: { text: randomTip, iconURL: (member ?? interaction.user).displayAvatarURL({ extension: "png" }) },
						})
						return await interaction.reply({ embeds: [embed] })
					}
				} else {
					readdir(stringsFolder, async (_err, files) => {
						const emptyIndex = files.indexOf("empty")
						if (~emptyIndex && !member?.roles.cache.has(ids.roles.admin)) files.splice(emptyIndex, 1)
						const embed = new EmbedBuilder({
							color: colors.error,
							author: { name: getString("moduleName") },
							title: getString("errorTitle"),
							description: `${getString("errorDescription")}\n\`${files.join("`, `")}\`\n${getString("suggestAdd")}`,
							footer: { text: randomTip, iconURL: (member ?? interaction.user).displayAvatarURL({ extension: "png" }) },
						})
						await interaction.reply({ embeds: [embed] })
					})
				}
			})
		} else if (subCommand === "reset") {
			const result = await collection.updateOne({ id: interaction.user.id }, { $unset: { lang: true } }),
				newLanguage = transformDiscordLocale(interaction.locale) // This is because now that language is not set, we can try to get the locale from discord
			if (result.modifiedCount) {
				randomTip = generateTip(getString, newLanguage)
				const embed = new EmbedBuilder({
					color: colors.success,
					author: { name: getString("moduleName", { lang: newLanguage }) },
					title: getString("resetTitle", { lang: newLanguage }),
					description: getString("credits", { lang: newLanguage }),
					footer: { text: randomTip, iconURL: (member ?? interaction.user).displayAvatarURL({ extension: "png" }) },
				})
				await interaction.reply({ embeds: [embed] })
			} else {
				const embed = new EmbedBuilder({
					color: colors.error,
					author: { name: getString("moduleName", { lang: newLanguage }) },
					title: getString("didntChange", { lang: newLanguage }),
					description: getString("notSet", { lang: newLanguage }),
					footer: { text: randomTip, iconURL: (member ?? interaction.user).displayAvatarURL({ extension: "png" }) },
				})
				await interaction.reply({ embeds: [embed] })
			}
		}
	},
}

export default command
