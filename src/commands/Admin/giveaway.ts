import Discord from "discord.js"
import { Command } from "../../index"

const command: Command = {
    name: "giveaway",
    description: "Gives you the winners of a giveaway.",
    options: [{
        type: "STRING",
        name: "messageid",
        description: "The ID of the message to fetch winners from",
        required: true
    },
    {
        type: "INTEGER",
        name: "winners",
        description: "The amount of winners to pick. defaults to 1",
        required: false
    }],
    roleWhitelist: ["764442984119795732"], //Discord Administrator
    async execute(interaction: Discord.CommandInteraction) {
        const giveawayMsg = await (interaction.channel as Discord.TextChannel).messages.fetch((interaction.options.get("messageid")!.value as Discord.Snowflake))
            .catch(err => {
                return interaction.reply("Couldn't find that message! Here's the error:\n" + err, { ephemeral: true })
            }) as Discord.Message
        const users = await giveawayMsg.reactions.cache.find(r => r.emoji.name == "🎉")?.users.fetch()
            .catch(err => {
                return interaction.reply("That message doesn't have any 🎉 reactions. Here's the error:\n" + err, { ephemeral: true })
            }) as Discord.Collection<string, Discord.User>
        const winner: Discord.User[] = users!.random(Number(interaction.options.get("winners")?.value) || 1)
        let winners: Discord.User[] = []
        winner.forEach(user => winners.push(user))
        interaction.reply(`Congratulations to ${winners.join(", ")}`)
    }
}

export default command
