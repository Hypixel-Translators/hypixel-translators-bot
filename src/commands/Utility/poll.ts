import { ButtonInteraction, MessageActionRow, MessageButton, MessageEmbed, TextBasedChannel, type Snowflake } from "discord.js"
import { ObjectId } from "mongodb"

import { colors, ids } from "../../config.json"
import { db } from "../../lib/dbclient"
import { generateProgressBar } from "../../lib/util"
import { awaitPoll } from "../../listeners/ready"

import type { Command, GetStringFunction } from "../../lib/imports"

const command: Command = {
	name: "poll",
	description: "Creates/ends a poll in the current channel",
	options: [
		{
			type: "SUB_COMMAND",
			name: "start",
			description: "Starts a poll in the current channel",
			options: [
				{
					type: "STRING",
					name: "question",
					description: "The question of the poll",
					required: true,
				},
				{
					type: "STRING",
					name: "option1",
					description: "The first option in the poll",
					required: true,
				},
				{
					type: "STRING",
					name: "option2",
					description: "The second option in the poll",
					required: true,
				},
				{
					type: "NUMBER",
					name: "time",
					description: "How long before this poll is automatically closed and results are published (in hours).",
					required: false,
					maxValue: 720,
				},
				{
					type: "STRING",
					name: "option3",
					description: "The third option in the poll",
					required: false,
				},
				{
					type: "STRING",
					name: "option4",
					description: "The fourth option in the poll",
					required: false,
				},
				{
					type: "STRING",
					name: "option5",
					description: "The fifth option in the poll",
					required: false,
				},
				{
					type: "STRING",
					name: "option6",
					description: "The sixth option in the poll",
					required: false,
				},
				{
					type: "STRING",
					name: "option7",
					description: "The seventh option in the poll",
					required: false,
				},
				{
					type: "STRING",
					name: "option8",
					description: "The eigth option in the poll",
					required: false,
				},
			],
		},
		{
			type: "SUB_COMMAND",
			name: "end",
			description: "End a poll given its message ID",
			options: [
				{
					type: "STRING",
					name: "message_id",
					description: "The ID of the message containing the poll",
					required: true,
				},
				{
					type: "STRING",
					name: "channel_id",
					description: "The ID of the channel the poll was posted in, if not the current one",
					required: false,
				},
			],
		},
		{
			type: "SUB_COMMAND",
			name: "show",
			description: "Shows the current results of a poll without ending it. Only available to the creator of the poll",
			options: [
				{
					type: "STRING",
					name: "message_id",
					description: "The ID of the message containing the poll",
					required: true,
				},
				{
					type: "STRING",
					name: "channel_id",
					description: "The ID of the channel the poll was posted in, if not the current one",
					required: false,
				},
			],
		},
	],
	roleWhitelist: [ids.roles.hypixelPf, ids.roles.hypixelManager, ids.roles.admin],
	categoryBlacklist: [
		ids.categories.verification,
		ids.categories.main,
		ids.categories.hypixel,
		ids.categories.sba,
		ids.categories.bot,
		ids.categories.quickplay,
	],
	async execute(interaction, getString: GetStringFunction) {
		if (!interaction.inCachedGuild()) return
		await interaction.deferReply({ ephemeral: true })
		const numberEmojis = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"],
			subcommand = interaction.options.getSubcommand() as "start" | "end" | "show"

		if (subcommand === "start") {
			const question = interaction.options.getString("question", true),
				options = interaction.options.data.find(o => o.name === "start")!.options!.filter(o => o.name.includes("option")),
				time = interaction.options.getNumber("time", false),
				endTimestamp = time && Math.round(Date.now() + time * 3_600_000),
				discordEndTimestamp = endTimestamp && Math.round(endTimestamp / 1000),
				embed = new MessageEmbed({
					color: "BLURPLE",
					title: question,
					description: `${discordEndTimestamp ? `This poll will end on <t:${discordEndTimestamp}:F> (<t:${discordEndTimestamp}:R>)\n\n` : ""}${options
						.map((o, i) => `${numberEmojis[i + 1]} ${o.value}`)
						.join("\n\n")}`,
					footer: { text: `Poll by ${interaction.user.tag}`, iconURL: interaction.member.displayAvatarURL({ format: "png", dynamic: true }) },
					timestamp: Date.now(),
				}),
				buttons = options.map((o, i) => new MessageButton({ customId: o.name, emoji: numberEmojis[i + 1], style: "SECONDARY" })),
				components: MessageButton[][] = []
			let p = 0
			// Try to split buttons evenly across the rows
			while (p < buttons.length) components.push(buttons.slice(p, (p += buttons.length <= 5 ? 5 : Math.ceil(buttons.length / 2))))
			const msg = await interaction.channel!.send({
					embeds: [embed],
					components: components.map(b => new MessageActionRow({ components: b })),
				}),
				dbData: Poll = {
					messageId: msg.id,
					channelId: interaction.channelId,
					question,
					options: options.map(o => ({ id: o.name, text: o.value as string, votes: [] })),
					authorId: interaction.user.id,
					ended: false,
				}
			if (endTimestamp) dbData.endTimestamp = endTimestamp
			await db.collection<Poll>("polls").insertOne(dbData)
			await interaction.editReply(
				`${getString("successPost")}${
					discordEndTimestamp
						? ` ${getString("endPost", { variables: { fullTime: `<t:${discordEndTimestamp}:F>`, relativeTime: `<t:${discordEndTimestamp}:R>` } })}`
						: ""
				}`,
			)
			if (endTimestamp) awaitPoll(dbData)
		} else if (subcommand === "end") {
			const messageId = interaction.options.getString("message_id", true),
				channel = interaction.client.channels.cache.get(interaction.options.getString("channel_id", false) ?? interaction.channelId) as
					| TextBasedChannel
					| undefined,
				collection = db.collection<Poll>("polls")
			if (!channel) return void (await interaction.editReply(getString("noChannelId")))
			const message = await channel.messages.fetch(messageId).catch(() => null)
			if (!message) return void (await interaction.editReply(getString("noMessageId")))
			const pollDb = await collection.findOne({ messageId, channelId: channel.id })
			if (!pollDb) return void (await interaction.editReply(getString("noPoll")))
			let buttonInt: ButtonInteraction | null = null
			if (pollDb.endTimestamp) {
				const discordEndTimestamp = Math.round(pollDb.endTimestamp / 1000),
					embed = new MessageEmbed({
						color: colors.error,
						title: getString("endingWarning"),
						description: getString("endingWarningDesc", {
							variables: { fullTime: `<t:${discordEndTimestamp}:F>`, relativeTime: `<t:${discordEndTimestamp}:R>` },
						}),
					}),
					buttons = new MessageActionRow({
						components: [
							new MessageButton({
								customId: "confirm",
								style: "SUCCESS",
								emoji: "✅",
								label: getString("pagination.confirm", { file: "global" }),
							}),
							new MessageButton({
								customId: "cancel",
								style: "DANGER",
								emoji: "❌",
								label: getString("pagination.cancel", { file: "global" }),
							}),
						],
					}),
					msg = await interaction.editReply({ embeds: [embed], components: [buttons] }),
					buttonInteraction = await msg
						.awaitMessageComponent<"BUTTON">({
							time: 60_000,
							filter: int => int.user.id === interaction.user.id,
						})
						.catch(async () => {
							const cancelEmbed = new MessageEmbed({
								color: colors.error,
								title: getString("didntReply"),
								description: getString("endScheduled", {
									variables: { fullTime: `<t:${discordEndTimestamp}:F>`, relativeTime: `<t:${discordEndTimestamp}:R>` },
								}),
							})
							await interaction.editReply({ embeds: [cancelEmbed], components: [] })
							return null
						})

				if (!buttonInteraction) return
				if (buttonInteraction.customId === "confirm") {
					await buttonInteraction.deferUpdate()
					buttonInt = buttonInteraction
				} else {
					const successEmbed = new MessageEmbed({
						color: colors.success,
						title: getString("successCancelEnd"),
						description: getString("endScheduled", {
							variables: { fullTime: `<t:${discordEndTimestamp}:F>`, relativeTime: `<t:${discordEndTimestamp}:R>` },
						}),
					})
					await buttonInteraction.update({ embeds: [successEmbed], components: [] })
				}
				if (!buttonInt) return
			}
			const totalVoteCount = pollDb.options.reduce((acc, o) => acc + o.votes.length, 0),
				embed = new MessageEmbed({
					color: "BLURPLE",
					title: pollDb.question,
					description: totalVoteCount
						? `A total of ${totalVoteCount} ${totalVoteCount === 1 ? "person" : "people"} voted on this poll!`
						: "Unfortunately, no one voted on this poll",
					fields: pollDb.options.map(o => ({
						name: o.text,
						// Make sure to account for NaN values
						value: `${generateProgressBar(o.votes.length, totalVoteCount)} ${Math.round((o.votes.length / totalVoteCount) * 100) || 0}% (**${
							o.votes.length
						} votes**)`,
					})),
					footer: { text: "Poll results • Created at" },
					timestamp: new ObjectId(pollDb._id).getTimestamp().getTime(),
				}),
				msg = await interaction.channel!.send({
					embeds: [embed],
					content: `<@${pollDb.authorId}> your poll just ended. Check out the results below!`,
				}),
				linkButton = new MessageActionRow({ components: [new MessageButton({ style: "LINK", url: msg.url, label: "See results" })] })
			await collection.updateOne({ messageId, channelId: channel.id }, { $set: { ended: true } })
			await message.edit({ content: "This poll has ended!", components: [linkButton] })
			await (buttonInt ?? interaction).editReply({ content: getString("successEnd"), embeds: [], components: [] })
		} else if (subcommand === "show") {
			const messageId = interaction.options.getString("message_id", true),
				channel = interaction.client.channels.cache.get(interaction.options.getString("channel_id", false) ?? interaction.channelId) as
					| TextBasedChannel
					| undefined
			if (!channel) return void (await interaction.editReply(getString("noChannelId")))
			const message = await channel.messages.fetch(messageId).catch(() => null)
			if (!message) return void (await interaction.editReply(getString("noMessageId")))
			const pollDb = await db.collection<Poll>("polls").findOne({ messageId, channelId: channel.id })
			if (!pollDb) return void (await interaction.editReply(getString("noPoll")))
			if (pollDb.authorId !== interaction.user.id && !interaction.member.roles.cache.has(ids.roles.admin))
				return void (await interaction.editReply(getString("errorNotOwner")))
			const totalVoteCount = pollDb.options.reduce((acc, o) => acc + o.votes.length, 0),
				embed = new MessageEmbed({
					color: "BLURPLE",
					title: pollDb.question,
					description: `**${getString("totalVotes")}**: ${totalVoteCount}\n**${getString("createdOn")}**: <t:${Math.round(
						new ObjectId(pollDb._id).getTimestamp().getTime() / 1000,
					)}:F>${pollDb.endTimestamp ? `\n**${getString("endingOn")}**: <t:${Math.round(pollDb.endTimestamp / 1000)}:F>` : ""}`,
					fields: pollDb.options.map(o => ({
						name: o.text,
						// Make sure to account for NaN values
						value: `${generateProgressBar(o.votes.length, totalVoteCount)} ${
							Math.round((o.votes.length / totalVoteCount) * 100) || 0
						}% (**${getString(o.votes.length === 1 ? "voteCount" : "voteCountPlural", { variables: { number: o.votes.length } })}**)`,
					})),
					footer: { text: getString("pollResults") },
				})
			await interaction.editReply({ embeds: [embed] })
		}
	},
}

export interface Poll {
	messageId: Snowflake
	channelId: Snowflake
	question: string
	options: PollOption[]
	authorId: Snowflake
	endTimestamp?: number
	ended: boolean
}

interface PollOption {
	id: string
	text: string
	votes: Snowflake[]
}

export default command