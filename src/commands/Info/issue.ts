import { successColor } from "../../config.json"
import Discord from "discord.js"
import { Command } from "../../index"

const command: Command = {
    name: "issue",
    description: "Opens the GitHub issues page.",
    usage: "+issue",
    aliases: ["issues", "bug", "feedback"],
    cooldown: 120,
    allowDM: true,
    channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058"], //bots staff-bots bot-dev 
    execute(message: Discord.Message, args: string[], getString: (path: string, variables?: { [key: string]: string | number }, cmd?: string, lang?: string) => any) {
        const executedBy = getString("executedBy", { user: message.author.tag }, "global")
        const embed = new Discord.MessageEmbed()
            .setColor(successColor)
            .setAuthor(getString("moduleName"))
            .setTitle(getString("bugT"))
            .setDescription(getString("bugD", { github: "(https://github.com/Hypixel-Translators/hypixel-translators-bot/issues)" }))
            .addField(getString("urgentT"), getString("urgentD"))
            .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
        message.channel.send(embed)
    }
}

export default command
