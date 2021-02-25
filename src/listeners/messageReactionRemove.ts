import { client } from "../index.js"
import Discord from "discord.js"

client.on("messageReactionRemove", async (reaction, user) => {
    if (reaction.message.channel.type !== "dm") {
        //Reaction roles
        if (reaction.message.id === "800415711864029204" && !user.bot) { //server-info roles message
            let roleId: string
            if (reaction.emoji.name === "📊") roleId = "646098170794868757" //Polls
            else if (reaction.emoji.name === "🤖") roleId = "732615152246980628" //Bot Updates
            else if (reaction.emoji.name === "🎉") roleId = "801052623745974272" //Giveaway pings
            else return
            reaction.message!.guild!.member(user as Discord.UserResolvable)!.roles.remove(roleId, "Removed the reaction in server-info")
                .then(() => console.log(`Took the ${reaction.message!.guild!.roles!.cache!.get(roleId)!.name} role from ${user.tag}`))
                .catch(err => console.error(`An error occured while trying to take the ${reaction.message!.guild!.roles!.cache!.get(roleId)!.name} role from ${user.tag}. Here's the error:\n${err}`))
        }
    }
})