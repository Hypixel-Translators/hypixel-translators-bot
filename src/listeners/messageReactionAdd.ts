import Discord from "discord.js"
import { successColor, loadingColor, errorColor } from "../config.json"
import { client } from "../index"
import { db } from "../lib/dbclient"
import { EventDb } from "../lib/util"

client.on("messageReactionAdd", async (reaction, user) => {
    const channel = reaction.message.channel
    if (channel instanceof Discord.ThreadChannel) return
    if (channel.type !== "DM" && !user.bot) {
        if (reaction.partial) reaction = await reaction.fetch()
        if (reaction.message.partial) reaction.message = await reaction.message.fetch()
        if (user.partial) user = await user.fetch()
        // Delete message when channel name ends with review-strings
        if (channel.name.endsWith("-review-strings") && /https:\/\/crowdin\.com\/translate\/\w+\/(?:\d+|all)\/en(?:-\w+)?(?:\?[\w\d%&=$_.+!*'()-]*)?#\d+/gi.test(reaction.message.content!)) {
            if (reaction.message.guild!.members.resolve(user.id)!.roles.cache.has("569839580971401236")) {
                let strings: { [key: string]: string }
                try {
                    strings = require(`../../strings/${channel.name.split("-")[0]}/reviewStrings.json`)
                } catch {
                    strings = require(`../../strings/en/reviewStrings.json`)
                }
                if (reaction.emoji.name === "vote_yes" && reaction.message.author!.id !== user.id) {
                    await reaction.message.react("⏱")
                    setTimeout(async () => {
                        // Check if the user hasn't removed their reaction
                        if (await reaction.users.fetch().then(cache => cache.has(user.id))) {
                            if (!reaction.message.deleted) await reaction.message.delete()
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
                        .setFooter(strings.requestedBy.replace("%%user%%", user.tag), user.displayAvatarURL({ dynamic: true, format: "png", }))
                    const stringId = reaction.message.content!.match(/(?:\?[\w\d%&=$+!*'()-]*)?#(\d+)/gi)?.[0],
                        fileId = reaction.message.content!.match(/^(?:https?:\/\/)?crowdin\.com\/translate\/hypixel\/(\d+|all)\//gi)?.[0],
                        thread = await reaction.message.startThread({
                            name: `More details requested on ${stringId ? `string ${stringId}` : fileId === "all" ? "all files" : fileId ? `file ${fileId}` : "an unknown string"}`,
                            autoArchiveDuration: 1440,
                            reason: `${user.tag} requested more details`
                        })
                    await thread.send({ content: `${user}`, embeds: [embed] })
                } else if (reaction.emoji.name === "vote_no" && reaction.message.author!.id !== user.id) {
                    await reaction.message.react("⏱")
                    const embed = new Discord.MessageEmbed()
                        .setColor(errorColor as Discord.HexColorString)
                        .setAuthor(strings.moduleName)
                        .setTitle(strings.rejected.replace("%%user%%", user.tag))
                        .setDescription(`${reaction.message}`)
                        .setFooter(strings.rejectedBy.replace("%%user%%", user.tag), user.displayAvatarURL({ dynamic: true, format: "png", }))
                    setTimeout(async () => {
                        // Check if the user hasn't removed their reaction
                        if (await reaction.users.fetch().then(cache => cache.has(user.id))) {
                            if (reaction.message.thread) await reaction.message.thread.delete("String rejected")
                            const stringId = reaction.message.content!.match(/(?:\?[\w\d%&=$+!*'()-]*)?#(\d+)/gi)?.[0],
                                fileId = reaction.message.content!.match(/^(?:https?:\/\/)?crowdin\.com\/translate\/hypixel\/(\d+|all)\//gi)?.[0],
                                thread = await channel.threads.create({
                                    name: `Change rejected on ${stringId ? `string ${stringId}` : fileId === "all" ? "all files" : fileId ? `file ${fileId}` : "an unknown string"}`,
                                    autoArchiveDuration: 1440,
                                    reason: `${user.tag} rejected the change`
                                })
                            await thread.send({ content: `${reaction.message.author}, ${user}`, embeds: [embed] })
                            if (!reaction.message.deleted) await reaction.message.delete()
                            console.log(`String rejected in ${channel.name}`)
                        } else await reaction.message.reactions.cache.get("⏱")?.remove()
                    }, 10_000)
                } else await reaction.users.remove(user.id)
            } else await reaction.users.remove(user.id)
        }
        // Starboard system
        else if (reaction.emoji.name === "⭐" && channel.permissionsFor("569194996964786178")!.has(["SEND_MESSAGES", "VIEW_CHANNEL"]) && reaction.count! >= 4 && !reaction.message.author!.bot && reaction.message.content) {
            const collection = db.collection("quotes")
            const urlQuote = await collection.findOne({ url: reaction.message.url })
            if (!urlQuote) {
                const id = await collection.estimatedDocumentCount() + 1

                //Dumb fix for User.toString() inconsistency with message mentions
                await collection.insertOne({ id: id, quote: reaction.message.content, author: `${reaction.message.author}`.replace("<@", "<@!"), url: reaction.message.url })
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
                await reaction.message.channel.send({ embeds: [embed] })
            }
        } else if (reaction.emoji.name === "vote_yes") {
            const eventDb = await db.collection("config").findOne({ name: "event" }) as EventDb
            if (eventDb.ids.includes(reaction.message.id)) {
                const member = reaction.message.guild!.members.cache.get(user.id)
                if (member) await member.roles.add("863430999122509824") //Event
            }
        }
    }
})
