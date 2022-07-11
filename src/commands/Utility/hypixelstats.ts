import { type GuildMember, EmbedBuilder, SelectMenuBuilder, ComponentType, ApplicationCommandOptionType, Colors } from "discord.js"

import { ids } from "../../config.json"
import { client } from "../../index"
import { db, type DbUser } from "../../lib/dbclient"
import {
	postSettings,
	generateTip,
	getMCProfile,
	getUUID,
	gql,
	type GraphQLQuery,
	transformDiscordLocale,
	updateRoles,
} from "../../lib/util"

import type { Command, GetStringFunction } from "../../lib/imports"

// Credits to marzeq for initial implementation
const command: Command = {
	name: "hypixelstats",
	description: "Shows you basic Hypixel stats for the provided user",
	options: [
		{
			type: ApplicationCommandOptionType.String,
			name: "username",
			description: "The IGN of the user to get statistics for. Can also be a UUID",
			required: false,
		},
		{
			type: ApplicationCommandOptionType.User,
			name: "user",
			description: "The server member to get statistics for. Only works if the user has verified themselves",
			required: false,
		},
	],
	cooldown: 120,
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

		// Make a request to the slothpixel api (hypixel api but we dont need an api key)
		const graphqlQuery = (await fetch("https://api.slothpixel.me/api/graphql", {
				...postSettings,
				body: JSON.stringify({ query: query, variables: { uuid }, operationName: "HypixelStats" }),
			})
				.then(res => res.json())
				.catch(e => {
					if (e.code === "ECONNRESET") {
						// This means the request timed out
						console.error("Slothpixel is down, sending error.")
						throw "apiError"
					} else throw e
				})) as GraphQLQuery,
			playerJson = graphqlQuery.data.players.player,
			guildJson = graphqlQuery.data.guild

		// Handle errors
		if (graphqlQuery.errors?.find(e => e.message === "Player does not exist" || e.message === "Invalid username or UUID!"))
			throw "falseUser"
		else if (graphqlQuery.errors?.find(e => e.message === "Player has no Hypixel stats!")) throw "noPlayer"
		else if (graphqlQuery.errors?.[0].message || !playerJson.username) {
			// If other error we didn't plan for appeared
			console.log(
				`Welp, we didn't plan for this to happen. Something went wrong when trying to get stats for ${uuid}, here's the error${
					graphqlQuery.errors?.length === 1 ? "" : "s"
				}\n`,
				graphqlQuery.errors!.map(e => e.message).join(", "),
				graphqlQuery.errors,
			)
			throw "apiError"
		}

		// Define values used in both subcommands
		let rank: string, // Some ranks are just prefixes so this code accounts for that
			color: number
		if (guildJson.tag_color) color = parseColorCode(guildJson.tag_color)
		if (playerJson.prefix) {
			color = parseColorCode(playerJson.prefix)
			rank = playerJson.prefix.replace(/&([0-9]|[a-z])/g, "")
		} else {
			color = parseColorCode(playerJson.rank_formatted)
			rank = playerJson.rank_formatted.replace(/&([0-9]|[a-z])/g, "")
		}

		// Change the nickname in a way that doesn't accidentally mess up the formatting in the embed
		const username = playerJson.username.replaceAll("_", "\\_"),
			// Update user's roles if they're verified
			uuidDb = await db.collection<DbUser>("users").findOne({ uuid: playerJson.uuid })
		if (uuidDb) updateRoles(client.guilds.cache.get(ids.guilds.main)!.members.cache.get(uuidDb.id)!, playerJson)

		const skinRender = `https://mc-heads.net/body/${playerJson.uuid}/left`,
			guildMaster = (await getMCProfile(guildJson.guild_master?.uuid))?.name,
			stats = () => {
				// Define each value
				let online: string
				if (playerJson.online) online = getString("online")
				else online = getString("offline")

				let lastSeen: string
				if (!playerJson.last_game) lastSeen = getString("lastGameHidden")
				else lastSeen = getString("lastSeen", { variables: { game: playerJson.last_game } })

				const lastLoginLogout = playerJson.online ? playerJson.last_login : playerJson.last_logout

				let locale: string = getString("region.dateLocale", { file: "global" })
				if (locale.startsWith("crwdns")) locale = getString("region.dateLocale", { file: "global", lang: "en" })

				let lastLogin: string
				if (lastLoginLogout) lastLogin = `<t:${Math.round(new Date(lastLoginLogout).getTime() / 1000)}:F>`
				else lastLogin = getString("lastLoginHidden")

				let firstLogin: string
				if (playerJson.first_login) firstLogin = `<t:${Math.round(new Date(playerJson.first_login).getTime() / 1000)}:F>`
				else firstLogin = getString("firstLoginHidden")

				const statsEmbed = new EmbedBuilder({
					color,
					author: { name: getString("moduleName") },
					title: `${rank} ${username}`,
					thumbnail: { url: skinRender },
					description: `${getString("statsDesc", {
						variables: { username: username, link: `(https://api.slothpixel.me/api/players/${uuid})` },
					})}\n${uuidDb ? `${getString("userVerified", { variables: { user: `<@!${uuidDb.id}>` } })}\n` : ""}${getString(
						"updateNote",
					)}\n${getString("otherStats")}`,
					fields: [
						{ name: getString("networkLevel"), value: Math.abs(playerJson.level).toLocaleString(locale), inline: true },
						{ name: getString("ap"), value: playerJson.achievement_points.toLocaleString(locale), inline: true },
						{ name: getString("first_login"), value: firstLogin, inline: true },

						{ name: getString("language"), value: getString(playerJson.language), inline: true },
						{ name: online, value: lastSeen, inline: true },
						{ name: getString(playerJson.online ? "last_login" : "last_logout"), value: lastLogin, inline: true },
					],
					footer: { text: randomTip, iconURL: member.displayAvatarURL({ extension: "png" }) },
				})
				return statsEmbed
			},
			social = () => {
				const socialMedia = playerJson.links

				let twitter: string
				if (socialMedia.TWITTER) {
					if (!socialMedia.TWITTER.startsWith("https://")) twitter = `[${getString("link")}](https://${socialMedia.TWITTER})`
					else twitter = `[${getString("link")}](${socialMedia.TWITTER})`
				} else twitter = getString("notConnected")

				let youtube: string
				if (socialMedia.YOUTUBE) {
					if (!socialMedia.YOUTUBE.startsWith("https://")) youtube = `[${getString("link")}](https://${socialMedia.YOUTUBE})`
					else youtube = `[${getString("link")}](${socialMedia.YOUTUBE})`
				} else youtube = getString("notConnected")

				let instagram: string
				if (socialMedia.INSTAGRAM) {
					if (!socialMedia.INSTAGRAM.startsWith("https://")) instagram = `[${getString("link")}](https://${socialMedia.INSTAGRAM})`
					else instagram = `[${getString("link")}](${socialMedia.INSTAGRAM})`
				} else instagram = getString("notConnected")

				let twitch: string
				if (socialMedia.TWITCH) {
					if (!socialMedia.TWITCH.startsWith("https://")) twitch = `[${getString("link")}](https://${socialMedia.TWITCH})`
					else twitch = `[${getString("link")}](${socialMedia.TWITCH})`
				} else twitch = getString("notConnected")

				const allowedGuildIDs = [ids.guilds.hypixel, ids.guilds.main, ids.guilds.quickplay, ids.guilds.biscuit]
				let discord: string | null = null
				if (socialMedia.DISCORD) {
					if (!socialMedia.DISCORD.includes("discord.gg")) discord = socialMedia.DISCORD.replaceAll("_", "\\_")
					else {
						interaction.client
							.fetchInvite(socialMedia.DISCORD)
							.then(invite => {
								if (allowedGuildIDs.includes(String(invite.guild?.id))) discord = `[${getString("link")}](${invite.url})`
								else {
									discord = getString("blocked")
									console.log(
										`Blocked the following Discord invite link in ${playerJson.username}'s Hypixel profile: ${
											socialMedia.DISCORD
										} (led to ${invite.guild?.name ?? invite.channel?.name ?? "an unknown channel"})`,
									)
								}
							})
							.catch(() => {
								discord = getString("notConnected")
								console.log(`The following Discord invite link in ${playerJson.username}\` profile was invalid: ${socialMedia.DISCORD}`)
							})
					}
				} else discord = getString("notConnected")

				let forums: string
				if (socialMedia.HYPIXEL) {
					if (!socialMedia.HYPIXEL.startsWith("https://")) forums = `[${getString("link")}](https://${socialMedia.HYPIXEL})`
					else forums = `[${getString("link")}](${socialMedia.HYPIXEL})`
				} else forums = getString("notConnected")
				const socialEmbed = new EmbedBuilder({
					color,
					author: { name: getString("moduleName") },
					title: `${rank} ${username}`,
					thumbnail: { url: skinRender },
					description: `${getString("socialMedia", {
						variables: { username: username, link: `(https://api.slothpixel.me/api/players/${uuid})` },
					})}\n${uuidDb ? `${getString("userVerified", { variables: { user: `<@!${uuidDb.id}>` } })}\n` : ""}${getString(
						"updateNote",
					)}\n${getString("otherStats")}`,
					fields: [
						{ name: "Twitter", value: twitter, inline: true },
						{ name: "YouTube", value: youtube, inline: true },
						{ name: "Instagram", value: instagram, inline: true },
						{ name: "Twitch", value: twitch, inline: true },
						{ name: "Discord", value: discord!, inline: true },
						{ name: "Hypixel Forums", value: forums, inline: true },
					],
					footer: { text: randomTip, iconURL: member.displayAvatarURL({ extension: "png" }) },
				})
				return socialEmbed
			},
			guild = () => {
				if (!guildJson.guild) return

				const embed = new EmbedBuilder({
					color: color === 0xaaaaaa ? Colors.Blurple : color,
					author: { name: getString("moduleName") },
					title: `${guildJson.name}${guildJson.tag ? ` [${guildJson.tag.replace(/&[a-f0-9k-or]/gi, "")}]` : ""}`,
					thumbnail: { url: skinRender },
					description: `${getString("guildDesc", {
						variables: {
							player: playerJson.username,
							guildName: guildJson.name,
							link: `(https://api.slothpixel.me/api/guilds/${uuid})`,
						},
					})}\n${getString("updateNote")}\n\n${
						guildJson.description ? `**${getString("guildDescHypixel")}**: ${guildJson.description}` : getString("noGuildDesc")
					}`,
					fields: [
						{
							name: getString("guildLevel"),
							value: guildJson.level.toLocaleString(getString("region.dateLocale", { file: "global" })),
							inline: true,
						},
						{ name: getString("memberCount"), value: `${guildJson.members.length}/125`, inline: true },
						{ name: getString("createdAt"), value: `<t:${Math.round(guildJson.created / 1000)}:F>`, inline: true },

						{
							name: getString("guildRanks"),
							value: guildJson.ranks.map(guildRank => guildRank.name).join("\n"),
							inline: true,
						},
						{ name: getString("guildMaster"), value: guildMaster!, inline: true },
						{
							name: getString("userRank", { variables: { user: playerJson.username } }),
							value: guildJson.members.find(guildMember => guildMember.uuid === uuid)!.rank,
							inline: true,
						},
					],
					footer: { text: randomTip, iconURL: member.displayAvatarURL({ extension: "png" }) },
				})

				return embed
			}

		let embed = stats(),
			selectedMenu = "stats"
		const createMenu = (selected: string) => {
				const isSelected = (value: string) => selected === value,
					options = [
						{
							label: getString("stats"),
							value: "stats",
							emoji: "📊",
							default: isSelected("stats"),
						},
						{
							label: getString("social"),
							value: "social",
							emoji: "twitter:821752918352068677",
							default: isSelected("social"),
						},
					]
				if (guildJson.guild) {
					options.push({
						label: "Guild",
						value: "guild",
						emoji: "🏡",
						default: isSelected("guild"),
					})
				}

				return new SelectMenuBuilder({
					customId: "statType",
					options,
				})
			},
			msg = await interaction.editReply({
				embeds: [embed],
				components: [{ type: ComponentType.ActionRow, components: [createMenu(selectedMenu)] }],
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
			selectedMenu = menuInteraction.values[0]
			switch (selectedMenu) {
				case "stats":
					embed = stats()
					break
				case "social":
					embed = social()
					break
				case "guild":
					embed = guild()!
					break
			}
			await menuInteraction.update({
				embeds: [embed],
				components: [{ type: ComponentType.ActionRow, components: [createMenu(selectedMenu)] }],
			})
		})

		collector.on("end", async () => {
			await interaction.editReply({
				content: getString("pagination.timeOut", { variables: { command: `\`/${this.name}\`` }, file: "global" }),
				components: [{ type: ComponentType.ActionRow, components: [createMenu(selectedMenu).setDisabled()] }],
				embeds: [embed],
			})
		})
	},
}

