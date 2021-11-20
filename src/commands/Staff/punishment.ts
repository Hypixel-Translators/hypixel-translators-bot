import { GuildMember, HexColorString, Message, MessageActionRow, MessageButton, MessageComponentInteraction, MessageEmbed, TextChannel, User } from "discord.js"
import { errorColor, loadingColor, successColor, ids } from "../../config.json"
import { db } from "../../lib/dbclient"
import { generateTip, getActivePunishments, PunishmentLog, PunishmentPoints } from "../../lib/util"

import type { Command } from "../../lib/imports"

const command: Command = {
	name: "punishment",
	description: "Punishes a user or calculates the punishment based on the amount of points given.",
	options: [{
		type: "SUB_COMMAND",
		name: "give",
		description: "Punish a user",
		options: [
			{
				type: "USER",
				name: "user",
				description: "The user to punish",
				required: true
			},
			{
				type: "INTEGER",
				name: "points",
				description: "How many points to give this member for this infraction",
				required: true,
				choices: [
					{ name: "1", value: 1 },
					{ name: "2", value: 2 },
					{ name: "3", value: 3 },
					{ name: "4", value: 4 },
					{ name: "5", value: 5 },
					{ name: "6", value: 6 }
				]
			},
			{
				type: "STRING",
				name: "reason",
				description: "The reason for this punishment",
				required: true
			},
			{
				type: "NUMBER",
				name: "duration",
				description: "The duration of the punishment",
				required: false
			}
		]
	},
	{
		type: "SUB_COMMAND",
		name: "calculate",
		description: "Calculate a punishment for a user and evaluate permissions to apply it",
		options: [
			{
				type: "USER",
				name: "user",
				description: "The user to punish",
				required: true
			},
			{
				type: "INTEGER",
				name: "points",
				description: "How many points to give this member for this infraction",
				required: true,
				choices: [
					{ name: "1", value: 1 },
					{ name: "2", value: 2 },
					{ name: "3", value: 3 },
					{ name: "4", value: 4 },
					{ name: "5", value: 5 },
					{ name: "6", value: 6 }
				]
			}
		]
	},
	{
		type: "SUB_COMMAND",
		name: "status",
		description: "Shows you a user's currently active points and punishments",
		options: [{
			type: "USER",
			name: "user",
			description: "The user to check standing for",
			required: true
		}]
	},
	{
		type: "SUB_COMMAND",
		name: "revoke",
		description: "Revoke all active punishments the user has",
		options: [
			{
				type: "USER",
				name: "user",
				description: "The user to revoke punishments from",
				required: true
			},
			{
				type: "STRING",
				name: "reason",
				description: "The reason for revoking this user's punishment",
				required: true
			},
			{
				type: "BOOLEAN",
				name: "senddm",
				description: "Whether to send a DM to this user regarding the removal of their punishment",
				required: true
			}
		]
	}],
	roleWhitelist: [ids.roles.staff],
	channelWhitelist: [ids.channels.staffBots, ids.channels.adminBots],
	async execute(interaction) {
		const member = interaction.member as GuildMember,
			subCommand = interaction.options.getSubcommand(),
			collection = db.collection<PunishmentLog>("punishments"),
			user = interaction.options.getUser("user", true) as User,
			memberInput = interaction.options.getMember("user", false) as GuildMember | null,
			points = interaction.options.getInteger("points", false) as PunishmentPoints | null,
			duration = interaction.options.getNumber("duration", false),
			punishment = await calculatePunishment(user, points ?? 1),
			buttons = new MessageActionRow()
				.addComponents(
					new MessageButton()
						.setCustomId("confirm")
						.setLabel("Confirm")
						.setStyle("SUCCESS")
						.setEmoji("✅")
						.setDisabled(),
					new MessageButton()
						.setCustomId("cancel")
						.setLabel("Cancel")
						.setStyle("DANGER")
						.setEmoji("❎")
						.setDisabled()
				),
			filter = (bInteraction: MessageComponentInteraction) => bInteraction.user.id === interaction.user.id,
			caseNumber = (await collection.estimatedDocumentCount()) + 1,
			punishmentsChannel = interaction.client.channels.cache.get(ids.channels.punishments) as TextChannel,
			randomTip = generateTip()

		if (duration) punishment.duration &&= duration
		let reason = interaction.options.getString("reason")
		if (reason) reason = reason.charAt(0).toUpperCase() + reason.slice(1)

		if (subCommand === "give") {
			await interaction.deferReply()

			//Check for permissions to give the punishment
			if (!checkPermissions(interaction.member as GuildMember, punishment)) throw "You don't have permission to give this punishment"
			if (user.bot) throw "You cannot punish bots!"
			if (memberInput?.roles.cache.has(ids.roles.staff)) throw "You cannot punish this user!"
			if (points! <= (punishment.activePunishmentPoints ?? 0)) throw `This user currently has an active punishment with ${punishment.activePunishmentPoints} points, so you cannot give them a less severe punishment!`

			//Apply the punishment
			if (punishment.type === "VERBAL") {
				if (!memberInput) throw "Couldn't find that member! Are you sure they're on the server?"
				const punishmentLog = new MessageEmbed()
					.setColor(errorColor as HexColorString)
					.setAuthor({
						name: `Case ${caseNumber} | Verbal Warning | ${points} point${points === 1 ? "" : "s"}`,
						iconURL: user.displayAvatarURL({ format: "png", dynamic: true })
					})
					.addFields([
						{ name: "User", value: user.toString(), inline: true },
						{ name: "Moderator", value: interaction.user.toString(), inline: true },
						{ name: "Reason", value: reason! }
					])
					.setFooter(`ID: ${user.id}`)
					.setTimestamp(),
					msg = await punishmentsChannel.send({ embeds: [punishmentLog] })

				await collection.insertOne({
					case: caseNumber,
					id: user.id,
					type: punishment.type,
					points,
					reason,
					timestamp: Date.now(),
					moderator: interaction.user.id,
					logMsg: msg.id,
				} as PunishmentLog)
				const embed = new MessageEmbed()
					.setColor(successColor as HexColorString)
					.setAuthor("Punishments")
					.setTitle("Successfully registered this verbal warning!")
					.addFields(
						{ name: "Member", value: user.toString(), inline: true },
						{ name: "Points", value: points!.toString(), inline: true },
						{ name: "Reason", value: reason! }
					)
					.setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))
				await interaction.editReply({ embeds: [embed] })
			} else if (punishment.type === "WARN") {
				const confirmEmbed = new MessageEmbed()
					.setColor(loadingColor as HexColorString)
					.setAuthor("Punishment")
					.setTitle(`Are you sure you want to warn ${user.tag}?`)
					.setDescription(reason!)
					.setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))
				const msg = await interaction.editReply({ embeds: [confirmEmbed], components: [buttons] }) as Message

				setTimeout(async () => {
					buttons.components.map(b => b.setDisabled(false))
					await interaction.editReply({ components: [buttons] })
				}, 5_000)
				const buttonInteraction = await msg.awaitMessageComponent<"BUTTON">({ filter, time: 65_000 })
					.catch(async () => {
						const embed = new MessageEmbed()
							.setColor(errorColor as HexColorString)
							.setAuthor("Punishments")
							.setTitle("You didn't respond in time, so this user wasn't warned")
							.setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))
						await interaction.editReply({ embeds: [embed], components: [] })
					})
				if (!buttonInteraction) return
				if (buttonInteraction.customId === "confirm") {
					await buttonInteraction.deferUpdate()

					if (!memberInput) throw "Couldn't find that member! Are you sure they're on the server?"

					const punishmentLog = new MessageEmbed()
						.setColor(errorColor as HexColorString)
						.setAuthor({
							name: `Case ${caseNumber} | Warning | ${points} point${points === 1 ? "" : "s"}`,
							iconURL: user.displayAvatarURL({ format: "png", dynamic: true })
						})
						.addFields([
							{ name: "User", value: user.toString(), inline: true },
							{ name: "Moderator", value: interaction.user.toString(), inline: true },
							{ name: "Reason", value: reason! }
						])
						.setFooter(`ID: ${user.id}`)
						.setTimestamp(),
						msg = await punishmentsChannel.send({ embeds: [punishmentLog] })

					await collection.insertOne({
						case: caseNumber,
						id: user.id,
						type: punishment.type,
						points,
						reason,
						timestamp: Date.now(),
						moderator: interaction.user.id,
						logMsg: msg.id,
					} as PunishmentLog)
					const dmEmbed = new MessageEmbed()
						.setColor(errorColor as HexColorString)
						.setAuthor("Punishment")
						.setTitle(`You have been warned on the ${interaction.guild!.name}`)
						.setDescription(`**Reason:** ${reason}`)
						.setTimestamp(),
						embed = new MessageEmbed()
							.setColor(successColor as HexColorString)
							.setAuthor("Punishments")
							.setTitle("Successfully warned this member!")
							.addFields(
								{ name: "Member", value: user.toString(), inline: true },
								{ name: "Points", value: points!.toString(), inline: true },
								{ name: "Reason", value: reason! },
							)
							.setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))
					await user.send({ embeds: [dmEmbed] })
						.then(async () => await buttonInteraction.editReply({ embeds: [embed], components: [] }))
						.catch(async err => {
							console.log(`Couldn't DM user ${user.tag} about their warning, here's the error\n`, err)
							embed
								.setColor(errorColor as HexColorString)
								.setDescription("Warning not sent because the user had DMs off")
							await buttonInteraction.editReply({ embeds: [embed], components: [] })
						})
				} else if (buttonInteraction.customId === "cancel") {
					const embed = new MessageEmbed()
						.setColor(successColor as HexColorString)
						.setAuthor("Punishments")
						.setTitle("Successfully cancelled this punishment")
						.setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))
					await buttonInteraction.update({ embeds: [embed], components: [] })
				}
			} else if (punishment.type === "MUTE") {
				const confirmEmbed = new MessageEmbed()
					.setColor(loadingColor as HexColorString)
					.setAuthor("Punishment")
					.setTitle("Are you sure you want to mute this member?")
					.setDescription(`Confirming this will mute ${user} for ${punishment.duration} hours with the following reason:\n\n${reason}`)
					.setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))
				const msg = await interaction.editReply({ embeds: [confirmEmbed], components: [buttons] }) as Message

				setTimeout(async () => {
					buttons.components.map(b => b.setDisabled(false))
					await interaction.editReply({ components: [buttons] })
				}, 5_000)
				const buttonInteraction = await msg.awaitMessageComponent<"BUTTON">({ filter, time: 65_000 })
					.catch(async () => {
						const embed = new MessageEmbed()
							.setColor(errorColor as HexColorString)
							.setAuthor("Punishments")
							.setTitle("You didn't respond in time, so this user wasn't muted")
							.setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))
						await interaction.editReply({ embeds: [embed], components: [] })
					})
				if (!buttonInteraction) return
				if (buttonInteraction.customId === "confirm") {
					await buttonInteraction.deferUpdate()
					const endTimestamp = new Date().setHours(new Date().getHours() + punishment.duration!),
						punishmentLog = new MessageEmbed()
							.setColor(errorColor as HexColorString)
							.setAuthor({
								name: `Case ${caseNumber} | Mute | ${points} point${points === 1 ? "" : "s"}`,
								iconURL: user.displayAvatarURL({ format: "png", dynamic: true })
							})
							.addFields(
								{ name: "User", value: user.toString(), inline: true },
								{ name: "Moderator", value: interaction.user.toString(), inline: true },
								{ name: "Duration", value: `${punishment.duration} hours`, inline: true },
								{ name: "Reason", value: reason! }
							)
							.setFooter(`ID: ${user.id}`)
							.setTimestamp(),
						msg = await punishmentsChannel.send({ embeds: [punishmentLog] })

					await collection.insertOne({
						case: caseNumber,
						id: user.id,
						type: punishment.type,
						points,
						reason,
						timestamp: Date.now(),
						duration: punishment.duration,
						endTimestamp,
						ended: false,
						moderator: interaction.user.id,
						logMsg: msg.id,
					} as PunishmentLog)

					//Make sure the Muted role doesn't have these permissions on any channel
					await interaction.guild!.channels.fetch()
					interaction.guild!.channels.cache.forEach(async channel => {
						if (channel.isThread()) return
						await channel.permissionOverwrites.edit(ids.roles.muted, { SEND_MESSAGES: false, ADD_REACTIONS: false, SPEAK: false })
					})

					if (!memberInput) throw "Couldn't find that member! Are you sure they're on the server?"
					await memberInput.roles.add(ids.roles.muted, `Muted by ${interaction.user.tag}`)

					const dmEmbed = new MessageEmbed()
						.setColor(errorColor as HexColorString)
						.setAuthor("Punishment")
						.setTitle(`You have been muted on the ${interaction.guild!.name} for ${punishment.duration} hours`)
						.setDescription(`**Reason:** ${reason}\n\nYour mute will expire on <t:${Math.round(endTimestamp / 1000)}:F> (<t:${Math.round(endTimestamp / 1000)}:R>)`)
						.setTimestamp(),
						embed = new MessageEmbed()
							.setColor(successColor as HexColorString)
							.setAuthor("Punishments")
							.setTitle("Successfully muted this member!")
							.addFields(
								{ name: "Member", value: user.toString(), inline: true },
								{ name: "Points", value: points!.toString(), inline: true },
								{ name: "Duration", value: `${punishment.duration!.toString()} hours`, inline: true },
								{ name: "Reason", value: reason! },
							)
							.setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))
					await user.send({ embeds: [dmEmbed] })
						.then(async () => await buttonInteraction.editReply({ embeds: [embed], components: [] }))
						.catch(async err => {
							console.log(`Couldn't DM user ${user.tag} about their mute, here's the error\n`, err)
							embed
								.setColor(errorColor as HexColorString)
								.setDescription("Message not send because the user had DMs off")
							await buttonInteraction.editReply({ embeds: [embed], components: [] })
						})
				} else if (buttonInteraction.customId === "cancel") {
					const embed = new MessageEmbed()
						.setColor(successColor as HexColorString)
						.setAuthor("Punishments")
						.setTitle("Successfully cancelled this punishment")
						.setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))
					await buttonInteraction.update({ embeds: [embed], components: [] })
				}
			} else if (punishment.type === "BAN") {
				const confirmEmbed = new MessageEmbed()
					.setColor(loadingColor as HexColorString)
					.setAuthor("Punishment")
					.setTitle("Are you sure you want to ban this member?")
					.setDescription(
						`Confirming this will ban ${user} ${punishment.duration ? `for ${punishment.duration} days` : "permanently"
						} with the following reason:\n\n${reason}${punishment.activePunishmentPoints ? "\n\n⚠ This user currently has an active punishment! Think twice before confirming this." : ""
						}`
					)
					.setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))
				const msg = await interaction.editReply({ embeds: [confirmEmbed], components: [buttons] }) as Message

				setTimeout(async () => {
					buttons.components.map(b => b.setDisabled(false))
					await interaction.editReply({ components: [buttons] })
				}, 5_000)
				const buttonInteraction = await msg.awaitMessageComponent<"BUTTON">({ filter, time: 65_000 })
					.catch(async () => {
						const embed = new MessageEmbed()
							.setColor(errorColor as HexColorString)
							.setAuthor("Punishments")
							.setTitle("You didn't respond in time, so this user wasn't banned")
							.setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))
						await interaction.editReply({ embeds: [embed], components: [] })
					})
				if (!buttonInteraction) return
				if (buttonInteraction.customId === "confirm") {
					await buttonInteraction.deferUpdate()

					if (!memberInput) throw "Couldn't find that member in order to ban them!"
					if (memberInput.bannable) await memberInput.ban({ reason: reason! })
					else throw "I cannot ban that member!"

					const endTimestamp = punishment.duration ? new Date().setDate(new Date().getDate() + punishment.duration) : 0,
						punishmentLog = new MessageEmbed()
							.setColor(errorColor as HexColorString)
							.setAuthor({
								name: `Case ${caseNumber} | Ban | ${points} point${points === 1 ? "" : "s"}`,
								iconURL: user.displayAvatarURL({ format: "png", dynamic: true })
							})
							.addFields(
								{ name: "User", value: user.toString(), inline: true },
								{ name: "Moderator", value: interaction.user.toString(), inline: true },
								{ name: "Duration", value: punishment.duration ? `${punishment.duration} days` : "Permanent", inline: true },
								{ name: "Reason", value: reason! }
							)
							.setFooter(`ID: ${user.id}`)
							.setTimestamp(),
						msg = await punishmentsChannel.send({ embeds: [punishmentLog] })

					if (punishment.activePunishmentPoints)
						await collection.updateMany(
							{ id: user.id, ended: false },
							{ $set: { ended: true, revoked: true, revokedBy: interaction.user.id, endTimestamp: Date.now() } }
						)

					if (punishment.duration) await collection.insertOne({
						case: caseNumber,
						id: user.id,
						type: punishment.type,
						points,
						reason,
						timestamp: Date.now(),
						duration: punishment.duration,
						endTimestamp,
						ended: false,
						moderator: interaction.user.id,
						logMsg: msg.id
					} as PunishmentLog)
					else await collection.insertOne({
						case: caseNumber,
						id: user.id,
						type: punishment.type,
						points: points as PunishmentPoints,
						reason: reason as string,
						timestamp: Date.now(),
						duration: punishment.duration!,
						ended: false,
						moderator: interaction.user.id,
						logMsg: msg.id
					})

					const dmEmbed = new MessageEmbed()
						.setColor(errorColor as HexColorString)
						.setAuthor("Punishment")
						.setTitle(`You have been ${punishment.duration ? "" : "permanently "}banned from the ${interaction.guild!.name} ${punishment.duration ? `for ${punishment.duration} days` : ""}`)
						.setDescription(
							`**Reason:** ${reason}\n\n${endTimestamp
								? `This ban will expire on <t:${Math.round(endTimestamp / 1000)}:F> (<t:${Math.round(endTimestamp / 1000)}:R>)`
								: "This is a permanent ban and will not expire"
							}`
						)
						.setTimestamp(),
						embed = new MessageEmbed()
							.setColor(successColor as HexColorString)
							.setAuthor("Punishments")
							.setTitle("Successfully banned this member!")
							.addFields(
								{ name: "Member", value: user.toString(), inline: true },
								{ name: "Points", value: points!.toString(), inline: true },
								{ name: "Duration", value: `${punishment.duration ? `${punishment.duration!.toString()} days` : "Permanent"}`, inline: true },
								{ name: "Reason", value: reason! }
							)
							.setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))
					await user.send({ embeds: [dmEmbed] })
						.then(async () => await buttonInteraction.editReply({ embeds: [embed], components: [] }))
						.catch(async err => {
							console.log(`Couldn't warn user ${user.tag} about their ban, here's the error\n`, err)
							embed
								.setColor(errorColor as HexColorString)
								.setDescription("Warning not sent because the user had DMs off")
							await buttonInteraction.editReply({ embeds: [embed], components: [] })
						})
				} else if (buttonInteraction.customId === "cancel") {
					const embed = new MessageEmbed()
						.setColor(successColor as HexColorString)
						.setAuthor("Punishments")
						.setTitle("Successfully cancelled this punishment")
						.setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))
					await buttonInteraction.update({ embeds: [embed], components: [] })
				}
			}
		} else if (subCommand === "status") {
			const activePunishments = await getActivePunishments(user)
			let activePoints = 0
			activePunishments.forEach(punishment => {
				activePoints = activePoints + (punishment.points ?? 0)
			})

			const embed = new MessageEmbed()
				.setColor(activePoints ? errorColor as HexColorString : successColor as HexColorString)
				.setAuthor("Punishments")
				.setTitle(`${user.tag} currently has ${activePoints} point${activePoints === 1 ? "" : "s"}.`)
				.setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))
			activePunishments.forEach(punishment => {
				const durationString = punishment.duration ? `${punishment.duration}${punishment.type === "BAN" ? "d" : "h"} ` : "permanent ",
					expireTimestamp =
						punishment.type === "VERBAL"
							? new Date(punishment.timestamp).setDate(new Date(punishment.timestamp).getDate() + 1)
							: punishment.type === "WARN"
								? new Date(punishment.timestamp).setDate(new Date(punishment.timestamp).getDate() + 7)
								: new Date(punishment.endTimestamp!).setDate(new Date(punishment.endTimestamp!).getDate() + 30)
				embed.addField(
					`Case ${punishment.case}: ${punishment.endTimestamp ? durationString : ""}${punishment.type} (${punishment.points} points)`,
					`${typeof punishment.duration === "number"
						? punishment.duration
							? `Ends <t:${Math.round(punishment.endTimestamp! / 1000)}:R>\n`
							: "Never ends\n"
						: ""
					}${expireTimestamp ? `Expires <t:${Math.round(expireTimestamp / 1000)}:R>` : ""}`,
					true
				)
			})
			await interaction.reply({ embeds: [embed] })
		} else if (subCommand === "calculate") {
			const hasPermission = checkPermissions(interaction.member as GuildMember, punishment),
				unexpiredPunishments = await getActivePunishments(user),
				durationString = punishment.duration ? `${punishment.duration}${punishment.type === "BAN" ? "d" : "h"} ` : "permanent "

			const embed = new MessageEmbed()
				.setColor(hasPermission ? (successColor as HexColorString) : (errorColor as HexColorString))
				.setAuthor("Punishments")
				.setTitle(`Giving this member ${points} points will result in a ${["MUTE", "BAN"].includes(punishment.type) ? durationString : ""}${punishment.type}`)
				.setDescription(
					`You ${hasPermission ? "" : "don't "}have permission to issue this punishment.\n\n${unexpiredPunishments.length ? `Here are ${user}'s active punishments:` : `${user} has no active punishments at the moment`}`
				)
				.setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))
			unexpiredPunishments.forEach(punishment => {
				const durationString = punishment.duration ? `${punishment.duration}${punishment.type === "BAN" ? "d" : "h"} ` : "permanent ",
					expireTimestamp =
						punishment.type === "VERBAL"
							? new Date(punishment.timestamp).setDate(new Date(punishment.timestamp).getDate() + 1)
							: punishment.type === "WARN"
								? new Date(punishment.timestamp).setDate(new Date(punishment.timestamp).getDate() + 7)
								: new Date(punishment.endTimestamp!).setDate(new Date(punishment.endTimestamp!).getDate() + 30)
				embed.addField(
					`Case ${punishment.case}: ${punishment.endTimestamp ? durationString : ""}${punishment.type} (${punishment.points} points)`,
					`${typeof punishment.duration === "number"
						? punishment.duration
							? `Ends <t:${Math.round(punishment.endTimestamp! / 1000)}:R>\n`
							: "Never ends\n"
						: ""
					}${expireTimestamp ? `Expires <t:${Math.round(expireTimestamp / 1000)}:R>` : ""}`,
					true
				)
			})
			await interaction.reply({ embeds: [embed] })
		} else if (subCommand === "revoke") {
			if (!(interaction.member as GuildMember).permissions.has("VIEW_AUDIT_LOG")) throw "noAccess"
			const activePunishments = await collection.find({ id: user.id, ended: false }).toArray(),
				senddm = interaction.options.getBoolean("senddm", true)
			if (activePunishments.length > 1)
				return await interaction.reply({
					content:
						"Something went terribly wrong and this user has more than one active punishment! Please contact the developer and let them know about this.",
					ephemeral: true
				})
			else if (!activePunishments.length) throw "This user has no active punishments!"
			let activePoints = 0
			activePunishments.forEach(punishment => {
				activePoints = activePoints + (punishment.points ?? 0)
			})
			const embed = new MessageEmbed()
				.setColor(loadingColor as HexColorString)
				.setAuthor("Punishments")
				.setTitle(`Are you sure you want to revoke ${user.tag}'s active ${activePunishments[0].type}?`)
				.setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))
			activePunishments.forEach(punishment => {
				const durationString = punishment.duration ? `${punishment.duration}${punishment.type === "BAN" ? "d" : "h"} ` : "permanent ",
					expireTimestamp =
						punishment.type === "VERBAL"
							? new Date(punishment.timestamp).setDate(new Date(punishment.timestamp).getDate() + 1)
							: punishment.type === "WARN"
								? new Date(punishment.timestamp).setDate(new Date(punishment.timestamp).getDate() + 7)
								: new Date(punishment.endTimestamp!).setDate(new Date(punishment.endTimestamp!).getDate() + 30)
				embed.addField(
					`Case ${punishment.case}: ${punishment.endTimestamp ? durationString : ""}${punishment.type} (${punishment.points} points)`,
					`${typeof punishment.duration === "number"
						? punishment.duration
							? `Ends <t:${Math.round(punishment.endTimestamp! / 1000)}:R>\n`
							: "Never ends\n"
						: ""
					}${expireTimestamp ? `Expires <t:${Math.round(expireTimestamp / 1000)}:R>` : ""}`,
					true
				)
			})
			const msg = await interaction.reply({ embeds: [embed], components: [buttons], fetchReply: true }) as Message

			setTimeout(async () => {
				buttons.components.map(b => b.setDisabled(false))
				await interaction.editReply({ components: [buttons] })
			}, 5_000)
			const buttonInteraction = await msg.awaitMessageComponent<"BUTTON">({ filter, time: 65_000 })
				.catch(async () => {
					const embed = new MessageEmbed()
						.setColor(errorColor as HexColorString)
						.setAuthor("Punishments")
						.setTitle("You didn't respond in time, so this user's punishments weren't revoked")
						.setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))
					await interaction.editReply({ embeds: [embed], components: [] })
				})
			if (!buttonInteraction) return
			if (buttonInteraction.customId === "confirm") {
				await buttonInteraction.deferUpdate()
				const punishmentLog = new MessageEmbed()
					.setColor(successColor as HexColorString)
					.setAuthor({
						name: `Case ${caseNumber} | ${activePunishments[0].type === "BAN" ? "Unban" : "Unmute"} | ${user.tag}`,
						iconURL: user.displayAvatarURL({ format: "png", dynamic: true })
					})
					.addFields([
						{ name: "User", value: user.toString(), inline: true },
						{ name: "Moderator", value: interaction.user.toString(), inline: true },
						{ name: "Reason", value: reason! }
					])
					.setFooter(`ID: ${user.id}`)
					.setTimestamp(),
					msg = await punishmentsChannel.send({ embeds: [punishmentLog] })

				await collection.updateOne({ case: activePunishments[0].case }, { $set: { revoked: true, revokedBy: interaction.user.id, ended: true, endTimestamp: Date.now() } })
				await collection.insertOne({
					case: caseNumber,
					id: user.id,
					type: `UN${activePunishments[0].type}`,
					reason,
					timestamp: Date.now(),
					moderator: interaction.user.id,
					logMsg: msg.id
				} as PunishmentLog)

				const dmEmbed = new MessageEmbed()
					.setColor(successColor as HexColorString)
					.setAuthor("Punishment")
					.setTitle(`You have been un ${activePunishments[0].type === "BAN" ? "banned" : "muted"} from the ${interaction.guild!.name}`)
					.setDescription(`**Reason:** ${reason}`)
					.setTimestamp(),
					embed = new MessageEmbed()
						.setColor(successColor as HexColorString)
						.setAuthor("Punishments")
						.setTitle("Successfully revoked this member's punishment!")
						.addFields(
							{ name: "Member", value: user.toString(), inline: true },
							{ name: "Punishment type", value: activePunishments[0].type, inline: true },
							{ name: "Reason", value: reason!, inline: true }
						)
						.setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))

				if (activePunishments[0].type === "BAN") await interaction.guild!.bans.remove(user.id, `${reason} | ${interaction.user.tag}`)
					.catch(async err => {
						embed.setDescription(`Failed to remove the ban: ${err}`)
						await buttonInteraction.editReply({ embeds: [embed], components: [] })
					})
				else if (!memberInput) embed.setDescription(`Failed to unmute ${user}, they may not be in the server`)
				else if (activePunishments[0].type === "MUTE") await memberInput.roles.remove(ids.roles.muted, `${reason} | ${interaction.user.tag}`)

				if (senddm) await user.send({ embeds: [dmEmbed] })
					.then(async () => await buttonInteraction.editReply({ embeds: [embed], components: [] }))
					.catch(async err => {
						console.log(`Couldn't DM user ${user.tag} about their revoked ${activePunishments[0].type}, here's the error\n`, err)
						embed
							.setColor(errorColor as HexColorString)
							.setDescription("Warning not sent because the user had DMs off")
						await buttonInteraction.editReply({ embeds: [embed], components: [] })
					})
				else await buttonInteraction.editReply({ embeds: [embed], components: [] })
			} else if (buttonInteraction.customId === "cancel") {
				const embed = new MessageEmbed()
					.setColor(successColor as HexColorString)
					.setAuthor("Punishments")
					.setTitle("Successfully cancelled revoking this punishment")
					.setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))
				await buttonInteraction.update({ embeds: [embed], components: [] })
			}
		}
	}
}

