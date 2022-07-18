import {
	ActionRowBuilder,
	ApplicationCommandOptionType,
	ButtonBuilder,
	type ButtonInteraction,
	ButtonStyle,
	Colors,
	ComponentType,
	EmbedBuilder,
	type Snowflake,
	ChannelType,
	GuildTextBasedChannel,
} from "discord.js"
import { ObjectId } from "mongodb"

import { colors, ids } from "../../config.json"
import { db } from "../../lib/dbclient"
import { generateProgressBar, splitArray } from "../../lib/util"
import { awaitPoll } from "../../listeners/ready"

import type { Command, GetStringFunction } from "../../lib/imports"

const command: Command = {
	name: "poll",
	description: "Creates or manages polls on the server. Available to Hypixel Proofreaders and above",
	options: [
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: "start",
			description: "Starts a poll in the current channel",
			options: [
				{
					type: ApplicationCommandOptionType.String,
					name: "question",
					description: "The question of the poll",
					required: true,
					maxLength: 256,
				},
				{
					type: ApplicationCommandOptionType.String,
					name: "option1",
					description: "The first option in the poll",
					required: true,
				},
				{
					type: ApplicationCommandOptionType.String,
					name: "option2",
					description: "The second option in the poll",
					required: true,
				},
				{
					type: ApplicationCommandOptionType.Number,
					name: "time",
					description: "How long before this poll is automatically closed and results are published (in hours)",
					required: false,
					maxValue: 720,
				},
				{
					type: ApplicationCommandOptionType.String,
					name: "option3",
					description: "The third option in the poll",
					required: false,
				},
				{
					type: ApplicationCommandOptionType.String,
					name: "option4",
					description: "The fourth option in the poll",
					required: false,
				},
				{
					type: ApplicationCommandOptionType.String,
					name: "option5",
					description: "The fifth option in the poll",
					required: false,
				},
				{
					type: ApplicationCommandOptionType.String,
					name: "option6",
					description: "The sixth option in the poll",
					required: false,
				},
				{
					type: ApplicationCommandOptionType.String,
					name: "option7",
					description: "The seventh option in the poll",
					required: false,
				},
				{
					type: ApplicationCommandOptionType.String,
					name: "option8",
					description: "The eighth option in the poll",
					required: false,
				},
			],
		},
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: "end",
			description: "End a poll given its message ID",
			options: [
				{
					type: ApplicationCommandOptionType.String,
					name: "message_id",
					description: "The ID of the message containing the poll",
					required: true,
					minLength: 18,
					maxLength: 19,
				},
				{
					type: ApplicationCommandOptionType.Channel,
					name: "channel",
					description: "The channel the poll was posted in, if not the current one",
					required: false,
				},
			],
		},
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: "show",
			description: "Shows the current results of a poll without ending it. Only available to the creator of the poll",
			options: [
				{
					type: ApplicationCommandOptionType.String,
					name: "message_id",
					description: "The ID of the message containing the poll",
					required: true,
					minLength: 18,
					maxLength: 19,
				},
				{
					type: ApplicationCommandOptionType.Channel,
					name: "channel",
					description: "The channel the poll was posted in, if not the current one",
					channelTypes: [
						ChannelType.GuildText,
						ChannelType.GuildVoice,
						ChannelType.GuildNews,
						ChannelType.GuildNewsThread,
						ChannelType.GuildPublicThread,
						ChannelType.GuildPrivateThread,
					],
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
				embed = new EmbedBuilder({
					color: Colors.Blurple,
					title: question,
					description: `${
						discordEndTimestamp ? `This poll will end on <t:${discordEndTimestamp}:F> (<t:${discordEndTimestamp}:R>)\n\n` : ""
					}${options.map((o, i) => `${numberEmojis[i + 1]} ${o.value}`).join("\n\n")}`,
					footer: { text: `Poll by ${interaction.user.tag}`, iconURL: interaction.member.displayAvatarURL({ extension: "png" }) },
					timestamp: Date.now(),
				}),
				buttons = options.map((o, i) => new ButtonBuilder({ customId: o.name, emoji: numberEmojis[i + 1], style: ButtonStyle.Secondary })),
				// Try to split buttons evenly across the rows
				components = splitArray(buttons, buttons.length <= 5 ? 5 : Math.ceil(buttons.length / 2)),
				msg = await interaction.channel!.send({
					content:
						interaction.member.roles.cache.has(ids.roles.admin) && interaction.channelId === ids.channels.polls
							? `<@&${ids.roles.polls}>`
							: "",
					embeds: [embed],
					components: components.map(b => new ActionRowBuilder<ButtonBuilder>({ components: b })),
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
						? ` ${getString("endPost", {
								variables: { fullTime: `<t:${discordEndTimestamp}:F>`, relativeTime: `<t:${discordEndTimestamp}:R>` },
						  })}`
						: ""
				}`,
			)
			if (endTimestamp) awaitPoll(dbData)
		} else if (subcommand === "end") {
			const messageId = interaction.options.getString("message_id", true),
				channel = (interaction.options.getChannel("channel", false) ?? interaction.channel) as GuildTextBasedChannel,
				collection = db.collection<Poll>("polls"),
				message = await channel.messages.fetch(messageId).catch(() => null)
			if (!message) return void (await interaction.editReply(getString("noMessageId")))
			const pollDb = await collection.findOne({ messageId, channelId: channel.id })
			if (!pollDb) return void (await interaction.editReply(getString("noPoll")))
			let buttonInt: ButtonInteraction | null = null
			if (pollDb.endTimestamp) {
				const discordEndTimestamp = Math.round(pollDb.endTimestamp / 1000),
					embed = new EmbedBuilder({
						color: colors.error,
						title: getString("endingWarning"),
						description: getString("endingWarningDesc", {
							variables: { fullTime: `<t:${discordEndTimestamp}:F>`, relativeTime: `<t:${discordEndTimestamp}:R>` },
						}),
					}),
					buttons = new ActionRowBuilder<ButtonBuilder>({
						components: [
							new ButtonBuilder({
								customId: "confirm",
								style: ButtonStyle.Success,
								emoji: "✅",
								label: getString("pagination.confirm", { file: "global" }),
							}),
							new ButtonBuilder({
								customId: "cancel",
								style: ButtonStyle.Danger,
								emoji: "❌",
								label: getString("pagination.cancel", { file: "global" }),
							}),
						],
					}),
					msg = await interaction.editReply({ embeds: [embed], components: [buttons] }),
					buttonInteraction = await msg
						.awaitMessageComponent<ComponentType.Button>({
							time: 60_000,
							filter: int => int.user.id === interaction.user.id,
						})
						.catch(async () => {
							const cancelEmbed = new EmbedBuilder({
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
					const successEmbed = new EmbedBuilder({
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
				embed = new EmbedBuilder({
					color: Colors.Blurple,
					title: pollDb.question,
					description: totalVoteCount
						? `A total of ${totalVoteCount} ${totalVoteCount === 1 ? "person" : "people"} voted on this poll!`
						: "Unfortunately, no one voted on this poll",
					fields: pollDb.options.map(o => ({
						name: o.text,
						// Make sure to account for NaN values
						value: `${generateProgressBar(o.votes.length, totalVoteCount)} ${
							Math.round((o.votes.length / totalVoteCount) * 100) || 0
						}% (**${o.votes.length} votes**)`,
					})),
					footer: { text: "Poll results • Created at" },
					timestamp: new ObjectId(pollDb._id).getTimestamp().getTime(),
				}),
				msg = await interaction.channel!.send({
					embeds: [embed],
					content: `<@${pollDb.authorId}> your poll just ended. Check out the results below!`,
				}),
				linkButton = new ActionRowBuilder<ButtonBuilder>({
					components: [new ButtonBuilder({ style: ButtonStyle.Link, url: msg.url, label: "See results" })],
				})
			await collection.updateOne({ messageId, channelId: channel.id }, { $set: { ended: true } })
			await message.edit({ content: "This poll has ended!", components: [linkButton] })
			await (buttonInt ?? interaction).editReply({ content: getString("successEnd"), embeds: [], components: [] })
		} else if (subcommand === "show") {
			const messageId = interaction.options.getString("message_id", true),
				channel = (interaction.options.getChannel("channel", false) ?? interaction.channel) as GuildTextBasedChannel,
				message = await channel.messages.fetch(messageId).catch(() => null)
			if (!message) return void (await interaction.editReply(getString("noMessageId")))
			const pollDb = await db.collection<Poll>("polls").findOne({ messageId, channelId: channel.id })
			if (!pollDb) return void (await interaction.editReply(getString("noPoll")))
			if (pollDb.authorId !== interaction.user.id && !interaction.member.roles.cache.has(ids.roles.admin))
				return void (await interaction.editReply(getString("errorNotOwner")))
			const totalVoteCount = pollDb.options.reduce((acc, o) => acc + o.votes.length, 0),
				embed = new EmbedBuilder({
					color: Colors.Blurple,
					title: pollDb.question,
					description: `**${getString("totalVotes")}**: ${totalVoteCount}\n**${getString("createdOn")}**: <t:${Math.round(
						new ObjectId(pollDb._id).getTimestamp().getTime() / 1000,
					)}:F>${pollDb.endTimestamp ? `\n**${getString("endingOn")}**: <t:${Math.round(pollDb.endTimestamp / 1000)}:F>` : ""}`,
					fields: pollDb.options.map(o => ({
						name: o.text,
						// Make sure to account for NaN values
						value: `${generateProgressBar(o.votes.length, totalVoteCount)} ${
							Math.round((o.votes.length / totalVoteCount) * 100) || 0
						}% (**${getString("voteCount", { variables: { number: o.votes.length } })}**)`,
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