function parseColorCode(color: string): number {
	const colorsJson: {
		[key: string]: number
	} = {
		0: 0x000000,
		1: 0x0000aa,
		2: 0x00aa00,
		3: 0x00aaaa,
		4: 0xaa0000,
		5: 0xaa00aa,
		6: 0xffaa00,
		7: 0xaaaaaa,
		8: 0x555555,
		9: 0x5555ff,
		a: 0x55ff55,
		b: 0x55ffff,
		c: 0xff5555,
		d: 0xff55ff,
		e: 0xffff55,
		f: 0xffffff,
	}
	return colorsJson[color.substring(1, 2).toLowerCase()]
}

export default command

export const query = gql`
	query HypixelStats($uuid: String!) {
		players {
			player(player_name: $uuid) {
				uuid
				username
				online
				rank
				rank_formatted
				prefix
				level
				achievement_points
				first_login
				last_login
				last_logout
				last_game
				language
				links {
					TWITTER
					YOUTUBE
					INSTAGRAM
					TWITCH
					DISCORD
					HYPIXEL
				}
			}
		}
		guild(player_name: $uuid) {
			guild
			name
			created
			tag
			tag_color
			level
			description
			guild_master {
				uuid
				rank
			}
			members {
				uuid
				rank
			}
			ranks {
				name
			}
		}
		skyblock {
			profiles(player_name: $uuid)
		}
	}
`
