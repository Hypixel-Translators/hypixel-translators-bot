const Discord = require("discord.js")
const { successColor, loadingColor, errorColor } = require("../../config.json")

module.exports = {
    name: "8ball",
    description: "The Magic 8 Ball that will answer all your questions.",
    aliases: ["magic8ball", "magicball"],
    usage: "+8ball <question>",
    cooldown: 5,
    channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058"], //bots staff-bots bot-dev bot-translators
    allowDM: true,
    async execute(message, args, getString) {
        if (!args[0]) throw "noMessage"
        const executedBy = getString("executedBy", "global").replace("%%user%%", message.author.tag)
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