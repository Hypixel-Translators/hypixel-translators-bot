import { neutralColor } from "../../config.json"
import Discord from "discord.js"
import { Command } from "../../index"

const command: Command = {
    name: "projects",
    description: "Gives you links and information about all the translation projects we support on the server.",
    usage: "+projects",
    cooldown: 120,
    allowDM: true,
    channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058", "551693960913879071"], // bots staff-bots bot-development admin-bots
    execute(message: Discord.Message, args: string[], getString: (path: string, variables?: { [key: string]: string | number } | string, cmd?: string, lang?: string) => any) {
        const executedBy = getString("executedBy", { user: message.author.tag }, "global")
        if (message.guild?.id === "549503328472530974") {
            let joinedHypixel,
                joinedQuickplay,
                joinedSba,
                joinedBot
            if (message.member!.roles.cache.find(role => role.name === "Hypixel Translator" || role.name === "Hypixel Proofreader" || role.name === "Hypixel Manager")) joinedHypixel = `<:vote_yes:732298639749152769> **${getString("alreadyJoined")}**`
            else joinedHypixel = `<:vote_no:732298639736570007> **${getString("notJoined")}**`
            if (message.member!.roles.cache.find(role => role.name === "Quickplay Translator" || role.name === "Quickplay Proofreader" || role.name === "Quickplay Manager")) joinedQuickplay = `<:vote_yes:732298639749152769> **${getString("alreadyJoined")}**`
            else joinedQuickplay = `<:vote_no:732298639736570007> **${getString("notJoined")}**`
            if (message.member!.roles.cache.find(role => role.name === "SkyblockAddons Translator" || role.name === "SkyblockAddons Proofreader" || role.name === "SkyblockAddons Manager")) joinedSba = `<:vote_yes:732298639749152769> **${getString("alreadyJoined")}**`
            else joinedSba = `<:vote_no:732298639736570007> **${getString("notJoined")}**`
            if (message.member!.roles.cache.find(role => role.name === "Bot Translator" || role.name === "Bot Proofreader" || role.name === "Bot Manager")) joinedBot = `<:vote_yes:732298639749152769> **${getString("alreadyJoined")}**`
            else joinedBot = `<:vote_no:732298639736570007> **${getString("notJoined")}**`
            const embed = new Discord.MessageEmbed()
                .setColor(neutralColor)
                .setAuthor(getString("moduleName"))
                .setTitle(getString("allProjects"))
                .setDescription(getString("description"))
                .addFields(
                    { name: "Hypixel", value: `${getString("projectInfo", { project: "**Hypixel**", link: "https://crowdin.com/project/hypixel", command: "`+hypixel`" })}\n${joinedHypixel}` },
                    { name: "Quickplay", value: `${getString("projectInfo", { project: "**Quickplay**", link: "https://crowdin.com/project/quickplay", command: "`+quickplay`" })}\n${joinedQuickplay}` },
                    { name: "SkyblockAddons", value: `${getString("projectInfo", { project: "**SkyblockAddons**", link: "https://crowdin.com/project/skyblockaddons", command: "`+skyblockaddons`" })}\n${joinedSba}` },
                    { name: "Hypixel Translators Bot", value: `${getString("projectInfo", { project: "**Hypixel Translators Bot**", link: "https://crowdin.com/project/hypixel-translators-bot", command: "`+bot`" })}\n${joinedBot}` }
                )
                .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
            message.channel.send(embed)
        } else {
            const embed = new Discord.MessageEmbed()
                .setColor(neutralColor)
                .setAuthor(getString("moduleName"))
                .setTitle(getString("allProjects"))
                .setDescription(`${getString("description")}\n${getString("dmError")}`)
                .addFields(
                    { name: "Hypixel", value: getString("projectInfo", { project: "**Hypixel**", link: "https://crowdin.com/project/hypixel", command: "`+hypixel`" }) },
                    { name: "Quickplay", value: getString("projectInfo", { project: "**Quickplay**", link: "https://crowdin.com/project/quickplay", command: "`+quickplay`" }) },
                    { name: "SkyblockAddons", value: getString("projectInfo", { project: "**SkyblockAddons**", link: "https://crowdin.com/project/skyblockaddons", command: "`+skyblockaddons`" }) },
                    { name: "Hypixel Translators Bot", value: getString("projectInfo", { project: "**Hypixel Translators Bot**", link: "https://crowdin.com/project/hypixel-translators-bot", command: "`+bot`" }) }
                )
                .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
            message.channel.send(embed)
        }
    }
}

export default command
