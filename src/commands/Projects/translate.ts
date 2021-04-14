import { neutralColor } from "../../config.json"
import Discord from "discord.js"
import { Command } from "../../index"

const command: Command = {
    name: "translate",
    description: "Gives you useful information on how to translate the Bot.",
    usage: "+translate",
    aliases: ["botproject", "translatebot", "bot"],
    cooldown: 120,
    allowDM: true,
    channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058", "551693960913879071"], // bots staff-bots bot-development admin-bots
    execute(message: Discord.Message, args: string[], getString: (path: string, variables?: { [key: string]: string | number } | string, cmd?: string, lang?: string) => any) {
        const executedBy = getString("executedBy", { user: message.author.tag }, "global")
        if (message.guild?.id === "549503328472530974" && message.member!.roles.cache.find(role => role.name.startsWith("Bot ") && role.id !== "732615152246980628")) {
            const embed = new Discord.MessageEmbed()
                .setColor(neutralColor)
                .setAuthor(getString("moduleName"))
                .setTitle(getString("alreadyTranslator"))
                .setDescription(getString("projectLink", { link: "https://crowdin.com/project/hypixel-translators-bot" }))
                .addFields(
                    { name: getString("question"), value: getString("askTranslators", { botTranslators: "<#749391414600925335>" }) },
                    { name: getString("newCrowdin"), value: getString("checkGuide", { gettingStarted: "<#699275092026458122>" }) }
                )
                .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
            message.channel.send(embed)
        } else {
            const embed = new Discord.MessageEmbed()
                .setColor(neutralColor)
                .setAuthor(getString("moduleName"))
                .setTitle(getString("newTranslator"))
                .setDescription(getString("join"))
                .addFields(
                    { name: getString("openProject"), value: getString("howOpen", { link: "https://crowdin.com/project/hypixel-translators-bot" }) },
                    { name: getString("clickLanguage"), value: getString("requestJoin") },
                    { name: getString("lastThing"), value: getString("requestInfo", { tag: message.author.tag, id: message.author.id }) },
                    { name: getString("noLanguage"), value: getString("langRequest") }
                )
                .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
            message.channel.send(embed)
        }
    }
}

export default command
