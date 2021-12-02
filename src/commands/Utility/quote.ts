import { CommandInteraction, GuildMember, MessageEmbed, TextChannel } from "discord.js"
import { colors, ids } from "../../config.json"
import { db } from "../../lib/dbclient"
import { generateTip, Quote } from "../../lib/util"

import type { Collection } from "mongodb"
import type { Command, GetStringFunction } from "../../lib/imports"

const command: Command = {
	name: "quote",
	description: "Gets (or adds) a funny/weird/wise quote from the server.",
	options: [{
		type: "SUB_COMMAND",
		name: "get",
		description: "Get a random/specific quote",
		options: [{
			type: "INTEGER",
			name: "index",
			description: "The index of the quote you want to see",
			required: false,
			autocomplete: true
		}]
	},
	{
		type: "SUB_COMMAND",
		name: "add",
		description: "Adds a new quote. Staff only",
		options: [{
			type: "STRING",
			name: "quote",
			description: "The quote you want to add",
			required: true
		},
		{
			type: "USER",
			name: "author",
			description: "The author of this quote",
			required: true
		},
		{
			type: "STRING",
			name: "url",
			description: "The url of the message this quote came from. If the message has an image it will be included as well",
			required: false
		},
		{
			type: "STRING",
			name: "image",
			description: "The url of the image to be included with this quote. Has priority over url's image if provided",
			required: false
		}]
	},
	{
		type: "SUB_COMMAND",
		name: "edit",
		description: "Edits a quote. Staff only",
		options: [{
			type: "INTEGER",
			name: "index",
			description: "The index of the quote to edit",
			required: true,
			autocomplete: true
		},
		{
			type: "STRING",
			name: "quote",
			description: "The new quote",
			required: true
		}]
	},
	{
		type: "SUB_COMMAND",
		name: "delete",
		description: "Deletes a quote. Staff only",
		options: [{
			type: "INTEGER",
			name: "index",
			description: "The index of the quote to delete",
			required: true,
			autocomplete: true
		}]
	},
	{
		type: "SUB_COMMAND",
		name: "link",
		description: "Links a quote to a message. Staff only",
		options: [{
			type: "INTEGER",
			name: "index",
			description: "The index of the quote to link",
			required: true,
			autocomplete: true
		},
		{
			type: "STRING",
			name: "url",
			description: "The URL of the message to link this quote to",
			required: true
		},
		{
			type: "BOOLEAN",
			name: "image",
			description: "Whether or not to attach this message's image to the quote.",
			required: false
		}]
	}],
	cooldown: 5,
	allowDM: true,
	channelWhitelist: [ids.channels.bots, ids.channels.staffBots, ids.channels.botDev],
	async execute(interaction, getString: GetStringFunction) {
		const randomTip = generateTip(getString),
			collection = db.collection<Quote>("quotes"),
			subCommand = interaction.options.getSubcommand()
		let allowed = false
		if ((interaction.member as GuildMember | null)?.permissions.has("VIEW_AUDIT_LOG")) allowed = true
		if (subCommand === "add" && allowed) await addQuote(interaction, collection)
		else if (subCommand === "edit" && allowed) await editQuote(interaction, collection)
		else if (subCommand === "delete" && allowed) await deleteQuote(interaction, collection)
		else if (subCommand === "link" && allowed) await linkQuote(interaction, collection)
		else if (subCommand === "get") await findQuote(randomTip, interaction, getString, collection)
		else await interaction.reply({ content: getString("errors.noAccess", "global"), ephemeral: true })
	}
}

async function findQuote(randomTip: string, interaction: CommandInteraction, getString: GetStringFunction, collection: Collection<Quote>) {

	const count = await collection.estimatedDocumentCount()

	let quoteId = interaction.options.getInteger("index", false)
	quoteId ??= Math.ceil(Math.random() * Math.floor(count)) //generate random id if no arg is given

	const quote = await collection.findOne({ id: quoteId })
	if (!quote) {
		const embed = new MessageEmbed()
			.setColor(colors.error)
			.setAuthor(getString("moduleName"))
			.setTitle(getString("invalidArg"))
			.setDescription(getString("indexArg", { arg: quoteId!, max: count }))
			.setFooter(randomTip, ((interaction.member as GuildMember | null) ?? interaction.user).displayAvatarURL({ format: "png", dynamic: true }))
		return await interaction.reply({ embeds: [embed], ephemeral: true })
	}
	console.log(`Quote with ID ${quoteId} was requested`)
	const author = await Promise.all(quote.author.map(async a => interaction.guild!.members.cache.get(a)?.toString() ?? (await interaction.client.users.fetch(a)).tag)),
		embed = new MessageEmbed()
			.setColor(colors.success)
			.setAuthor(getString("moduleName"))
			.setTitle(quote.quote)
			.setDescription(`      - ${author.join(" and ")}`)
			.setFooter(randomTip, ((interaction.member as GuildMember | null) ?? interaction.user).displayAvatarURL({ format: "png", dynamic: true }))
	if (quote.imageURL) embed.setImage(quote.imageURL)
	if (quote.url) embed.addField(getString("msgUrl"), quote.url)
	return await interaction.reply({ embeds: [embed] })
}

