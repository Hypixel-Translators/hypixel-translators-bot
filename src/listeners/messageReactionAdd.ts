import { setTimeout } from "node:timers/promises"

import { EmbedBuilder, ThreadChannel } from "discord.js"

import { colors, ids } from "../config.json"
import { client } from "../index"
import { db, cancelledEvents } from "../lib/dbclient"

import type { MongoLanguage, Quote, Stats } from "../lib/util"

client.on("messageReactionAdd", async (reaction, user) => {
	if (!db) return void cancelledEvents.push({ listener: "messageReactionAdd", args: [reaction, user] })

	const { channel } = reaction.message,
		statsColl = db.collection<Stats>("stats")
	if (channel instanceof ThreadChannel || channel.isDMBased() || user.bot) return
	if (reaction.partial) reaction = await reaction.fetch()
	if (reaction.message.partial) reaction.message = await reaction.message.fetch()
	if (user.partial) user = await user.fetch()
	const member = client.guilds.cache.get(ids.guilds.main)!.members.cache.get(user.id)!
	// Delete message when channel name ends with review-strings
	if (
		channel.name.endsWith("-review-strings") &&
		/https:\/\/crowdin\.com\/translate\/\w+\/(?:\d+|all)\/en(?:-\w+)?(?:\?[\w\d%&=$_.+!*'()-]*)?#\d+/gi.test(reaction.message.content!)
	) {
		const language = await db.collection<MongoLanguage>("languages").findOne({ code: channel.name.split("-")[0] }),
			role = channel.guild!.roles.cache.find(r => r.name === `${language!.name} Proofreader`),
			reactedToOwn = reaction.message.author.bot ? reaction.message.content.includes(user.id) : reaction.message.author.id === user.id

		if (!role) return console.error(`Couldn't find the proofreader role for the ${channel} channel!`)
		if (reaction.message.guild!.members.resolve(user.id)!.roles.cache.has(role.id)) {
			let strings: { [key: string]: string }
			try {
				strings = require(`../../strings/${channel.name.split("-")[0]}/reviewStrings.json`)
			} catch {
				strings = require("../../strings/en/reviewStrings.json")
			}
			if (reactedToOwn) await reaction.users.remove(user.id)
			else if (reaction.emoji.name === "vote_yes") {
				await reaction.message.react("⏱")
				await setTimeout(10_000)
				// Check if the user hasn't removed their reaction
				if ((await reaction.users.fetch()).has(user.id)) {
					if (reaction.message.thread) {
						// I cannot stress how stupid this is, but it won't work otherwise
						if (reaction.message.thread.archived) await reaction.message.thread.setArchived(false, "Stupid workaround to lock this thread")
						await reaction.message.thread.edit({ locked: true, archived: true }, "String reviewed")
					}
					await reaction.message.delete().catch(() => null)
					await statsColl.insertOne({ type: "STRINGS", user: user.id, name: "APPROVED" })
					console.log(`String reviewed in ${channel.name}`)
				} else await reaction.message.reactions.cache.get("⏱")?.remove()
			} else if (reaction.emoji.name === "vote_maybe") {
				await reaction.users.remove(user.id)
				const embed = new EmbedBuilder({
						color: colors.loading,
						author: { name: strings.moduleName },
						title: strings.requestDetails.replace("%%user%%", user.tag),
						description: reaction.message.content,
						fields: [{ name: strings.message, value: `[${strings.clickHere}](${reaction.message.url})` }],
						footer: {
							text: strings.requestedBy.replace("%%user%%", user.tag),
							iconURL: member.displayAvatarURL({ extension: "png" }),
						},
					}),
					stringId = reaction.message.content!.match(/(?:\?[\w\d%&=$+!*'()-]*)?#(\d+)/gi)?.[0],
					fileId = reaction.message.content!.match(/^(?:https?:\/\/)?crowdin\.com\/translate\/hypixel\/(\d+|all)\//gi)?.[0],
					thread = await reaction.message.startThread({
						name: `More details requested on ${
							stringId ? `string ${stringId}` : fileId === "all" ? "all files" : fileId ? `file ${fileId}` : "an unknown string"
						}`,
						autoArchiveDuration: 1440,
						reason: `${user.tag} requested more details`,
					})
				await thread.send({ content: `${user}${reaction.message.author.bot ? `, ${reaction.message.content.split(":")[0]}` : ""}`, embeds: [embed] })
				await statsColl.insertOne({ type: "STRINGS", user: user.id, name: "MORE_INFO" })
			} else if (reaction.emoji.name === "vote_no") {
				await reaction.message.react("⏱")
				const embed = new EmbedBuilder({
					color: colors.error,
					author: { name: strings.moduleName },
					title: strings.rejected.replace("%%user%%", user.tag),
					description: reaction.message.content,
					footer: {
						text: strings.rejectedBy.replace("%%user%%", user.tag),
						iconURL: member.displayAvatarURL({ extension: "png" }),
					},
				})
				await setTimeout(10_000)
				// Check if the user hasn't removed their reaction
				if ((await reaction.users.fetch()).has(user.id)) {
					if (reaction.message.thread) {
						// I cannot stress how stupid this is, but it won't work otherwise
						if (reaction.message.thread.archived) await reaction.message.thread.setArchived(false, "Stupid workaround to lock this thread")
						await reaction.message.thread.edit({ locked: true, archived: true }, "String rejected")
					}
					const stringId = reaction.message.content!.match(/(?:\?[\w\d%&=$+!*'()-]*)?#(\d+)/gi)?.[0],
						fileId = reaction.message.content!.match(/^(?:https?:\/\/)?crowdin\.com\/translate\/hypixel\/(\d+|all)\//gi)?.[0],
						thread = await channel.threads.create({
							name: `Change rejected on ${
								stringId ? `string ${stringId}` : fileId === "all" ? "all files" : fileId ? `file ${fileId}` : "an unknown string"
							}`,
							autoArchiveDuration: 60,
							reason: `${user.tag} rejected the change`,
						})
					await thread.send({
						content: `${reaction.message.author.bot ? reaction.message.content.split(":")[0] : reaction.message.author}, ${user}`,
						embeds: [embed],
					})
					await reaction.message.delete().catch(() => null)
					await statsColl.insertOne({ type: "STRINGS", user: user.id, name: "DENIED" })
					console.log(`String rejected in ${channel.name}`)
				} else await reaction.message.reactions.cache.get("⏱")?.remove()
			}
		} else await reaction.users.remove(user.id)
	} else if (
		// Starboard system
		reaction.emoji.name === "⭐" &&
		channel.permissionsFor(ids.roles.verified)!.has(["SendMessages", "ViewChannel"]) &&
		!reaction.message.author!.bot &&
		reaction.message.content
	) {
		if (user.id === reaction.message.author.id) await reaction.users.remove(user.id)
		if (reaction.count! >= 4) {
			const collection = db.collection<Quote>("quotes"),
				urlQuote = await collection.findOne({ url: reaction.message.url })
			if (!urlQuote) {
				const id = (await collection.estimatedDocumentCount()) + 1,
					firstAttachment = reaction.message.attachments.first()?.url

				if (firstAttachment) {
					await collection.insertOne({
						id: id,
						quote: reaction.message.content,
						author: [reaction.message.author.id],
						url: reaction.message.url,
						imageURL: firstAttachment,
					})
				} else
					await collection.insertOne({ id: id, quote: reaction.message.content, author: [reaction.message.author.id], url: reaction.message.url })
				const embed = new EmbedBuilder({
					color: colors.success,
					author: { name: "Starboard" },
					title: `The following quote reached ${reaction.count} ⭐ reactions and was added!`,
					description: reaction.message.content,
					fields: [
						{ name: "User", value: `${reaction.message.author}` },
						{ name: "Quote number", value: `${id}` },
						{ name: "URL", value: reaction.message.url },
					],
				})
				if (firstAttachment) embed.setImage(firstAttachment)
				await reaction.message.channel.send({ embeds: [embed] })
			}
		}
	}
})
