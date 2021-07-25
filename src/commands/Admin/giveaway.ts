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
    allowTip: false,
    roleWhitelist: ["764442984119795732"], //Discord Administrator
    async execute(interaction) {
        const giveawayMsg = await (interaction.channel as Discord.TextChannel).messages.fetch((interaction.options.getString("messageid", true) as Discord.Snowflake))
            .catch(async err => {
                return await interaction.reply({ content: "Couldn't find that message! Here's the error:\n" + err, ephemeral: true })
            }) as Discord.Message
        const users = await giveawayMsg.reactions.cache.get("🎉")?.users.fetch()
        if (!users) return await interaction.reply({ content: "That message doesn't have any 🎉 reactions.", ephemeral: true })
        const winners: (Discord.User | undefined)[] = users.random(interaction.options.getInteger("winners", false) || 1)
        await interaction.reply(`Congratulations to ${winners.filter(user => user).join(", ")}`)
    }
}

export default command
