import axios from "axios"
import { GuildMember, Message, MessageEmbed } from "discord.js"

import { colors, ids } from "../../config.json"
import { client } from "../../index"
import { db, DbUser } from "../../lib/dbclient"
import { createButtonControls, fetchSettings, generateTip, getButtonControlLocalizations, getUUID, transformDiscordLocale } from "../../lib/util"

import type { Command, GetStringFunction } from "../../lib/imports"

// Credits to marzeq for initial implementation
const command: Command = {
	name: "minecraft",
	description: "Looks up a specific Minecraft player's name history or skin",
	options: [
		{
			type: "SUB_COMMAND",
			name: "history",
			description: "Shows a user's name history. You must provide at least 1 parameter if your MC account is not linked",
			options: [
				{
					type: "STRING",
					name: "username",
					description: "The IGN/UUID of the user to get name history for. Defaults to your user if your account is linked",
					required: false,
				},
				{
					type: "USER",
					name: "user",
					description: "The server member to get the name history for. Only works if the user has verified themselves",
					required: false,
				},
			],
		},
		{
			type: "SUB_COMMAND",
			name: "skin",
			description: "Shows a user's skin. You must provide at least 1 parameter if your MC account is not linked",
			options: [
				{
					type: "STRING",
					name: "username",
					description: "The IGN/UUID of the user to get the skin for. Defaults to your own skin if your account is linked",
					required: false,
				},
				{
					type: "USER",
					name: "user",
					description: "The server member to get the skin for. Only works if the user has verified themselves",
					required: false,
				},
			],
		},
	],
	cooldown: 30,
	channelWhitelist: [ids.channels.bots, ids.channels.staffBots, ids.channels.botDev],
	allowDM: true,
	async execute(interaction, getString: GetStringFunction) {
		await interaction.deferReply()
		const randomTip = generateTip(getString),
			member = (interaction.member as GuildMember | null) ?? interaction.user,
			authorDb = await client.getUser(interaction.user.id),
			userInput = interaction.options.getUser("user", false),
			usernameInput = interaction.options.getString("username", false)

		let uuid: string | null
		if (userInput) {
			const userInputDb = await client.getUser(userInput.id)
			if (userInputDb!.uuid) ({ uuid } = userInputDb)
			else throw "notVerified"
		} else if (usernameInput && usernameInput.length < 32) uuid = await getUUID(usernameInput)
		else uuid = usernameInput ?? authorDb.uuid ?? null
		if (!userInput && !usernameInput && !authorDb.uuid) throw "noUser"
		if (!uuid) throw "falseUser"
		const isOwnUser = uuid === authorDb.uuid,
			uuidDb = await db.collection<DbUser>("users").findOne({ uuid })

		switch (interaction.options.getSubcommand()) {
			case "history":
				const nameHistory = await getNameHistory(uuid)
				nameHistory.forEach(e => (e.name = e.name.replaceAll("_", "\\_")))
				const username = nameHistory[0].name

				let p = 0
				const pages: NameHistory[][] = []
				while (p < nameHistory.length) pages.push(nameHistory.slice(p, (p += 24))) // Max number of fields divisible by 3
				const options = getButtonControlLocalizations(getString)
				if (pages.length === 1) await interaction.editReply({ embeds: [fetchPage(0)] })
				else {
					let controlButtons = createButtonControls(0, pages, options),
						page = 0,
						pageEmbed = fetchPage(page)

					const msg = (await interaction.editReply({ embeds: [pageEmbed], components: [controlButtons] })) as Message,
						collector = msg.createMessageComponentCollector<"BUTTON">({ idle: this.cooldown! * 1000 })

					collector.on("collect", async buttonInteraction => {
						const userDb: DbUser = await client.getUser(buttonInteraction.user.id)
						if (interaction.user.id !== buttonInteraction.user.id) {
							return await buttonInteraction.reply({
								content: getString("pagination.notYours", {
									variables: { command: `/${this.name}` },
									file: "global",
									lang: userDb.lang ?? transformDiscordLocale(buttonInteraction.locale),
								}),
								ephemeral: true,
							})
						} else if (buttonInteraction.customId === "first") page = 0
						else if (buttonInteraction.customId === "last") page = pages.length - 1
						else if (buttonInteraction.customId === "previous") {
							page--
							if (page < 0) page = 0
						} else if (buttonInteraction.customId === "next") {
							page++
							if (page > pages.length - 1) page = pages.length - 1
						}
						controlButtons = createButtonControls(page, pages, options)
						pageEmbed = fetchPage(page)
						await buttonInteraction.update({ embeds: [pageEmbed], components: [controlButtons] })
					})

					collector.on("end", async () => {
						controlButtons.components.forEach(button => button.setDisabled(true))
						await interaction.editReply({
							content: getString("pagination.timeOut", { variables: { command: `\`/${this.name}\`` }, file: "global" }),
							embeds: [pageEmbed],
							components: [controlButtons],
						})
					})
				}

				function fetchPage(page: number) {
					return new MessageEmbed({
						color: colors.success,
						author: { name: getString("moduleName") },
						title: getString("history.nameHistoryFor", { variables: { username } }),
						description:
							nameHistory.length - 1
								? nameHistory.length - 1 === 1
									? getString(isOwnUser ? "history.youChangedName1" : "history.userChangedName1", { variables: { username } })
									: getString(isOwnUser ? "history.youChangedName" : "history.userChangedName", {
											variables: { username, number: nameHistory.length - 1 },
									  })
								: getString(isOwnUser ? "history.youNeverChanged" : "history.userNeverChanged", { variables: { username } }),
						fields: constructFields(pages[page]),
						footer: {
							text:
								pages.length === 1
									? randomTip
									: getString("pagination.page", { variables: { number: page + 1, total: pages.length }, file: "global" }),
							iconURL: member.displayAvatarURL({ format: "png", dynamic: true }),
						},
					})
				}

				function constructFields(array: NameHistory[]) {
					return array.map(name => ({
						name: name.name,
						value: name.changedToAt ? `<t:${Math.round(new Date(name.changedToAt!).getTime() / 1000)}:F>` : getString("history.firstName"),
						inline: true,
					}))
				}

				break
			case "skin":
				const skinEmbed = new MessageEmbed({
					color: colors.success,
					author: { name: getString("moduleName") },
					title: isOwnUser ? getString("skin.yourSkin") : getString("skin.userSkin", { variables: { user: (await getPlayer(uuid)).name } }),
					description: uuidDb && !isOwnUser ? getString("skin.isLinked", { variables: { user: `<@!${uuidDb.id}>` } }) : "",
					image: { url: `https://crafatar.com/renders/body/${uuid}?overlay` },
					footer: { text: randomTip, iconURL: member.displayAvatarURL({ format: "png", dynamic: true }) },
				})
				await interaction.editReply({ embeds: [skinEmbed] })
				break
		}
	},
}

export default command

async function getPlayer(uuid: string) {
	const json = await axios
		.get<UserProfile & { error?: string }>(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`, fetchSettings)
		.then(res => res.data)
	if (json.error) throw "falseUUID"
	return json
}

async function getNameHistory(uuid: string) {
	const json = await axios
		.get<NameHistory[] | MCAPIError>(`https://api.mojang.com/user/profiles/${uuid}/names`, fetchSettings)
		.then(res => res.data || null)
	if (!json || "error" in json) throw "falseUUID"
	return json.reverse()
}

/** @see https://wiki.vg/Mojang_API#UUID_to_Name_History */
interface NameHistory {
	name: string
	changedToAt?: number
}

/** @see https://wiki.vg/Mojang_API#UUID_to_Profile_and_Skin.2FCape */
interface UserProfile {
	id: string
	name: string
	legacy?: boolean
	properties: {
		name: string
		value: string
	}[]
}

interface MCAPIError {
	error: string
	errorMessage: string
}
