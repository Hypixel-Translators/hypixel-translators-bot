import {
	ActionRowBuilder,
	ApplicationCommandOptionType,
	ButtonBuilder,
	ButtonStyle,
	type ComponentType,
	type GuildMember,
	Role,
	SelectMenuBuilder,
	type SelectMenuComponentOptionData,
} from "discord.js"

import { ids } from "../../config.json"
import { db, type DbUser } from "../../lib/dbclient"
import { type MongoLanguage, splitArray } from "../../lib/util"

import type { Command } from "../../lib/imports"

const command: Command = {
	name: "alert",
	description: "Alerts other proofreaders for issues in their translations",
	options: [
		{
			type: ApplicationCommandOptionType.String,
			name: "message",
			description: "The message to send to the proofreaders",
			required: true,
		},
	],
	roleWhitelist: [ids.roles.hypixelPf, ids.roles.hypixelManager],
	channelWhitelist: [ids.channels.hypixelPfs],
	async execute(interaction) {
		if (!interaction.inCachedGuild()) return
		await interaction.deferReply({ ephemeral: true })
		// Ensure message has no language set
		const message = interaction.options.getString("message")?.replace(/\/en-(?!en#)[a-z]{2,4}/gi, "/en"),
			langs = await db
				.collection<MongoLanguage>("languages")
				.find({ color: { $exists: true } }, { sort: { name: 1 } })
				.toArray(),
			selectMenus = splitArray(
				langs.map<SelectMenuComponentOptionData>(lang => ({
					emoji: lang.emoji,
					label: lang.name,
					value: lang.code,
				})),
				langs.length / Math.ceil(langs.length / 25)
			).map(
				(o, i) =>
					new SelectMenuBuilder({
						options: o,
						customId: `${i}`,
						maxValues: o.length,
						minValues: 0,
						placeholder: "Select the languages you wish to notify",
					})
			),
			buttons = new ActionRowBuilder<ButtonBuilder>({
				components: [
					new ButtonBuilder({
						customId: "confirm",
						label: "Confirm",
						emoji: "✅",
						style: ButtonStyle.Success,
						disabled: true,
					}),
					new ButtonBuilder({
						customId: "cancel",
						label: "Cancel",
						emoji: "❌",
						style: ButtonStyle.Danger,
					}),
				],
			}),
			msg = await interaction.editReply({
				content:
					"Thank you for notifying your felow proofreaders about this issue. Please select the languages you wish to notify using the menus below.",
				components: [...selectMenus.map(m => new ActionRowBuilder<SelectMenuBuilder>({ components: [m] })), buttons],
			}),
			collector = msg.createMessageComponentCollector<ComponentType.SelectMenu | ComponentType.Button>({
				idle: 60_000,
				filter: componentInteraction => interaction.user.id === componentInteraction.user.id,
			})

		collector.on(
			"ignore",
			async componentInteraction =>
				void (await componentInteraction.reply({
					content: `You cannot reply to this interaction! Execute /${this.name} yourself to do this.`,
					ephemeral: true,
				}))
		)

		const languages: [string[], string[]] = [[], []]
		collector.on("collect", async componentInteraction => {
			if (componentInteraction.isSelectMenu()) {
				languages[Number(componentInteraction.customId)] = componentInteraction.values
				if (languages.some(l => l.length)) buttons.components[0].setDisabled(false)
				else buttons.components[0].setDisabled(true)
				for (const [index, menu] of selectMenus.entries())
					for (const option of menu.options) option.setDefault(languages[index].includes(option.data.value!))

				await componentInteraction.update({
					components: [...selectMenus.map(m => new ActionRowBuilder<SelectMenuBuilder>({ components: [m] })), buttons],
				})
			} else {
				switch (componentInteraction.customId) {
					case "confirm":
						const codes = languages.flat(),
							selectedRoles = langs
								.filter(l => codes.includes(l.code))
								.map(l => interaction.guild.roles.cache.find(r => r.name === `${l.name} Proofreader`)!)
								.sort((a, b) => a.name.localeCompare(b.name)),
							dbUsers = await db.collection<DbUser>("users").find().toArray(),
							sortedMembers = interaction.guild.members.cache
								.filter(m => !m.user.bot && !m.pending)
								.sort(
									(a, b) =>
										(dbUsers.find(u => u.id === b.id)!.levels?.totalXp ?? 0) - (dbUsers.find(u => u.id === a.id)!.levels?.totalXp ?? 0)
								),
							resolvedData = selectedRoles.map(
								r =>
									[
										r,
										sortedMembers.find(
											m => m.roles.cache.has(r.id) && (dbUsers.find(u => u.id === m.id)!.settings?.availability ?? true)
										) ?? null,
									] as const
							),
							[failedRoles, chosenPfs] = resolvedData.reduce(
								([prevRoles, prevPfs], [role, member]) => {
									if (member) prevPfs.push([role, member])
									else prevRoles.push(role)

									return [prevRoles, prevPfs]
								},
								[[], []] as [Role[], [Role, GuildMember][]]
							),
							flagEmojis = chosenPfs.map(([r]) => langs.find(l => l.name === r.name.replace(" Proofreader", ""))!.emoji)

						if (failedRoles.length && !chosenPfs.length) {
							await componentInteraction.update({
								content:
									"Failed to find any proofreaders for the languages you picked! This might have happened because we don't have proofreaders of those languages on the server, or the ones that are here decided not to be notified of these issues.",
								components: [],
							})
						} else if (failedRoles.length && chosenPfs.length) {
							await componentInteraction.update({
								content: `Failed to find a proofreader for the following languages:\n${failedRoles.join(
									", "
								)}\nThis happened either because there are no proofreaders for those languages on the server or the ones that are here chose not to be notified of these issues.\nYour message will be sent notifying the proofreaders we were able to find.`,
								allowedMentions: { roles: [] },
								components: [],
							})
							const alertMessage = await interaction.channel!.send({
								content: `${interaction.user}: ${message}\n\n${chosenPfs
									.map(d => d.join(": "))
									.join(", ")}\nPlease react with your language's flag emoji once you're done!`,
								allowedMentions: { users: [...new Set(chosenPfs.map(([, m]) => m.id))], roles: [] },
							})
							for (const emoji of flagEmojis) await alertMessage.react(emoji)
						} else {
							await componentInteraction.update({
								content: "We managed to find a proofreader for every language you chose! Sending message...",
								components: [],
							})
							const alertMessage = await interaction.channel!.send({
								content: `${interaction.user}: ${message}\n\n${chosenPfs
									.map(d => d.join(": "))
									.join(", ")}\nPlease react with your language's flag emoji once you're done!`,
								allowedMentions: { users: [...new Set(chosenPfs.map(([, m]) => m.id))], roles: [] },
							})
							for (const emoji of flagEmojis) await alertMessage.react(emoji)
						}
						collector.stop("replied")
						break
					case "cancel":
						collector.stop("cancelled")
						await componentInteraction.update({
							content: "Successfully cancelled this menu. No proofreaders will be notified",
							components: [],
						})
						break
				}
			}
		})

		collector.on("end", async (_, reason) => {
			if (["cancelled", "replied"].includes(reason)) return
			await interaction.editReply({ content: "This menu expired so no proofreaders will be notified", components: [] })
		})
	},
}

export default command
