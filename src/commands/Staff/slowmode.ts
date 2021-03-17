import Discord from "discord.js"
import { Command } from "../../index"

const command: Command = {
    name: "slowmode",
    description: "Sets the slowmode for the current channel",
    usage: "+slowmode <seconds>",
    roleWhitelist: ["621071221462663169", "764442984119795732"], //Discord Moderator, Discord Administrator
    async execute(message: Discord.Message, args: string[]) {
        await message.delete()
        if (args[0].toLowerCase() === "off") args[0] = "0"
        if (!Number(args[0]) && Number(args[0]) < 0 || Number(args[0]) > 21600 || !(message.channel instanceof Discord.TextChannel)) return
        message.channel.setRateLimitPerUser(Number(args[0]), `Set by ${message.author.tag}`)
    }
}

export default command