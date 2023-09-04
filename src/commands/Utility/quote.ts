import {
	type ChatInputCommandInteraction,
	type GuildMember,
	EmbedBuilder,
	type TextChannel,
	ApplicationCommandOptionType,
} from "discord.js"

import { colors, ids } from "../../config.json"
import { db } from "../../lib/dbclient"
import { generateTip, type Quote } from "../../lib/util"

import type { Command, GetStringFunction } from "../../lib/imports"
import type { Collection } from "mongodb"

const command: Command = {
	name: "quote",
	description: "Shows a funny/weird/wise quote from the server",
	options: [
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: "get",
			description: "Get a random/specific quote",
			options: [
				{
					type: ApplicationCommandOptionType.Integer,
					name: "index",
					description: "The index of the quote you want to see",
					required: false,
					autocomplete: true,
				},
			],
		},
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: "add",
			description: "Adds a new quote. Staff only",
			options: [
				{
					type: ApplicationCommandOptionType.String,
					name: "quote",
					description: "The quote you want to add",
					required: true,
				},
				{
					type: ApplicationCommandOptionType.User,
					name: "author",
					description: "The author of this quote",
					required: true,
				},
				{
					type: ApplicationCommandOptionType.String,
					name: "url",
					description: "The URL of the message this quote came from. If the message has an image it will be included as well",
					required: false,
					// Minimum length of a Discord message URL
					minLength: 85,
					// Maximum length of a Discord Canary message URL
					maxLength: 95,
				},
				{
					type: ApplicationCommandOptionType.Attachment,
					name: "image",
					description: "The image to be included with this quote. Has priority over url's image if provided",
					required: false,
				},
			],
		},
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: "edit",
			description: "Edits a quote. Staff only",
			options: [
				{
					type: ApplicationCommandOptionType.Integer,
					name: "index",
					description: "The index of the quote to edit",
					required: true,
					autocomplete: true,
				},
				{
					type: ApplicationCommandOptionType.String,
					name: "quote",
					description: "The new quote",
					required: true,
				},
			],
		},
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: "delete",
			description: "Deletes a quote. Staff only",
			options: [
				{
					type: ApplicationCommandOptionType.Integer,
					name: "index",
					description: "The index of the quote to delete",
					required: true,
					autocomplete: true,
				},
			],
		},
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: "link",
			description: "Links a quote to a message. Staff only",
			options: [
				{
					type: ApplicationCommandOptionType.Integer,
					name: "index",
					description: "The index of the quote to link",
					required: true,
					autocomplete: true,
				},
				{
					type: ApplicationCommandOptionType.String,
					name: "url",
					description: "The URL of the message to link this quote to",
					required: true,
					// Minimum length of a Discord message URL
					minLength: 85,
					// Maximum length of a Discord Canary message URL
					maxLength: 95,
				},
				{
					type: ApplicationCommandOptionType.Boolean,
					name: "image",
					description: "Whether or not to attach this message's image to the quote",
					required: false,
				},
			],
		},
	],
	cooldown: 5,
	allowDM: true,
	channelWhitelist: [ids.channels.bots, ids.channels.staffBots, ids.channels.botDev],
	async execute(interaction, getString: GetStringFunction) {
		const collection = db.collection<Quote>("quotes"),
			subCommand = interaction.options.getSubcommand()
		let allowed = false
		if ((interaction.member as GuildMember | null)?.permissions.has("ViewAuditLog")) allowed = true
		if (subCommand === "add" && allowed) await addQuote(interaction, collection)
		else if (subCommand === "edit" && allowed) await editQuote(interaction, collection)
		else if (subCommand === "delete" && allowed) await deleteQuote(interaction, collection)
		else if (subCommand === "link" && allowed) await linkQuote(interaction, collection)
		else if (subCommand === "get") await findQuote(generateTip(getString), interaction, getString, collection)
		else await interaction.reply({ content: getString("errors.noAccess", { file: "global" }), ephemeral: true })
	},
}

