import { setTimeout } from "node:timers/promises"

import {
	type ButtonInteraction,
	type GuildMember,
	ActionRowBuilder,
	ButtonBuilder,
	EmbedBuilder,
	type TextChannel,
	type User,
	ComponentType,
	ButtonStyle,
	ApplicationCommandOptionType,
} from "discord.js"

import { colors, ids } from "../../config.json"
import { db } from "../../lib/dbclient"
import { generateTip, getActivePunishments, type PunishmentLog, type PunishmentPoints } from "../../lib/util"
import { awaitBan, awaitMute } from "../../listeners/ready"

import type { Command } from "../../lib/imports"
import type { WithId } from "mongodb"

const command: Command = {
	name: "punishment",
	description: "Punishes a user or calculates the punishment based on the amount of points given",
	options: [
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: "give",
			description: "Punish a user",
			options: [
				{
					type: ApplicationCommandOptionType.User,
					name: "user",
					description: "The user to punish",
					required: true,
				},
				{
					type: ApplicationCommandOptionType.Integer,
					name: "points",
					description: "How many points to give this member for this infraction",
					required: true,
					choices: [
						{ name: "1", value: 1 },
						{ name: "2", value: 2 },
						{ name: "3", value: 3 },
						{ name: "4", value: 4 },
						{ name: "5", value: 5 },
						{ name: "6", value: 6 },
					],
				},
				{
					type: ApplicationCommandOptionType.String,
					name: "reason",
					description: "The reason for this punishment",
					required: true,
				},
				{
					type: ApplicationCommandOptionType.Number,
					name: "duration",
					description: "The duration of the punishment",
					required: false,
				},
			],
		},
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: "calculate",
			description: "Calculate a punishment for a user and evaluate permissions to apply it",
			options: [
				{
					type: ApplicationCommandOptionType.User,
					name: "user",
					description: "The user to punish",
					required: true,
				},
				{
					type: ApplicationCommandOptionType.Integer,
					name: "points",
					description: "How many points to give this member for this infraction",
					required: true,
					choices: [
						{ name: "1", value: 1 },
						{ name: "2", value: 2 },
						{ name: "3", value: 3 },
						{ name: "4", value: 4 },
						{ name: "5", value: 5 },
						{ name: "6", value: 6 },
					],
				},
			],
		},
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: "status",
			description: "Shows you a user's currently active points and punishments",
			options: [
				{
					type: ApplicationCommandOptionType.User,
					name: "user",
					description: "The user to check standing for",
					required: true,
				},
			],
		},
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: "revoke",
			description: "Revoke all active punishments the user has",
			options: [
				{
					type: ApplicationCommandOptionType.User,
					name: "user",
					description: "The user to revoke punishments from",
					required: true,
				},
				{
					type: ApplicationCommandOptionType.String,
					name: "reason",
					description: "The reason for revoking this user's punishment",
					required: true,
				},
				{
					type: ApplicationCommandOptionType.Boolean,
					name: "senddm",
					description: "Whether to send a DM to this user regarding the removal of their punishment",
					required: true,
				},
			],
		},
	],
	roleWhitelist: [ids.roles.staff],
	channelWhitelist: [ids.channels.staffBots, ids.channels.adminBots],
	async execute(interaction) {
		if (!interaction.inCachedGuild()) return
		const subCommand = interaction.options.getSubcommand(),
			collection = db.collection<PunishmentLog>("punishments"),
			user = interaction.options.getUser("user", true),
			memberInput = interaction.options.getMember("user"),
			points = interaction.options.getInteger("points", false) as PunishmentPoints | null,
			duration = interaction.options.getNumber("duration", false),
			punishment = await calculatePunishment(user, points ?? 1),
			buttons = new ActionRowBuilder<ButtonBuilder>({
				components: [
					new ButtonBuilder({
						style: ButtonStyle.Success,
						customId: "confirm",
						label: "Confirm",
						emoji: "✅",
						disabled: true,
					}),
					new ButtonBuilder({
						style: ButtonStyle.Danger,
						customId: "cancel",
						label: "Cancel",
						emoji: "❎",
						disabled: true,
					}),
				],
			}),
			filter = (bInteraction: ButtonInteraction) => bInteraction.user.id === interaction.user.id,
			caseNumber = (await collection.estimatedDocumentCount()) + 1,
			punishmentsChannel = interaction.client.channels.cache.get(ids.channels.punishments) as TextChannel,
			randomTip = generateTip()

		if (duration) punishment.duration &&= duration
		let reason = interaction.options.getString("reason")
		if (reason) reason = reason.charAt(0).toUpperCase() + reason.slice(1)

		if (subCommand === "give") {
			await interaction.deferReply()

			// Check for permissions to give the punishment
			if (!checkPermissions(interaction.member, punishment)) throw "You don't have permission to give this punishment"
			if (user.bot) throw "You cannot punish bots!"
			if (memberInput?.roles.cache.has(ids.roles.staff)) throw "You cannot punish this user!"
			if (points! <= (punishment.activePunishmentPoints ?? 0))
				throw `This user currently has an active punishment with ${punishment.activePunishmentPoints} points, so you cannot give them a less severe punishment!`

			// Apply the punishment
			if (punishment.type === "VERBAL") {
				if (!memberInput) throw "Couldn't find that member! Are you sure they're on the server?"
				const punishmentLog = new EmbedBuilder({
						color: colors.error,
						author: {
							name: `Case ${caseNumber} | Verbal Warning | ${points} point${points === 1 ? "" : "s"}`,
							iconURL: user.displayAvatarURL({ extension: "png" }),
						},
						fields: [
							{ name: "User", value: user.toString(), inline: true },
							{ name: "Moderator", value: interaction.user.toString(), inline: true },
							{ name: "Reason", value: reason! },
						],
						footer: { text: `ID: ${user.id}` },
						timestamp: Date.now(),
					}),
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
				const embed = new EmbedBuilder({
					color: colors.success,
					author: { name: "Punishments" },
					title: "Successfully registered this verbal warning!",
					fields: [
						{ name: "Member", value: user.toString(), inline: true },
						{ name: "Points", value: points!.toString(), inline: true },
						{ name: "Reason", value: reason! },
					],
					footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
				})
				await interaction.editReply({ embeds: [embed] })
			} else if (punishment.type === "WARN") {
				if (!memberInput) throw "Couldn't find that member! Are you sure they're on the server?"
				const confirmEmbed = new EmbedBuilder({
						color: colors.loading,
						author: { name: "Punishments" },
						title: `Are you sure you want to warn ${user.tag}?`,
						description: reason!,
						footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
					}),
					confirmMsg = await interaction.editReply({ embeds: [confirmEmbed], components: [buttons] })

				await setTimeout(5_000)
				buttons.components.map(b => b.setDisabled(false))
				await interaction.editReply({ components: [buttons] })
				const buttonInteraction = await confirmMsg.awaitMessageComponent<ComponentType.Button>({ filter, time: 65_000 }).catch(() => null)
				if (!buttonInteraction) {
					const embed = new EmbedBuilder({
						color: colors.error,
						author: { name: "Punishments" },
						title: "You didn't respond in time, so this user wasn't warned",
						footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
					})
					await interaction.editReply({ embeds: [embed], components: [] })
					return
				}
				if (buttonInteraction.customId === "confirm") {
					await buttonInteraction.deferUpdate()

					const punishmentLog = new EmbedBuilder({
							color: colors.error,
							author: {
								name: `Case ${caseNumber} | Warning | ${points} point${points === 1 ? "" : "s"}`,
								iconURL: user.displayAvatarURL({ extension: "png" }),
							},
							fields: [
								{ name: "User", value: user.toString(), inline: true },
								{ name: "Moderator", value: interaction.user.toString(), inline: true },
								{ name: "Reason", value: reason! },
							],
							footer: { text: `ID: ${user.id}` },
							timestamp: Date.now(),
						}),
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
					const dmEmbed = new EmbedBuilder({
							color: colors.error,
							author: { name: "Punishment" },
							title: `You have been warned on the ${interaction.guild!.name}`,
							description: `**Reason:** ${reason}`,
							timestamp: Date.now(),
						}),
						embed = new EmbedBuilder({
							color: colors.success,
							author: { name: "Punishments" },
							title: "Successfully warned this member!",
							fields: [
								{ name: "Member", value: user.toString(), inline: true },
								{ name: "Points", value: points!.toString(), inline: true },
								{ name: "Reason", value: reason! },
							],
							footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
						})
					await user
						.send({ embeds: [dmEmbed] })
						.then(async () => await buttonInteraction.editReply({ embeds: [embed], components: [] }))
						.catch(async err => {
							console.log(`Couldn't DM user ${user.tag} about their warning, here's the error\n${err}`)
							embed.setColor(colors.error).setDescription("Warning not sent because the user had DMs off")
							await buttonInteraction.editReply({ embeds: [embed], components: [] })
						})
				} else if (buttonInteraction.customId === "cancel") {
					const embed = new EmbedBuilder({
						color: colors.success,
						author: { name: "Punishments" },
						title: "Successfully cancelled this punishment",
						footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
					})
					await buttonInteraction.update({ embeds: [embed], components: [] })
				}
			} else if (punishment.type === "MUTE") {
				const confirmEmbed = new EmbedBuilder({
						color: colors.loading,
						author: { name: "Punishments" },
						title: "Are you sure you want to mute this member?",
						description: `Confirming this will mute ${user} for ${punishment.duration} hours with the following reason:\n\n${reason}`,
						footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
					}),
					confirmMsg = await interaction.editReply({ embeds: [confirmEmbed], components: [buttons] })

				await setTimeout(5_000)
				buttons.components.map(b => b.setDisabled(false))
				await interaction.editReply({ components: [buttons] })
				const buttonInteraction = await confirmMsg.awaitMessageComponent<ComponentType.Button>({ filter, time: 65_000 }).catch(() => null)
				if (!buttonInteraction) {
					const embed = new EmbedBuilder({
						color: colors.error,
						author: { name: "Punishments" },
						title: "You didn't respond in time, so this user wasn't muted",
						footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
					})
					await interaction.editReply({ embeds: [embed], components: [] })
					return
				}
				if (buttonInteraction.customId === "confirm") {
					await buttonInteraction.deferUpdate()
					const endTimestamp = new Date().setHours(new Date().getHours() + punishment.duration!),
						punishmentLog = new EmbedBuilder({
							color: colors.error,
							author: {
								name: `Case ${caseNumber} | Mute | ${points} point${points === 1 ? "" : "s"}`,
								iconURL: user.displayAvatarURL({ extension: "png" }),
							},
							fields: [
								{ name: "User", value: user.toString(), inline: true },
								{ name: "Moderator", value: interaction.user.toString(), inline: true },
								{ name: "Duration", value: `${punishment.duration} hours`, inline: true },
								{ name: "Reason", value: reason! },
							],
							footer: { text: `ID: ${user.id}` },
							timestamp: Date.now(),
						}),
						msg = await punishmentsChannel.send({ embeds: [punishmentLog] }),
						punishmentDb = (await collection
							.insertOne({
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
							.then(result => collection.findOne({ _id: result.insertedId })))!

					if (!memberInput) throw "Couldn't find that member! Are you sure they're on the server?"
					if (memberInput.moderatable) await memberInput.disableCommunicationUntil(endTimestamp, `${reason} | ${interaction.user.tag}`)
					else throw "I cannot mute that member!"

					const dmEmbed = new EmbedBuilder({
							color: colors.error,
							author: { name: "Punishment" },
							title: `You have been muted on the ${interaction.guild!.name} for ${punishment.duration} hours`,
							description: `**Reason:** ${reason}\n\nYour mute will expire on <t:${Math.round(endTimestamp / 1000)}:F> (<t:${Math.round(
								endTimestamp / 1000
							)}:R>)`,
							timestamp: Date.now(),
						}),
						embed = new EmbedBuilder({
							color: colors.success,
							author: { name: "Punishments" },
							title: "Successfully muted this member!",
							fields: [
								{ name: "Member", value: user.toString(), inline: true },
								{ name: "Points", value: points!.toString(), inline: true },
								{ name: "Duration", value: `${punishment.duration!.toString()} hours`, inline: true },
								{ name: "Reason", value: reason! },
							],
							footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
						})
					await user
						.send({ embeds: [dmEmbed] })
						.then(async () => await buttonInteraction.editReply({ embeds: [embed], components: [] }))
						.catch(async err => {
							console.log(`Couldn't DM user ${user.tag} about their mute, here's the error\n${err}`)
							embed.setColor(colors.error).setDescription("Message not send because the user had DMs off")
							await buttonInteraction.editReply({ embeds: [embed], components: [] })
						})
					awaitMute(punishmentDb)
				} else if (buttonInteraction.customId === "cancel") {
					const embed = new EmbedBuilder({
						color: colors.success,
						author: { name: "Punishments" },
						title: "Successfully cancelled this punishment",
						footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
					})
					await buttonInteraction.update({ embeds: [embed], components: [] })
				}
			} else if (punishment.type === "BAN") {
				const confirmEmbed = new EmbedBuilder({
						color: colors.loading,
						author: { name: "Punishments" },
						title: "Are you sure you want to ban this member?",
						description: `Confirming this will ban ${user} ${
							punishment.duration ? `for ${punishment.duration} days` : "permanently"
						} with the following reason:\n\n${reason}${
							punishment.activePunishmentPoints
								? "\n\n⚠ This user currently has an active punishment! Think twice before confirming this."
								: ""
						}`,
						footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
					}),
					confirmMsg = await interaction.editReply({ embeds: [confirmEmbed], components: [buttons] })

				await setTimeout(5_000)
				buttons.components.map(b => b.setDisabled(false))
				await interaction.editReply({ components: [buttons] })
				const buttonInteraction = await confirmMsg.awaitMessageComponent<ComponentType.Button>({ filter, time: 65_000 }).catch(() => null)
				if (!buttonInteraction) {
					const embed = new EmbedBuilder({
						color: colors.error,
						author: { name: "Punishments" },
						title: "You didn't respond in time, so this user wasn't banned",
						footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
					})
					await interaction.editReply({ embeds: [embed], components: [] })
					return
				}
				if (buttonInteraction.customId === "confirm") {
					await buttonInteraction.deferUpdate()

					if (!memberInput) throw "Couldn't find that member in order to ban them!"
					if (memberInput.bannable) await memberInput.ban({ reason: reason! })
					else throw "I cannot ban that member!"

					const endTimestamp = punishment.duration ? new Date().setDate(new Date().getDate() + punishment.duration) : 0,
						punishmentLog = new EmbedBuilder({
							color: colors.error,
							author: {
								name: `Case ${caseNumber} | Ban | ${points} point${points === 1 ? "" : "s"}`,
								iconURL: user.displayAvatarURL({ extension: "png" }),
							},
							fields: [
								{ name: "User", value: user.toString(), inline: true },
								{ name: "Moderator", value: interaction.user.toString(), inline: true },
								{ name: "Duration", value: punishment.duration ? `${punishment.duration} days` : "Permanent", inline: true },
								{ name: "Reason", value: reason! },
							],
							footer: { text: `ID: ${user.id}` },
							timestamp: Date.now(),
						}),
						msg = await punishmentsChannel.send({ embeds: [punishmentLog] })

					if (punishment.activePunishmentPoints) {
						await collection.updateMany(
							{ id: user.id, ended: false },
							{ $set: { ended: true, revoked: true, revokedBy: interaction.user.id, endTimestamp: Date.now() } }
						)
					}

					let punishmentDb: WithId<PunishmentLog>
					if (punishment.duration) {
						punishmentDb = (await collection
							.insertOne({
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
							.then(result => collection.findOne({ _id: result.insertedId })))!
					} else {
						punishmentDb = (await collection
							.insertOne({
								case: caseNumber,
								id: user.id,
								type: punishment.type,
								points: points as PunishmentPoints,
								reason: reason as string,
								timestamp: Date.now(),
								duration: punishment.duration!,
								ended: false,
								moderator: interaction.user.id,
								logMsg: msg.id,
							})
							.then(result => collection.findOne({ _id: result.insertedId })))!
					}

					const dmEmbed = new EmbedBuilder({
							color: colors.error,
							author: { name: "Punishments" },
							title: `You have been ${punishment.duration ? "" : "permanently "}banned from the ${interaction.guild!.name} ${
								punishment.duration ? `for ${punishment.duration} days` : ""
							}`,
							description: `**Reason:** ${reason}\n\n${
								endTimestamp
									? `This ban will expire on <t:${Math.round(endTimestamp / 1000)}:F> (<t:${Math.round(endTimestamp / 1000)}:R>)`
									: "This is a permanent ban and will not expire"
							}`,
							timestamp: Date.now(),
						}),
						embed = new EmbedBuilder({
							color: colors.success,
							author: { name: "Punishments" },
							title: "Successfully banned this member!",
							fields: [
								{ name: "Member", value: user.toString(), inline: true },
								{ name: "Points", value: points!.toString(), inline: true },
								{
									name: "Duration",
									value: `${punishment.duration ? `${punishment.duration!.toString()} days` : "Permanent"}`,
									inline: true,
								},
								{ name: "Reason", value: reason! },
							],
							footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
						})
					await user
						.send({ embeds: [dmEmbed] })
						.then(async () => await buttonInteraction.editReply({ embeds: [embed], components: [] }))
						.catch(async err => {
							console.log(`Couldn't warn user ${user.tag} about their ban, here's the error\n${err}`)
							embed.setColor(colors.error).setDescription("Warning not sent because the user had DMs off")
							await buttonInteraction.editReply({ embeds: [embed], components: [] })
						})
					if (punishment.duration) awaitBan(punishmentDb)
				} else if (buttonInteraction.customId === "cancel") {
					const embed = new EmbedBuilder({
						color: colors.success,
						author: { name: "Punishments" },
						title: "Successfully cancelled this punishment",
						footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
					})
					await buttonInteraction.update({ embeds: [embed], components: [] })
				}
			}
		} else if (subCommand === "status") {
			const activePunishments = await getActivePunishments(user)
			let activePoints = 0
			activePunishments.forEach(punish => {
				activePoints += punish.points ?? 0
			})

			const embed = new EmbedBuilder({
				color: activePoints ? colors.error : colors.success,
				author: { name: "Punishments" },
				title: `${user.tag} currently has ${activePoints} point${activePoints === 1 ? "" : "s"}.`,
				footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
			})
			activePunishments.forEach(punish => {
				const expireTimestamp =
					punish.type === "VERBAL"
						? new Date(punish.timestamp).setDate(new Date(punish.timestamp).getDate() + 1)
						: punish.type === "WARN"
						? new Date(punish.timestamp).setDate(new Date(punish.timestamp).getDate() + 7)
						: new Date(punish.endTimestamp!).setDate(new Date(punish.endTimestamp!).getDate() + 30)
				embed.addFields({
					name: `Case ${punish.case}: ${
						punish.endTimestamp ? (punish.duration ? `${punish.duration}${punish.type === "BAN" ? "d" : "h"} ` : "permanent ") : ""
					}${punish.type} (${punish.points} points)`,
					value: `${
						typeof punish.duration === "number"
							? punish.duration
								? `Ends <t:${Math.round(punish.endTimestamp! / 1000)}:R>\n`
								: "Never ends\n"
							: ""
					}${expireTimestamp ? `Expires <t:${Math.round(expireTimestamp / 1000)}:R>` : ""}`,
					inline: true,
				})
			})
			await interaction.reply({ embeds: [embed] })
		} else if (subCommand === "calculate") {
			const hasPermission = checkPermissions(interaction.member, punishment),
				unexpiredPunishments = await getActivePunishments(user),
				durationString = punishment.duration ? `${punishment.duration}${punishment.type === "BAN" ? "d" : "h"} ` : "permanent ",
				embed = new EmbedBuilder({
					color: hasPermission ? colors.success : colors.error,
					author: { name: "Punishments" },
					title: `Giving this member ${points} points will result in a ${["MUTE", "BAN"].includes(punishment.type) ? durationString : ""}${
						punishment.type
					}`,
					description: `You ${hasPermission ? "" : "don't "}have permission to issue this punishment.\n\n${
						unexpiredPunishments.length ? `Here are ${user}'s active punishments:` : `${user} has no active punishments at the moment`
					}`,
					footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
				})
			unexpiredPunishments.forEach(punish => {
				const expireTimestamp =
					punish.type === "VERBAL"
						? new Date(punish.timestamp).setDate(new Date(punish.timestamp).getDate() + 1)
						: punish.type === "WARN"
						? new Date(punish.timestamp).setDate(new Date(punish.timestamp).getDate() + 7)
						: new Date(punish.endTimestamp!).setDate(new Date(punish.endTimestamp!).getDate() + 30)
				embed.addFields({
					name: `Case ${punish.case}: ${
						punish.endTimestamp ? (punish.duration ? `${punish.duration}${punish.type === "BAN" ? "d" : "h"} ` : "permanent ") : ""
					}${punish.type} (${punish.points} points)`,
					value: `${
						typeof punish.duration === "number"
							? punish.duration
								? `Ends <t:${Math.round(punish.endTimestamp! / 1000)}:R>\n`
								: "Never ends\n"
							: ""
					}${expireTimestamp ? `Expires <t:${Math.round(expireTimestamp / 1000)}:R>` : ""}`,
					inline: true,
				})
			})
			await interaction.reply({ embeds: [embed] })
		} else if (subCommand === "revoke") {
			if (!interaction.member.permissions.has("ViewAuditLog")) throw "noAccess"
			const activePunishments = await collection.find({ id: user.id, ended: false }).toArray()
			if (activePunishments.length > 1) {
				return void (await interaction.reply({
					content:
						"Something went terribly wrong and this user has more than one active punishment! Please contact the developer and let them know about this.",
					ephemeral: true,
				}))
			} else if (!activePunishments.length) throw "This user has no active punishments!"
			const confirmEmbed = new EmbedBuilder({
				color: colors.loading,
				author: { name: "Punishments" },
				title: `Are you sure you want to revoke ${user.tag}'s active ${activePunishments[0].type}?`,
				footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
			})
			activePunishments.forEach(punish => {
				const expireTimestamp =
					punish.type === "VERBAL"
						? new Date(punish.timestamp).setDate(new Date(punish.timestamp).getDate() + 1)
						: punish.type === "WARN"
						? new Date(punish.timestamp).setDate(new Date(punish.timestamp).getDate() + 7)
						: new Date(punish.endTimestamp!).setDate(new Date(punish.endTimestamp!).getDate() + 30)
				confirmEmbed.addFields({
					name: `Case ${punish.case}: ${
						punish.endTimestamp ? (punish.duration ? `${punish.duration}${punish.type === "BAN" ? "d" : "h"} ` : "permanent ") : ""
					}${punish.type} (${punish.points} points)`,
					value: `${
						typeof punish.duration === "number"
							? punish.duration
								? `Ends <t:${Math.round(punish.endTimestamp! / 1000)}:R>\n`
								: "Never ends\n"
							: ""
					}${expireTimestamp ? `Expires <t:${Math.round(expireTimestamp / 1000)}:R>` : ""}`,
					inline: true,
				})
			})
			const confirmMsg = await interaction.reply({ embeds: [confirmEmbed], components: [buttons], fetchReply: true })

			await setTimeout(5_000)
			buttons.components.map(b => b.setDisabled(false))
			await interaction.editReply({ components: [buttons] })
			const buttonInteraction = await confirmMsg.awaitMessageComponent<ComponentType.Button>({ filter, time: 65_000 }).catch(() => null)
			if (!buttonInteraction) {
				const embed = new EmbedBuilder({
					color: colors.error,
					author: { name: "Punishments" },
					title: "You didn't respond in time, so this user's punishments weren't revoked",
					footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
				})
				await interaction.editReply({ embeds: [embed], components: [] })
				return
			}
			if (buttonInteraction.customId === "confirm") {
				await buttonInteraction.deferUpdate()
				const punishmentLog = new EmbedBuilder({
						color: colors.success,
						author: {
							name: `Case ${caseNumber} | ${activePunishments[0].type === "BAN" ? "Unban" : "Unmute"} | ${user.tag}`,
							iconURL: user.displayAvatarURL({ extension: "png" }),
						},
						fields: [
							{ name: "User", value: `${user}`, inline: true },
							{ name: "Moderator", value: `${interaction.user}`, inline: true },
							{ name: "Reason", value: reason! },
						],
						footer: { text: `ID: ${user.id}` },
						timestamp: Date.now(),
					}),
					msg = await punishmentsChannel.send({ embeds: [punishmentLog] })

				await collection.bulkWrite([
					{
						updateOne: {
							filter: { case: activePunishments[0].case },
							update: { $set: { revoked: true, revokedBy: interaction.user.id, ended: true, endTimestamp: Date.now() } },
						},
					},
					{
						insertOne: {
							document: {
								case: caseNumber,
								id: user.id,
								type: `UN${activePunishments[0].type}`,
								reason,
								timestamp: Date.now(),
								moderator: interaction.user.id,
								logMsg: msg.id,
							} as PunishmentLog,
						},
					},
				])

				const dmEmbed = new EmbedBuilder({
						color: colors.success,
						author: { name: "Punishments" },
						title: `You have been un${activePunishments[0].type === "BAN" ? "banned" : "muted"} from the ${interaction.guild!.name}`,
						description: `**Reason:** ${reason}`,
						timestamp: Date.now(),
					}),
					embed = new EmbedBuilder({
						color: colors.success,
						author: { name: "Punishments" },
						title: "Successfully revoked this member's punishment!",
						fields: [
							{ name: "Member", value: user.toString(), inline: true },
							{ name: "Punishment type", value: activePunishments[0].type, inline: true },
							{ name: "Reason", value: reason!, inline: true },
						],
						footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
					})

				if (activePunishments[0].type === "BAN") {
					await interaction.guild!.bans.remove(user.id, `${reason} | ${interaction.user.tag}`).catch(async err => {
						embed.setDescription(`Failed to remove the ban: ${err}`)
						await buttonInteraction.editReply({ embeds: [embed], components: [] })
					})
				} else if (!memberInput) embed.setDescription(`Failed to unmute ${user}, they may not be in the server`)
				else if (activePunishments[0].type === "MUTE")
					await memberInput.disableCommunicationUntil(null, `${reason} | ${interaction.user.tag}`)

				if (interaction.options.getBoolean("senddm", true)) {
					await user
						.send({ embeds: [dmEmbed] })
						.then(async () => await buttonInteraction.editReply({ embeds: [embed], components: [] }))
						.catch(async err => {
							console.log(`Couldn't DM user ${user.tag} about their revoked ${activePunishments[0].type}, here's the error\n${err}`)
							embed.setColor(colors.error).setDescription("Warning not sent because the user had DMs off")
							await buttonInteraction.editReply({ embeds: [embed], components: [] })
						})
				} else await buttonInteraction.editReply({ embeds: [embed], components: [] })
			} else if (buttonInteraction.customId === "cancel") {
				const embed = new EmbedBuilder({
					color: colors.success,
					author: { name: "Punishments" },
					title: "Successfully cancelled revoking this punishment",
					footer: { text: randomTip, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
				})
				await buttonInteraction.update({ embeds: [embed], components: [] })
			}
		}
	},
}

async function calculatePunishment(user: User, points: PunishmentPoints): Promise<Punishment> {
	const activePunishments = await getActivePunishments(user),
		activePunishmentPoints = activePunishments.find(p => p.ended === false)?.points ?? null,
		guidelines = (await db.collection("config").findOne<PunishmentGuidelines>({ name: "punishmentGuidelines" }))!

	let activePoints = 0
	activePunishments.forEach(p => (activePoints = activePoints + p.points! || activePoints))
	if (activePunishments.some(p => p.type === "UNBAN" && p.moderator !== user.client.user!.id)) activePoints -= guidelines.points.tempBan
	if (activePunishments.some(p => p.type === "UNMUTE" && p.moderator !== user.client.user!.id)) activePoints -= guidelines.points.mute
	if (activePoints > guidelines.points.tempBan) activePoints = guidelines.points.tempBan
	else if (activePoints < 0) activePoints = 0

	if (activePoints + points === guidelines.points.verbalWarn) return { type: "VERBAL", activePunishmentPoints }
	else if (activePoints + points < guidelines.points.mute) return { type: "WARN", activePunishmentPoints }
	else if (activePoints + points === guidelines.points.mute) {
		let duration = 0
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
	} else if (points === guidelines.points.permBan || activePoints === guidelines.points.tempBan)
		return { type: "BAN", duration: 0, activePunishmentPoints }
	else if (activePoints + points >= guidelines.points.tempBan) {
		let duration = 0
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
