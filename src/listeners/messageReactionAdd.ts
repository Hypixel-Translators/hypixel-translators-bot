import Discord from "discord.js"
import { successColor, loadingColor, errorColor } from "../config.json"
import { client } from "../index.js"
import { db } from "../lib/dbclient.js"

client.on("messageReactionAdd", async (reaction, user) => {
    const channel = reaction.message.channel
    if (channel.type !== "dm" && !user.bot) {
        await reaction.fetch()
        await user.fetch()
        // Delete message when channel name ends with review-strings
        if (channel.name.endsWith("-review-strings") && /https:\/\/crowdin\.com\/translate\/\w+\/(?:\d+|all)\/en(?:-\w+)?(?:\?[\w\d%&=$_.+!*'()-]*)?#\d+/gi.test(reaction.message.content) && reaction.message.guild?.member(user.id)!.roles.cache.has("569839580971401236")) { // Hypixel Proofreader
            const translatorChannel = channel.parent!.children.filter(c => c.type === "text").sort((a, b) => a.position - b.position).first()! as Discord.TextChannel
            let strings = require(`../../strings/${channel.name.split("-")[0]}/reviewStrings.json`)
            if (!strings) strings = require(`../../strings/en/reviewStrings.json`)
            if (reaction.emoji.name === "vote_yes") {
                reaction.message.react("⏱")
                setTimeout(() => {
                    // Check if the user hasn't removed their reaction
                    if (reaction.users.cache.has(user.id)) {
                        if (!reaction.message.deleted) reaction.message.delete()
                        console.log(`String reviewed in ${channel.name} (saw reaction ${reaction.emoji.name})`)
                    } else reaction.users.remove()
                }, 10000)
            } else if (reaction.emoji.name === "vote_maybe") {
                reaction.users.remove(user.id)
                const embed = new Discord.MessageEmbed()
                    .setColor(loadingColor)
                    .setAuthor(strings.moduleName)
                    .setTitle(strings.requestDetails.replace("%%user%%", user.tag))
                    .setDescription(reaction.message)
                    .addField(strings.message, `[${strings.clickHere}](${reaction.message.url})`)
                    .setFooter(strings.requestedBy.replace("%%user%%", user.tag), user.displayAvatarURL({ dynamic: true, format: "png", }))
                if (reaction.message.author.id !== user.id) translatorChannel.send(reaction.message.author, embed)
            } else if (reaction.emoji.name === "vote_no") {
                reaction.users.remove(user.id)
                const embed = new Discord.MessageEmbed()
                    .setColor(errorColor)
                    .setAuthor(strings.moduleName)
                    .setTitle(strings.rejected.replace("%%user%%", user.tag))
                    .setDescription(reaction.message)
                    .setFooter(strings.rejectedBy.replace("%%user%%", user.tag), user.displayAvatarURL({ dynamic: true, format: "png", }))
                if (reaction.message.author.id !== user.id) translatorChannel.send(reaction.message.author, embed)
                setTimeout(() => {
                    // Check if the user hasn't removed their reaction
                    if (reaction.users.cache.has(user.id)) {
                        if (!reaction.message.deleted) reaction.message.delete()
                        console.log(`String rejected in ${channel.name}`)
                    } else reaction.users.remove()
                }, 10000)
            } else reaction.remove()
        }
        // Give Polls role if reacted on reaction role message
        else if (reaction.message.id === "800415711864029204") { //server-info roles message
            let roleId: string
            if (reaction.emoji.name === "📊") roleId = "646098170794868757" //Polls
            else if (reaction.emoji.name === "🤖") roleId = "732615152246980628" //Bot Updates
            else if (reaction.emoji.name === "🎉") roleId = "801052623745974272" //Giveaway pings
            else return
            reaction.message.guild!.member(user.id)!.roles.add(roleId, "Added the reaction in server-info")
                .then(() => console.log(`Gave the ${reaction.message.guild!.roles.cache.get(roleId)!.name} role to ${user.tag}`))
                .catch(err => console.error(`An error occured while trying to give the ${reaction.message.guild!.roles.cache.get(roleId)!.name} role to ${user.tag}. Here's the error:\n${err.stack}`))
        }
        // Starboard system
        else if (reaction.emoji.name === "⭐" && channel.permissionsFor("569194996964786178")!.has(["SEND_MESSAGES", "VIEW_CHANNEL"]) && reaction.count! >= 4 && !reaction.message.author.bot && reaction.message.content) {
            const collection = db.collection("quotes")
            const urlQuote = await collection.findOne({ url: reaction.message.url })
            if (!urlQuote) {
                const id = await collection.estimatedDocumentCount() + 1

                //Dumb fix for User.toString() inconsistency with message mentions
                await collection.insertOne({ id: id, quote: reaction.message.content, author: `${reaction.message.author}`.replace("<@", "<@!"), url: reaction.message.url })
                const embed = new Discord.MessageEmbed()
                    .setColor(successColor)
                    .setAuthor("Starboard")
                    .setTitle(`The following quote reached ${reaction.count} ⭐ reactions and was added!`)
                    .setDescription(reaction.message.content)
                    .addFields(
                        { name: "User", value: reaction.message.author },
                        { name: "Quote number", value: id },
                        { name: "URL", value: reaction.message.url }
                    )
                reaction.message.channel.send(embed)
            }
        }
    }
})