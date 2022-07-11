import { type ApplicationCommandOptionChoiceData, ApplicationCommandOptionType } from "discord.js"

import { ids } from "../../config.json"
import { client } from "../../index"
import { db, DbUser } from "../../lib/dbclient"
import { transformDiscordLocale } from "../../lib/util"

import type { Command, CommandStrings, GetStringFunction } from "../../lib/imports"

type Setting = typeof settings[number]["value"]

const settings = as<ApplicationCommandOptionChoiceData[]>()([
		{ name: "Send messages upon level up", value: "lvlUpMsg" },
		{ name: "Proofreader availability", value: "availability" },
	]),
	command: Command = {
		name: "settings",
		description: "Changes or shows your settings on the bot",
		options: [
			{
				type: ApplicationCommandOptionType.Subcommand,
				name: "get",
				description: "Shows the value of a setting",
				options: [
					{
						type: ApplicationCommandOptionType.String,
						name: "setting",
						description: "The setting to see",
						choices: settings,
						required: true,
					},
				],
			},
			{
				type: ApplicationCommandOptionType.Subcommand,
				name: "set",
				description: "Changes the value of a setting",
				options: [
					{
						type: ApplicationCommandOptionType.String,
						name: "setting",
						description: "The setting to change",
						choices: settings,
						required: true,
					},
					{
						type: ApplicationCommandOptionType.Boolean,
						name: "value",
						description: "The value to set the setting to",
						required: true,
					},
				],
			},
			{
				type: ApplicationCommandOptionType.Subcommand,
				name: "reset",
				description: "Resets the value of a setting",
				options: [
					{
						type: ApplicationCommandOptionType.String,
						name: "setting",
						description: "The setting to reset",
						choices: settings,
						required: true,
					},
				],
			},
		],
		async execute(interaction, getString: GetStringFunction) {
			if (!interaction.inCachedGuild()) return
			const setting = interaction.options.getString("setting", true) as Setting,
				readableSetting =
					(require(`../../../strings/${transformDiscordLocale(interaction.locale)}/commands.json`) as CommandStrings).options.settings?.get
						.options!.setting.choices![settings.find(s => s.value === setting)!.value] ?? settings.find(s => s.value === setting)!.name,
				dbUser = await client.getUser(interaction.user.id),
				defaultSettings = {
					lvlUpMsg: true,
					availability: true,
				}

			if (setting === "availability" && !interaction.member?.roles.cache.has(ids.roles.hypixelPf))
				return void (await interaction.reply({ content: getString("onlyPf"), ephemeral: true }))

			switch (interaction.options.getSubcommand() as "set" | "get" | "reset") {
				case "get":
					await interaction.reply({
						content: getString("isSetTo", {
							variables: { setting: `\`${readableSetting}\``, value: `\`${dbUser.settings?.[setting] ?? defaultSettings[setting]}\`` },
						}),
						ephemeral: true,
					})
					break
				case "set":
					const value = interaction.options.getBoolean("value", true)
					await db.collection<DbUser>("users").updateOne({ id: interaction.user.id }, { $set: { [`settings.${setting}`]: value } })
					await interaction.reply({
						content: getString("successSet", { variables: { setting: `\`${readableSetting}\``, value: `\`${value}\`` } }),
						ephemeral: true,
					})
					break
				case "reset":
					await db.collection<DbUser>("users").updateOne({ id: interaction.user.id }, { $unset: { [`settings.${setting}`]: true } })
					await interaction.reply({
						content: getString("successReset", { variables: { setting: `\`${readableSetting}\`` } }),
						ephemeral: true,
					})
					break
			}
		},
	}

export default command

type NarrowHelper<T> =
	| (T extends [] ? [] : never)
	| (T extends string | number | bigint | boolean ? T : never)
	| { [K in keyof T]: T[K] extends (...args: unknown[]) => unknown ? T[K] : NarrowHelper<T[K]> }
type Try<A1, A2, Catch = never> = A1 extends A2 ? A1 : Catch
type Narrow<T> = Try<T, [], NarrowHelper<T>>
function as<T>() {
	return <U extends T>(it: Narrow<U>) => it
}