async function calculatePunishment(user: User, points: PunishmentPoints): Promise<Punishment> {
	const activePunishments = await getActivePunishments(user),
		activePunishmentPoints = activePunishments.find(p => p.ended === false)?.points ?? null,
		guidelines = await db.collection("config").findOne<PunishmentGuidelines>({ name: "punishmentGuidelines" }) as PunishmentGuidelines

	let activePoints = 0
	activePunishments.forEach(p => (activePoints = (activePoints + p.points!) || activePoints))
	if (activePunishments.some(p => p.type === "UNBAN" && p.moderator !== user.client.user!.id)) activePoints = activePoints - guidelines.points.tempBan
	if (activePunishments.some(p => p.type === "UNMUTE" && p.moderator !== user.client.user!.id)) activePoints = activePoints - guidelines.points.mute
	if (activePoints > guidelines.points.tempBan) activePoints = guidelines.points.tempBan
	else if (activePoints < 0) activePoints = 0

	if (activePoints + points === guidelines.points.verbalWarn) return { type: "VERBAL", activePunishmentPoints }
	else if (activePoints + points < guidelines.points.mute) return { type: "WARN", activePunishmentPoints }
	else if (activePoints + points === guidelines.points.mute) {
		let duration: number = 0
		switch (points) {
			case 1:
				duration = guidelines.durations.mute[0]
				break
			case 2:
				duration = guidelines.durations.mute[1]
				break
			case 3:
			case 4:
				duration = guidelines.durations.mute[2]
				break
			default:
				throw "You gave me weird points I don't know what to do please help"
		}
		return { type: "MUTE", duration, activePunishmentPoints }
	} else if (points === guidelines.points.permBan || activePoints === guidelines.points.tempBan) return { type: "BAN", duration: 0, activePunishmentPoints }
	else if (activePoints + points >= guidelines.points.tempBan) {
		let duration: number = 0
		switch (points) {
			case 1:
				duration = guidelines.durations.ban[0]
				break
			case 2:
				duration = guidelines.durations.ban[1]
				break
			case 3:
				duration = guidelines.durations.ban[2]
				break
			case 4:
			case 5:
				duration = guidelines.durations.ban[3]
				break
			default:
				throw "You gave me weird points I don't know what to do please help"
		}
		return { type: "BAN", duration, activePunishmentPoints }
	} else {
		console.log(activePoints, points)
		throw "We somehow didn't plan for this scenario, please check the logs"
	}
}

function checkPermissions(author: GuildMember, punishment: Punishment) {
	if (punishment.type === "BAN" && !author.roles.cache.has(ids.roles.admin)) {
		if (!author.roles.cache.has(ids.roles.mod)) return false
		if (!punishment.duration) return false
	}
	return true
}

export default command

interface Punishment {
	type: "VERBAL" | "WARN" | "MUTE" | "BAN"
	duration?: number
	activePunishmentPoints: PunishmentPoints | null
}

interface PunishmentGuidelines {
	name: string
	points: {
		verbalWarn: number
		mute: number
		tempBan: number
		permBan: number
	}
	durations: {
		mute: [number, number, number]
		ban: [number, number, number, number]
	}
}
