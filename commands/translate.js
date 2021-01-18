const { neutralColor } = require("../config.json")
const Discord = require("discord.js")

module.exports = {
    name: "translate",
    description: "Gives you useful information on how to translate the Bot.",
    usage: "+translate",
    aliases: ["botproject", "translatebot", "bot"],
    cooldown: 120,
    allowDM: true,
    channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058", "749391414600925335", "551693960913879071"], // bots staff-bots bot-development bot-translators admin-bots
    execute(message, strings) {
        const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
        if (message.channel.type !== "dm" && message.guild.id === "549503328472530974" && message.member.roles.cache.find(role => role.name.startsWith("Bot ") && role.id !== "732615152246980628")) {
            const embed = new Discord.MessageEmbed()
                .setColor(neutralColor)
                .setAuthor(strings.moduleName)
                .setTitle(strings.alreadyTranslator)
                .setDescription(strings.projectLink.replace("%%link%%", "https://crowdin.com/project/hypixel-translators-bot"))
                .addFields(
                    { name: strings.question, value: strings.askTranslators.replace("%%botTranslators%%", "<#749391414600925335>") },
                    { name: strings.newCrowdin, value: strings.checkGuide.replace("%%gettingStarted%%", "<#699275092026458122>") }
                )
                .setFooter(executedBy, message.author.displayAvatarURL())
            message.channel.send(embed)
        } else {
            const embed = new Discord.MessageEmbed()
                .setColor(neutralColor)
                .setAuthor(strings.moduleName)
                .setTitle(strings.newTranslator)
                .setDescription(strings.join)
                .addFields(
                    { name: strings.openProject, value: strings.howOpen.replace("%%link%%", "https://crowdin.com/project/hypixel-translators-bot") },
                    { name: strings.clickLanguage, value: strings.requestJoin },
                    { name: strings.lastThing, value: strings.requestInfo },
                    { name: strings.noLanguage, value: strings.langRequest }
                )
                .setFooter(executedBy, message.author.displayAvatarURL())
            message.channel.send(embed)
        }
    }
}