async function addQuote(interaction: CommandInteraction, collection: Collection<Quote>) {

	const quoteId = (await collection.estimatedDocumentCount()) + 1,
		quote = interaction.options.getString("quote", true),
		author = interaction.options.getUser("author", true),
		url = interaction.options.getString("url", false),
		urlSplit = url?.split("/")

	let pictureUrl = interaction.options.getString("image", false)

	if (urlSplit) {
		if (urlSplit.length === 7) {
			(interaction.client.channels.cache.get(urlSplit[5]) as TextChannel | undefined)?.messages.fetch(urlSplit[6])
				.then(async msg => {
					if (msg.attachments.size > 0) pictureUrl ??= msg.attachments.first()!.url
					const embed = new MessageEmbed()
						.setColor(colors.success)
						.setAuthor("Quote")
						.setTitle("Success! The following quote has been added:")
						.setDescription(quote)
						.addFields(
							{ name: "User", value: `${author}` },
							{ name: "Quote number", value: `${quoteId}` },
							{ name: "URL", value: url! }
						)
						.setFooter(generateTip(), ((interaction.member as GuildMember | null) ?? interaction.user).displayAvatarURL({ format: "png", dynamic: true }))
					if (pictureUrl) {
						embed.setImage(pictureUrl)
						await collection.insertOne({ id: quoteId, quote: quote, author: [author.id], url: url!, imageURL: pictureUrl })
					} else await collection.insertOne({ id: quoteId, quote: quote, author: [author.id], url: url! })
					await interaction.reply({ embeds: [embed] })
				})
				.catch(async () => {
					const embed = new MessageEmbed()
						.setColor(colors.error)
						.setAuthor("Quote")
						.setTitle("Couldn't find a message linked to that URL!")
						.setDescription("Make sure you obtained it by coping the message URL directly and that I have permission to see that message.")
						.setFooter(generateTip(), ((interaction.member as GuildMember | null) ?? interaction.user).displayAvatarURL({ format: "png", dynamic: true }))
					await interaction.reply({ embeds: [embed], ephemeral: true })
				})
		} else {
			const embed = new MessageEmbed()
				.setColor(colors.error)
				.setAuthor("Quote")
				.setTitle("Provided URL isn't a valid message URL!")
				.setFooter(generateTip(), ((interaction.member as GuildMember | null) ?? interaction.user).displayAvatarURL({ format: "png", dynamic: true }))
			return await interaction.reply({ embeds: [embed], ephemeral: true })
		}
	} else {
		const embed = new MessageEmbed()
			.setColor(colors.success)
			.setAuthor("Quote")
			.setTitle("Success! The following quote has been added:")
			.setDescription(quote)
			.addFields({ name: "User", value: `${author}` }, { name: "Quote number", value: `${quoteId}` })
			.setFooter(generateTip(), ((interaction.member as GuildMember | null) ?? interaction.user).displayAvatarURL({ format: "png", dynamic: true }))
		if (pictureUrl) {
			embed.setImage(pictureUrl)
			await collection.insertOne({ id: quoteId, quote: quote, author: [author.id], imageURL: pictureUrl })
		} else await collection.insertOne({ id: quoteId, quote: quote, author: [author.id] })
		await interaction.reply({ embeds: [embed] })
	}
}

async function editQuote(interaction: CommandInteraction, collection: Collection<Quote>) {

	const quoteId = interaction.options.getInteger("index", true),
		newQuote = interaction.options.getString("quote", true)
	if (!quoteId) throw "noQuote"
	const result = await collection.findOneAndUpdate({ id: quoteId }, { $set: { quote: newQuote } })
	if (result.value) {
		const author = await Promise.all(result.value.author.map(async a => await interaction.client.users.fetch(a))),
			embed = new MessageEmbed()
				.setColor(colors.success)
				.setAuthor("Quote")
				.setTitle(`Successfully edited quote #${quoteId}`)
				.addFields(
					{ name: "Old quote", value: result.value.quote },
					{ name: "New quote", value: newQuote },
					{ name: "Author", value: author.join(" and ") },
					{ name: "Link", value: result.value.url ?? "None" }
				)
				.setFooter(generateTip(), ((interaction.member as GuildMember | null) ?? interaction.user).displayAvatarURL({ format: "png", dynamic: true }))
		if (result.value.imageURL) embed.setImage(result.value.imageURL)
		await interaction.reply({ embeds: [embed] })
	} else {
		const embed = new MessageEmbed()
			.setColor(colors.error)
			.setAuthor("Quote")
			.setTitle("Couldn't find a quote with that ID!")
			.setFooter(generateTip(), ((interaction.member as GuildMember | null) ?? interaction.user).displayAvatarURL({ format: "png", dynamic: true }))
		await interaction.reply({ embeds: [embed], ephemeral: true })
	}
}

