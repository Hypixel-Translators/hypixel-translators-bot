import Discord from "discord.js"
import { successColor, loadingColor, errorColor, ids } from "../config.json"
import { client } from "../index"
import { db, cancelledEvents } from "../lib/dbclient"
import type { EventDb, LangDbEntry, Quote, Stats } from "../lib/util"

client.on("messageReactionAdd", async (reaction, user) => {
	if (!db) {
		cancelledEvents.push({ listener: "messageReactionAdd", args: [reaction, user] })
		return
	}

	const channel = reaction.message.channel,
		statsColl = db.collection<Stats>("stats")
	if (channel instanceof Discord.ThreadChannel || channel.type === "DM" || user.bot) return
	if (reaction.partial) reaction = await reaction.fetch()
	if (reaction.message.partial) reaction.message = await reaction.message.fetch()
	if (user.partial) user = await user.fetch()
	const member = client.guilds.cache.get(ids.guilds.main)!.members.cache.get(user.id)!
	// Delete message when channel name ends with review-strings
	if (channel.name.endsWith("-review-strings") && /https:\/\/crowdin\.com\/translate\/\w+\/(?:\d+|all)\/en(?:-\w+)?(?:\?[\w\d%&=$_.+!*'()-]*)?#\d+/gi.test(reaction.message.content!)) {
		const language = await db.collection<LangDbEntry>("langdb").findOne({ code: channel.name.split("-")[0] }),
			role = channel.guild!.roles.cache.find(r => r.name === `${language!.name} Proofreader`)
		if (!role) return console.error(`Couldn't find the proofreader role for the ${channel} channel!`)
		if (reaction.message.guild!.members.resolve(user.id)!.roles.cache.has(role.id)) {
			let strings: { [key: string]: string }
			try {
				strings = require(`../../strings/${channel.name.split("-")[0]}/reviewStrings.json`)
			} catch {
				strings = require("../../strings/en/reviewStrings.json")
			}
			if (reaction.emoji.name === "vote_yes" && reaction.message.author!.id !== user.id) {
				await reaction.message.react("⏱")
				setTimeout(async () => {
					// Check if the user hasn't removed their reaction
					if ((await reaction.users.fetch()).has(user.id)) {
						if (reaction.message.thread) {
							// I cannot stress how stupid this is, but it won't work otherwise
							if (reaction.message.thread.archived) await reaction.message.thread.setArchived(false, "Stupid workaround to lock this thread")
							await reaction.message.thread.edit({ locked: true, archived: true }, "String reviewed")
						}
						if (!reaction.message.deleted) await reaction.message.delete()
						await statsColl.insertOne({ type: "STRINGS", user: user.id, name: "APPROVED" })
						console.log(`String reviewed in ${channel.name}`)
					} else await reaction.message.reactions.cache.get("⏱")?.remove()
				}, 10_000)
			} else if (reaction.emoji.name === "vote_maybe" && reaction.message.author!.id !== user.id) {
				await reaction.users.remove(user.id)
				const embed = new Discord.MessageEmbed()
					.setColor(loadingColor as Discord.HexColorString)
					.setAuthor(strings.moduleName)
					.setTitle(strings.requestDetails.replace("%%user%%", user.tag))
					.setDescription(`${reaction.message}`)
					.addField(strings.message, `[${strings.clickHere}](${reaction.message.url})`)
					.setFooter(strings.requestedBy.replace("%%user%%", user.tag), member.displayAvatarURL({ dynamic: true, format: "png", }))
				const stringId = reaction.message.content!.match(/(?:\?[\w\d%&=$+!*'()-]*)?#(\d+)/gi)?.[0],
					fileId = reaction.message.content!.match(/^(?:https?:\/\/)?crowdin\.com\/translate\/hypixel\/(\d+|all)\//gi)?.[0],
					thread = await reaction.message.startThread({
						name: `More details requested on ${stringId ? `string ${stringId}` : fileId === "all" ? "all files" : fileId ? `file ${fileId}` : "an unknown string"}`,
						autoArchiveDuration: 1440,
						reason: `${user.tag} requested more details`
					})
				await thread.send({ content: `${user}`, embeds: [embed] })
				await statsColl.insertOne({ type: "STRINGS", user: user.id, name: "MORE_INFO" })
			} else if (reaction.emoji.name === "vote_no" && reaction.message.author!.id !== user.id) {
				await reaction.message.react("⏱")
				const embed = new Discord.MessageEmbed()
					.setColor(errorColor as Discord.HexColorString)
					.setAuthor(strings.moduleName)
					.setTitle(strings.rejected.replace("%%user%%", user.tag))
					.setDescription(`${reaction.message}`)
					.setFooter(strings.rejectedBy.replace("%%user%%", user.tag), member.displayAvatarURL({ dynamic: true, format: "png" }))
				setTimeout(async () => {
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
								name: `Change rejected on ${stringId ? `string ${stringId}` : fileId === "all" ? "all files" : fileId ? `file ${fileId}` : "an unknown string"}`,
								autoArchiveDuration: 60,
								reason: `${user.tag} rejected the change`
							})
						await thread.send({ content: `${reaction.message.author}, ${user}`, embeds: [embed] })
						if (!reaction.message.deleted) await reaction.message.delete()
						await statsColl.insertOne({ type: "STRINGS", user: user.id, name: "DENIED" })
						console.log(`String rejected in ${channel.name}`)
					} else await reaction.message.reactions.cache.get("⏱")?.remove()
				}, 10_000)
			} else await reaction.users.remove(user.id)
		} else await reaction.users.remove(user.id)
	}
	// Starboard system
	else if (reaction.emoji.name === "⭐" && channel.permissionsFor(ids.roles.verified)!.has(["SEND_MESSAGES", "VIEW_CHANNEL"]) && reaction.count! >= 4 && !reaction.message.author!.bot && reaction.message.content) {
		const collection = db.collection<Quote>("quotes"),
			urlQuote = await collection.findOne({ url: reaction.message.url })
		if (!urlQuote) {
			const id = await collection.estimatedDocumentCount() + 1,
				attachments: string[] = reaction.message.attachments.map(a => a.url)

			await collection.insertOne({ id: id, quote: reaction.message.content, author: [reaction.message.author.id], url: reaction.message.url, attachments })
			const embed = new Discord.MessageEmbed()
				.setColor(successColor as Discord.HexColorString)
				.setAuthor("Starboard")
				.setTitle(`The following quote reached ${reaction.count} ⭐ reactions and was added!`)
				.setDescription(reaction.message.content)
				.addFields([
					{ name: "User", value: `${reaction.message.author}` },
					{ name: "Quote number", value: `${id}` },
					{ name: "URL", value: reaction.message.url }
				])
			if (attachments.length) embed.setImage(attachments[0])
			await reaction.message.channel.send({ embeds: [embed] })
		}
	} else if (reaction.emoji.name === "vote_yes") {
		const eventDb = await db.collection("config").findOne({ name: "event" }) as EventDb
		if (eventDb.ids.includes(reaction.message.id)) {
			const member = reaction.message.guild!.members.cache.get(user.id)
			if (member) await member.roles.add(ids.roles.event)
		}
	}
})
