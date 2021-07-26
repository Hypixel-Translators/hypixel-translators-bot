import { client } from "../index"
import Discord from "discord.js"
import { db } from "../lib/dbclient"
import { EventDb } from "../lib/util"

client.on("messageReactionRemove", async (reaction, user) => {
    if (reaction.message.channel.type !== "DM" && !user.bot) {
        //Reaction roles
        if (reaction.message.id === "800415711864029204" && !user.bot) { //server-info roles message
            let roleId: Discord.Snowflake
            if (reaction.emoji.name === "📊") roleId = "646098170794868757" //Polls
            else if (reaction.emoji.name === "🤖") roleId = "732615152246980628" //Bot Updates
            else if (reaction.emoji.name === "🎉") roleId = "801052623745974272" //Giveaway pings
            else return
            reaction.message!.guild!.members.resolve(user.id)!.roles.remove(roleId, "Removed the reaction in server-info")
                .then(() => console.log(`Took the ${reaction.message.guild!.roles.cache.get(roleId)!.name} role from ${user.tag}`))
                .catch(err => console.error(`An error occured while trying to take the ${reaction.message.guild!.roles.cache.get(roleId)!.name} role from ${user.tag}. Here's the error:\n${err.stack}`))
        } else if (reaction.emoji.name === "vote_yes") {
            const eventDb = await db.collection("config").findOne({ name: "event" }) as EventDb
            if (eventDb.ids.includes(reaction.message.id)) {
                const member = await reaction.message.guild!.members.fetch(user.id)
                if (member) await member.roles.remove("863430999122509824")
            }
        }
    }
})