async function deleteQuote(interaction: CommandInteraction, collection: Collection<Quote>) {

	const quoteId = interaction.options.getInteger("index", true)
	if (quoteId <= 0) throw "noQuote"
	const result = await collection.findOneAndDelete({ id: quoteId })
	if (result.value) {
		const author = await Promise.all(result.value.author.map(async a => await interaction.client.users.fetch(a)))
		await collection.updateMany({ id: { $gt: quoteId } }, { $inc: { id: -1 } })
		const embed = new MessageEmbed()
			.setColor(colors.success)
			.setAuthor("Quote")
			.setTitle(`Successfully deleted quote #${quoteId}`)
			.addFields(
				{ name: "Author", value: author.join(" and ") },
				{ name: "Quote", value: result.value.quote },
				{ name: "Link", value: result.value.url ?? "None" }
			)
			.setFooter(generateTip(), ((interaction.member as GuildMember | null) ?? interaction.user).displayAvatarURL({ format: "png", dynamic: true }))
		if (result.value.imageURL) embed.setImage(result.value.imageURL)
		await interaction.reply({ embeds: [embed] })
	} else {
		const embed = new MessageEmbed()
			.setColor(colors.error)
			.setAuthor("Quote")
			.setTitle("Couldn't find a quote with that ID!")
			.setFooter(generateTip(), ((interaction.member as GuildMember | null) ?? interaction.user).displayAvatarURL({ format: "png", dynamic: true }))
		await interaction.reply({ embeds: [embed], ephemeral: true })
	}
}

async function linkQuote(interaction: CommandInteraction, collection: Collection<Quote>) {
	const quoteId = interaction.options.getInteger("index", true),
		urlSplit = interaction.options.getString("url", true).split("/"),
		linkAttch = interaction.options.getBoolean("attachment", false);
	(interaction.client.channels.cache.get(urlSplit[5]) as TextChannel | undefined)?.messages.fetch(urlSplit[6])
		.then(async msg => {
			const firstAttachment = msg.attachments.first()?.url
			let result
			if (linkAttch && firstAttachment) result = await collection.findOneAndUpdate({ id: quoteId }, { $set: { url: msg.url, imageURL: firstAttachment } })
			else result = await collection.findOneAndUpdate({ id: quoteId }, { $set: { url: msg.url } })
			if (result.value) {
				const author = await Promise.all(result.value.author.map(a => interaction.client.users.fetch(a))),
					embed = new MessageEmbed()
						.setColor(colors.success)
						.setAuthor("Quote")
						.setTitle(`Successfully linked quote #${quoteId}`)
						.addFields(
							{ name: "Old URL", value: result.value.url ?? "None" },
							{ name: "New URL", value: msg.url },
							{ name: "Quote", value: result.value.quote },
							{ name: "Author", value: author.join(" and ") }
						)
						.setFooter(
							generateTip(),
							((interaction.member as GuildMember | null) ?? interaction.user).displayAvatarURL({ format: "png", dynamic: true })
						)
				if (linkAttch && firstAttachment) embed.setImage(firstAttachment)
				else if (result.value.imageURL) embed.setImage(result.value.imageURL)
				await interaction.reply({ embeds: [embed] })
			} else {
				const embed = new MessageEmbed()
					.setColor(colors.error)
					.setAuthor("Quote")
					.setTitle("Couldn't find a quote with that ID!")
					.setFooter(
						generateTip(),
						((interaction.member as GuildMember | null) ?? interaction.user).displayAvatarURL({ format: "png", dynamic: true })
					)
				await interaction.reply({ embeds: [embed], ephemeral: true })
			}
		})
		.catch(async () => {
			const embed = new MessageEmbed()
				.setColor(colors.error)
				.setAuthor("Quote")
				.setTitle("Couldn't find a message linked to that URL!")
				.setDescription("Make sure you obtained it by coping the message URL directly and that I have permission to see that message.")
				.setFooter(generateTip(), ((interaction.member as GuildMember | null) ?? interaction.user).displayAvatarURL({ format: "png", dynamic: true }))
			await interaction.reply({ embeds: [embed], ephemeral: true })
		})
}

export default command
