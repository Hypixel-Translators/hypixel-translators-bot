module.exports = {
    name: "giveaway",
    description: "Gives you the winners of a giveaway.",
    aliases: ["reroll", "g", "greroll", "giveaways"],
    usage: "+giveaway <messageID> [winners]",
    roleWhitelist: ["620274909700161556"], //*
    async execute(message, strings, args) {
            message.delete()
            const m = await message.channel.messages.fetch(args[0])
            const users = await m.reactions.cache.find(r => r.emoji.name == "🎉").users.fetch()
            const winner = users.random(args[1] || 1)
            let winners = []
            winner.forEach(user => winners.push(user.id))
            message.channel.send(`Congratulations to <@${winners.join(">, <@")}>`)
    }
}