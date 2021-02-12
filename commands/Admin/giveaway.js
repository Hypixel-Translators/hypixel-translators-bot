module.exports = {
    name: "giveaway",
    description: "Gives you the winners of a giveaway.",
    aliases: ["reroll", "g", "greroll", "giveaways"],
    usage: "+giveaway <messageID> [winners]",
    roleWhitelist: ["764442984119795732"], //Discord Administrator
    async execute(message, args) {
        if (!args[0]) return message.channel.send("You forgot to specify a message to look for! Use the message ID")
        const giveawayMsg = await message.channel.messages.fetch(args[0])
            .catch(err => {
                return message.channel.send("Couldn't find that message! Here's the error:\n" + err)
            })
        message.delete()
        const users = await giveawayMsg.reactions.cache.find(r => r.emoji.name == "🎉").users.fetch()
            .catch(err => {
                return message.channel.send("That message doesn't have any 🎉 reactions. Here's the error:\n" + err)
            })
        const winner = users.random(args[1] || 1)
        let winners = []
        winner.forEach(user => winners.push(user.id))
        message.channel.send(`Congratulations to <@${winners.join(">, <@")}>`)
    }
}