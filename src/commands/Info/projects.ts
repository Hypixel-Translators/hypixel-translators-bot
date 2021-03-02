import { neutralColor } from "../../config.json"
import Discord from "discord.js"
import { Command } from "../../lib/dbclient"

const command: Command = {
    name: "projects",
    description: "Gives you links and information about all the translation projects we support on the server.",
    usage: "+projects",
    cooldown: 120,
    allowDM: true,
    channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058", "551693960913879071"], // bots staff-bots bot-development admin-bots
    execute(message: Discord.Message, args: string[], getString: (path: string, cmd?: string, lang?: string)=>any) {
        const executedBy = getString("executedBy", "global").replace("%%user%%", message.author.tag)
        if (message.guild?.id === "549503328472530974") {
            let joinedHypixel
            let joinedQuickplay
            let joinedSba
            let joinedBot
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
                    { name: "Hypixel", value: `${getString("projectInfo").replace("%%project%%", "**Hypixel**").replace("%%link%%", "https://crowdin.com/project/hypixel").replace("%%command%%", "`+hypixel`")}\n${joinedHypixel}` },
                    { name: "Quickplay", value: `${getString("projectInfo").replace("%%project%%", "**Quickplay**").replace("%%link%%", "https://crowdin.com/project/quickplay").replace("%%command%%", "`+quickplay`")}\n${joinedQuickplay}` },
                    { name: "SkyblockAddons", value: `${getString("projectInfo").replace("%%project%%", "**SkyblockAddons**").replace("%%link%%", "https://crowdin.com/project/skyblockaddons").replace("%%command%%", "`+skyblockaddons`")}\n${joinedSba}` },
                    { name: "Hypixel Translators Bot", value: `${getString("projectInfo").replace("%%project%%", "**Hypixel Translators Bot**").replace("%%link%%", "https://crowdin.com/project/hypixel-translators-bot").replace("%%command%%", "`+bot`")}\n${joinedBot}` }
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
                    { name: "Hypixel", value: `${getString("projectInfo").replace("%%project%%", "**Hypixel**").replace("%%link%%", "https://crowdin.com/project/hypixel").replace("%%command%%", "`+hypixel`")}` },
                    { name: "Quickplay", value: `${getString("projectInfo").replace("%%project%%", "**Quickplay**").replace("%%link%%", "https://crowdin.com/project/quickplay").replace("%%command%%", "`+quickplay`")}` },
                    { name: "SkyblockAddons", value: `${getString("projectInfo").replace("%%project%%", "**SkyblockAddons**").replace("%%link%%", "https://crowdin.com/project/skyblockaddons").replace("%%command%%", "`+skyblockaddons`")}` },
                    { name: "Hypixel Translators Bot", value: `${getString("projectInfo").replace("%%project%%", "**Hypixel Translators Bot**").replace("%%link%%", "https://crowdin.com/project/hypixel-translators-bot").replace("%%command%%", "`+bot`")}` }
                )
                .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
            message.channel.send(embed)
        }
    }
}

export default command