async function findQuote(
	randomTip: string,
	interaction: ChatInputCommandInteraction,
	getString: GetStringFunction,
	collection: Collection<Quote>
) {
	const count = await collection.estimatedDocumentCount()

	let quoteId = interaction.options.getInteger("index", false)
	quoteId ??= Math.ceil(Math.random() * Math.floor(count)) // Generate random id if no arg is given

	const quote = await collection.findOne({ id: quoteId })
	if (!quote) {
		const embed = new EmbedBuilder({
			color: colors.error,
			author: { name: getString("moduleName") },
			title: getString("invalidArg"),
			description: getString("indexArg", { variables: { arg: quoteId!, max: count } }),
			footer: {
				text: randomTip,
				iconURL: ((interaction.member as GuildMember | null) ?? interaction.user).displayAvatarURL({ extension: "png" }),
			},
		})
		return await interaction.reply({ embeds: [embed], ephemeral: true })
	}
	console.log(`Quote with ID ${quoteId} was requested`)
	const author = await Promise.all(
			quote.author.map(
				a =>
					interaction.guild!.members.cache.get(a)?.toString() ??
					interaction.client.users
						.fetch(a)
						.then(u => u.tag)
						.catch(() => "Deleted User#0000")
			)
		),
		embed = new EmbedBuilder({
			color: colors.success,
			author: { name: getString("moduleName") },
			title: quote.quote,
			description: `      - ${author.join(" and ")}`,
			footer: {
				text: randomTip,
				iconURL: ((interaction.member as GuildMember | null) ?? interaction.user).displayAvatarURL({ extension: "png" }),
			},
		})
	if (quote.imageURL) embed.setImage(quote.imageURL)
	if (quote.url) embed.addFields({ name: getString("msgUrl"), value: quote.url })
	return await interaction.reply({ embeds: [embed] })
}

async function addQuote(interaction: ChatInputCommandInteraction, collection: Collection<Quote>) {
	const quoteId = (await collection.estimatedDocumentCount()) + 1,
		quote = interaction.options.getString("quote", true),
		author = interaction.options.getUser("author", true),
		urlSplit = interaction.options.getString("url", false)?.split("/")

	let picture = interaction.options.getAttachment("image", false)

	if (urlSplit) {
		if (urlSplit.length === 7) {
			const msg = await (interaction.client.channels.cache.get(urlSplit[5]) as TextChannel | undefined)?.messages
				.fetch(urlSplit[6])
				.catch(() => null)
			if (!msg) {
				const embed = new EmbedBuilder({
					color: colors.error,
					author: { name: "Quote" },
					title: "Couldn't find a message linked to that URL!",
					description: "Make sure you obtained it by coping the message URL directly and that I have permission to see that message.",
					footer: {
						text: generateTip(),
						iconURL: ((interaction.member as GuildMember | null) ?? interaction.user).displayAvatarURL({ extension: "png" }),
					},
				})
				return await interaction.reply({ embeds: [embed], ephemeral: true })
			}
			if (msg.attachments.size > 0) picture ??= msg.attachments.first()!
			const embed = new EmbedBuilder({
				color: colors.success,
				author: { name: "Quote" },
				title: "Success! The following quote has been added:",
				description: quote,
				fields: [
					{ name: "User", value: `${author}` },
					{ name: "Quote number", value: `${quoteId}` },
					{ name: "URL", value: msg.url },
				],
				footer: {
					text: generateTip(),
					iconURL: ((interaction.member as GuildMember | null) ?? interaction.user).displayAvatarURL({ extension: "png" }),
				},
			})
			if (picture) {
				embed.setImage(picture.url)
				await collection.insertOne({ id: quoteId, quote: quote, author: [author.id], url: msg.url, imageURL: picture.url })
			} else await collection.insertOne({ id: quoteId, quote: quote, author: [author.id], url: msg.url })
			await interaction.reply({ embeds: [embed] })
		} else {
			const embed = new EmbedBuilder({
				color: colors.error,
				author: { name: "Quote" },
				title: "Provided URL isn't a valid message URL!",
				footer: {
					text: generateTip(),
					iconURL: ((interaction.member as GuildMember | null) ?? interaction.user).displayAvatarURL({ extension: "png" }),
				},
			})
			return await interaction.reply({ embeds: [embed], ephemeral: true })
		}
	} else {
		const embed = new EmbedBuilder({
			color: colors.success,
			author: { name: "Quote" },
			title: "Success! The following quote has been added:",
			description: quote,
			fields: [
				{ name: "User", value: `${author}` },
				{ name: "Quote number", value: `${quoteId}` },
			],
			footer: {
				text: generateTip(),
				iconURL: ((interaction.member as GuildMember | null) ?? interaction.user).displayAvatarURL({ extension: "png" }),
			},
		})
		if (picture) {
			embed.setImage(picture.url)
			await collection.insertOne({ id: quoteId, quote: quote, author: [author.id], imageURL: picture.url })
		} else await collection.insertOne({ id: quoteId, quote: quote, author: [author.id] })
		await interaction.reply({ embeds: [embed] })
	}
}

