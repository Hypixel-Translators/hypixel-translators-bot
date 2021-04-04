import Discord from "discord.js"
import { successColor, loadingColor, errorColor } from "../../config.json"
import { Command } from "../../index"

const command: Command = {
    name: "8ball",
    description: "The Magic 8 Ball that will answer all your questions.",
    aliases: ["magic8ball", "magicball"],
    usage: "+8ball <question>",
    cooldown: 5,
    channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058"], //bots staff-bots bot-dev 
    allowDM: true,
    async execute(message: Discord.Message, args: string[], getString: (path: string, variables?: { [key: string]: string | number }, cmd?: string, lang?: string) => any) {
        if (!args[0]) throw "noMessage"
        const executedBy = getString("executedBy", { user: message.author.tag }, "global")
        const keys = Object.keys(getString("answers"))
        const answerType = keys[keys.length * Math.random() << 0]
        const answers = getString(`answers.${answerType}`)
        const answer = answers[Math.floor(Math.random() * answers.length)]
        const embed = new Discord.MessageEmbed()
            .setAuthor(getString("moduleName"))
            .setTitle(answer)
            .addField(getString("question"), args.join(" "))
            .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
        if (answerType === "positive") embed.setColor(successColor)
        else if (answerType === "inconclusive") embed.setColor(loadingColor)
        else if (answerType === "negative") embed.setColor(errorColor)
        else console.error("Help the 8ball answer type is weird")
        message.channel.send(embed)
    }
}

export default command
