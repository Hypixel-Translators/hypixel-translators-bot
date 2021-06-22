import Discord from "discord.js"
import { successColor, loadingColor, errorColor } from "../../config.json"
import { Command, GetStringFunction } from "../../index"

const command: Command = {
    name: "8ball",
    description: "The Magic 8 Ball that will answer all your questions.",
    options: [{
        type: "STRING",
        name: "question",
        description: "The question to ask the bot",
        required: true
    }],
    cooldown: 5,
    channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058"], //bots staff-bots bot-dev 
    allowDM: true,
    async execute(interaction: Discord.CommandInteraction, getString: GetStringFunction) {
        const executedBy = getString("executedBy", { user: interaction.user.tag }, "global"),
            keys = Object.keys(getString("answers")),
            answerType = keys[keys.length * Math.random() << 0] as "positive" | "inconclusive" | "negative",
            answers = getString(`answers.${answerType}`),
            answer = answers[Math.floor(Math.random() * answers.length)],
            embed = new Discord.MessageEmbed()
                .setAuthor(getString("moduleName"))
                .setTitle(answer)
                .addField(getString("question"), interaction.options.get("question")!.value as string)
                .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
        if (answerType === "positive") embed.setColor(successColor)
        else if (answerType === "inconclusive") embed.setColor(loadingColor)
        else if (answerType === "negative") embed.setColor(errorColor)
        else console.error("Help the 8ball answer type is weird")
        await interaction.reply({ embeds: [embed] })
    }
}

export default command