async function editQuote(interaction: ChatInputCommandInteraction, collection: Collection<Quote>) {
	const quoteId = interaction.options.getInteger("index", true),
		newQuote = interaction.options.getString("quote", true)
	if (!quoteId) throw "noQuote"
	const result = await collection.findOneAndUpdate({ id: quoteId }, { $set: { quote: newQuote } })
	if (result) {
		const author = await Promise.all(
				result.author.map(
					a =>
						interaction.guild!.members.cache.get(a)?.toString() ??
						interaction.client.users
							.fetch(a)
							.then(u => u.tag)
							.catch(() => "Deleted User#0000")
				)
			),
			embed = new EmbedBuilder({
				color: colors.success,
				author: { name: "Quote" },
				title: `Successfully edited quote #${quoteId}`,
				fields: [
					{ name: "Old quote", value: result.quote },
					{ name: "New quote", value: newQuote },
					{ name: "Author", value: author.join(" and ") },
					{ name: "Link", value: result.url ?? "None" },
				],
				footer: {
					text: generateTip(),
					iconURL: ((interaction.member as GuildMember | null) ?? interaction.user).displayAvatarURL({ extension: "png" }),
				},
			})
		if (result.imageURL) embed.setImage(result.imageURL)
		await interaction.reply({ embeds: [embed] })
	} else {
		const embed = new EmbedBuilder({
			color: colors.error,
			author: { name: "Quote" },
			title: "Couldn't find a quote with that ID!",
			footer: {
				text: generateTip(),
				iconURL: ((interaction.member as GuildMember | null) ?? interaction.user).displayAvatarURL({ extension: "png" }),
			},
		})
		await interaction.reply({ embeds: [embed], ephemeral: true })
	}
}

