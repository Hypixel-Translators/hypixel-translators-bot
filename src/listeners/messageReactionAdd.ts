import { client } from "../index.js"

client.on("messageReactionAdd", async (reaction, user) => {
    const channel = reaction.message.channel
    if (channel.type !== "dm") {
        //Delete message when channel name ends with review-strings
        if (channel.name.endsWith("review-strings") && !user.bot) {
            if (reaction.emoji.name === "vote_yes" || reaction.emoji.name === "✅" || reaction.emoji.name === "like" || reaction.emoji.name === "👍" || reaction.emoji.name === "approved") {
                reaction.message.react("⏱")
                reaction.message.react(reaction.emoji)
                setTimeout(() => {
                    if (!reaction.message.deleted) reaction.message.delete()
                    console.log(`String reviewed in ${channel.name} (saw reaction ${reaction.emoji.name})`)
                }, 10000)
            }
        }

        //Give Polls role if reacted on reaction role message
        if (reaction.message.id === "800415711864029204" && !user.bot) { //server-info roles message
            let roleId: string
            if (reaction.emoji.name === "📊") roleId = "646098170794868757" //Polls
            else if (reaction.emoji.name === "🤖") roleId = "732615152246980628" //Bot Updates
            else if (reaction.emoji.name === "🎉") roleId = "801052623745974272" //Giveaway pings
            else return
            reaction.message.guild!.member(user.id)!.roles.add(roleId, "Added the reaction in server-info")
                .then(() => console.log(`Gave the ${reaction.message.guild!.roles.cache.get(roleId)!.name} role to ${user.tag}`))
                .catch(err => console.error(`An error occured while trying to give the ${reaction.message.guild!.roles.cache.get(roleId)!.name} role to ${user.tag}. Here's the error:\n${err.stack}`))
        }
    }
})