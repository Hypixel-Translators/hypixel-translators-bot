import Discord from "discord.js"
import { successColor } from "../config.json"
import { client } from "../index.js"
import { db } from "../lib/dbclient.js"

client.on("messageReactionAdd", async (reaction, user) => {
    const channel = reaction.message.channel
    if (channel.type !== "dm") {
        await reaction.fetch()
        // Delete message when channel name ends with review-strings
        if (channel.name.endsWith("review-strings") && !user.bot && /https:\/\/crowdin\.com\/translate\/\w+\/(?:\d+|all)\/en(?:-\w+)?(?:\?[\w\d%&=$_.+!*'()-]*)?#\d+/gi.test(reaction.message.content)) {
            if (reaction.emoji.name === "vote_yes" || reaction.emoji.name === "✅" || reaction.emoji.name === "like" || reaction.emoji.name === "👍" || reaction.emoji.name === "approved") {
                reaction.message.react("⏱")
                reaction.message.react(reaction.emoji)
                setTimeout(() => {
                    if (!reaction.message.deleted) reaction.message.delete()
                    console.log(`String reviewed in ${channel.name} (saw reaction ${reaction.emoji.name})`)
                }, 10000)
            }
            // TODO add the ability to request an explanation or deny a suggestion
        }
        // Give Polls role if reacted on reaction role message
        else if (reaction.message.id === "800415711864029204" && !user.bot) { //server-info roles message
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