async function deleteQuote(interaction: ChatInputCommandInteraction, collection: Collection<Quote>) {
	const quoteId = interaction.options.getInteger("index", true)
	if (quoteId <= 0) throw "noQuote"
	const result = await collection.findOneAndDelete({ id: quoteId })
	if (result) {
		const author = await Promise.all(
			result.author.map(
				a =>
					interaction.guild!.members.cache.get(a)?.toString() ??
					interaction.client.users
						.fetch(a)
						.then(u => u.tag)
						.catch(() => "Deleted User#0000")
			)
		)
		await collection.updateMany({ id: { $gt: quoteId } }, { $inc: { id: -1 } })
		if (result.url) {
			const urlSplit = result.quote.split("/")
			// Remove all reactions from the message
			await (interaction.client.channels.cache.get(urlSplit.at(-2)!) as TextChannel).messages.cache
				.get(urlSplit.at(-1)!)
				?.reactions.cache.get("⭐")
				?.remove()
		}
		const embed = new EmbedBuilder({
			color: colors.success,
			author: { name: "Quote" },
			title: `Successfully deleted quote #${quoteId}`,
			fields: [
				{ name: "Author", value: author.join(" and ") },
				{ name: "Quote", value: result.quote },
				{ name: "Link", value: result.url ?? "None" },
			],
			footer: {
				text: generateTip(),
				iconURL: ((interaction.member as GuildMember | null) ?? interaction.user).displayAvatarURL({ extension: "png" }),
			},
		})
		if (result.imageURL) embed.setImage(result.imageURL)
		await interaction.reply({ embeds: [embed] })
	} else {
		const embed = new EmbedBuilder({
			color: colors.error,
			author: { name: "Quote" },
			title: "Couldn't find a quote with that ID!",
			footer: {
				text: generateTip(),
				iconURL: ((interaction.member as GuildMember | null) ?? interaction.user).displayAvatarURL({ extension: "png" }),
			},
		})
		await interaction.reply({ embeds: [embed], ephemeral: true })
	}
}

async function linkQuote(interaction: ChatInputCommandInteraction, collection: Collection<Quote>) {
	const quoteId = interaction.options.getInteger("index", true),
		urlSplit = interaction.options.getString("url", true).split("/"),
		linkAttch = interaction.options.getBoolean("image", false),
		msg = await (interaction.client.channels.cache.get(urlSplit[5]) as TextChannel | undefined)?.messages
			.fetch(urlSplit[6])
			.catch(() => null)
	if (!msg) {
		const embed = new EmbedBuilder({
			color: colors.error,
			author: { name: "Quote" },
			title: "Couldn't find a message linked to that URL!",
			description: "Make sure you obtained it by coping the message URL directly and that I have permission to see that message.",
			footer: {
				text: generateTip(),
				iconURL: ((interaction.member as GuildMember | null) ?? interaction.user).displayAvatarURL({ extension: "png" }),
			},
		})
		return await interaction.reply({ embeds: [embed], ephemeral: true })
	}
	const firstAttachment = msg.attachments.first()?.url
	let result
	if (linkAttch && firstAttachment)
		result = await collection.findOneAndUpdate({ id: quoteId }, { $set: { url: msg.url, imageURL: firstAttachment } })
	else result = await collection.findOneAndUpdate({ id: quoteId }, { $set: { url: msg.url } })
	if (result) {
		const author = await Promise.all(
				result.author.map(
					a =>
						interaction.guild!.members.cache.get(a)?.toString() ??
						interaction.client.users
							.fetch(a)
							.then(u => u.tag)
							.catch(() => "Deleted User#0000")
				)
			),
			embed = new EmbedBuilder({
				color: colors.success,
				author: { name: "Quote" },
				title: `Successfully linked quote #${quoteId}`,
				fields: [
					{ name: "Old URL", value: result.url ?? "None" },
					{ name: "New URL", value: msg.url },
					{ name: "Quote", value: result.quote },
					{ name: "Author", value: author.join(" and ") },
				],
				footer: {
					text: generateTip(),
					iconURL: ((interaction.member as GuildMember | null) ?? interaction.user).displayAvatarURL({ extension: "png" }),
				},
			})
		if (linkAttch && firstAttachment) embed.setImage(firstAttachment)
		else if (result.imageURL) embed.setImage(result.imageURL)
		await interaction.reply({ embeds: [embed] })
	} else {
		const embed = new EmbedBuilder({
			color: colors.error,
			author: { name: "Quote" },
			title: "Couldn't find a quote with that ID!",
			footer: {
				text: generateTip(),
				iconURL: ((interaction.member as GuildMember | null) ?? interaction.user).displayAvatarURL({ extension: "png" }),
			},
		})
		await interaction.reply({ embeds: [embed], ephemeral: true })
	}
}

export default command
