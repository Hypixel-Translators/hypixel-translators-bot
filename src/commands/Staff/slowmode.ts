import Discord from "discord.js"
import { Command } from "../../index"

const command: Command = {
    name: "slowmode",
    description: "Sets the slowmode for the current channel",
    options: [{
        type: "INTEGER",
        name: "seconds",
        description: "The value to set the slowmode to, in seconds. Maximum 21600 (6 hours)",
        required: true
    }],
    roleWhitelist: ["621071221462663169", "764442984119795732"], //Discord Moderator, Discord Administrator
    async execute(interaction: Discord.CommandInteraction) {
        const slowmode = Math.abs(interaction.options.get("seconds")!.value as number)
        if (Number(slowmode) > 21_600) return await interaction.reply({ content: "The maximum slowmode you can set is 21.600 seconds!", ephemeral: true })
        if (!(interaction.channel instanceof Discord.TextChannel)) return await interaction.reply({ content: "You can only set a slowmode in a text channel!", ephemeral: true })
        await interaction.channel.setRateLimitPerUser(slowmode, `Set by ${interaction.user.tag}`)
        await interaction.reply({ content: `Successfully set the slowmode to ${interaction.options.get("seconds")!.value}`, ephemeral: true })
    }
}

export default command