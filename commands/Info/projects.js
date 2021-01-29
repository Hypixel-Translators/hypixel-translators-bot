const { neutralColor } = require("../../config.json")
const Discord = require("discord.js")

module.exports = {
    name: "projects",
    description: "Gives you links and information about all the translation projects we support on the server.",
    usage: "+projects",
    cooldown: 120,
    allowDM: true,
    channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058", "749391414600925335", "551693960913879071"], // bots staff-bots bot-development bot-translators admin-bots
    execute(message, strings) {
        const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
        if (message.channel.type !== "dm") {
            if (message.guild.id === "549503328472530974") {
                let joinedHypixel
                let joinedQuickplay
                let joinedSba
                let joinedBot
                if (message.member.roles.cache.find(role => role.name === "Hypixel Translator" || role.name === "Hypixel Proofreader" || role.name === "Hypixel Manager")) joinedHypixel = `<:vote_yes:732298639749152769> **${strings.alreadyJoined}**`
                else joinedHypixel = `<:vote_no:732298639736570007> **${strings.notJoined}**`
                if (message.member.roles.cache.find(role => role.name === "Quickplay Translator" || role.name === "Quickplay Proofreader" || role.name === "Quickplay Manager")) joinedQuickplay = `<:vote_yes:732298639749152769> **${strings.alreadyJoined}**`
                else joinedQuickplay = `<:vote_no:732298639736570007> **${strings.notJoined}**`
                if (message.member.roles.cache.find(role => role.name === "SkyblockAddons Translator" || role.name === "SkyblockAddons Proofreader" || role.name === "SkyblockAddons Manager")) joinedSba = `<:vote_yes:732298639749152769> **${strings.alreadyJoined}**`
                else joinedSba = `<:vote_no:732298639736570007> **${strings.notJoined}**`
                if (message.member.roles.cache.find(role => role.name === "Bot Translator" || role.name === "Bot Proofreader" || role.name === "Bot Manager")) joinedBot = `<:vote_yes:732298639749152769> **${strings.alreadyJoined}**`
                else joinedBot = `<:vote_no:732298639736570007> **${strings.notJoined}**`
                const embed = new Discord.MessageEmbed()
                    .setColor(neutralColor)
                    .setAuthor(strings.moduleName)
                    .setTitle(strings.allProjects)
                    .setDescription(strings.description)
                    .addFields(
                        { name: "Hypixel", value: `${strings.projectInfo.replace("%%project%%", "Hypixel").replace("%%link%%", "https://crowdin.com/project/hypixel").replace("%%command%%", "`+hypixel`")}\n${joinedHypixel}` },
                        { name: "Quickplay", value: `${strings.projectInfo.replace("%%project%%", "Quickplay").replace("%%link%%", "https://crowdin.com/project/quickplay").replace("%%command%%", "`+quickplay`")}\n${joinedQuickplay}` },
                        { name: "SkyblockAddons", value: `${strings.projectInfo.replace("%%project%%", "SkyblockAddons").replace("%%link%%", "https://crowdin.com/project/skyblockaddons").replace("%%command%%", "`+skyblockaddons`")}\n${joinedSba}` },
                        { name: "Hypixel Translators Bot", value: `${strings.projectInfo.replace("%%project%%", "Hypixel Translators Bot").replace("%%link%%", "https://crowdin.com/project/hypixel-translators-bot").replace("%%command%%", "`+bot`")}\n${joinedBot}` }
                    )
                    .setFooter(executedBy, message.author.displayAvatarURL())
                message.channel.send(embed)
            }
        } else {
            const embed = new Discord.MessageEmbed()
                .setColor(neutralColor)
                .setAuthor(strings.moduleName)
                .setTitle(strings.allProjects)
                .setDescription(`${strings.description}\n${strings.dmError}`)
                .addFields(
                    { name: "Hypixel", value: strings.hypixel.replace("%%link%%", "https://crowdin.com/project/hypixel") },
                    { name: "Quickplay", value: strings.quickplay.replace("%%link%%", "https://crowdin.com/project/quickplay") },
                    { name: "SkyblockAddons", value: strings.sba.replace("%%link%%", "https://crowdin.com/project/skyblockaddons") },
                    { name: "Hypixel Translators Bot", value: strings.bot.replace("%%link%%", "https://crowdin.com/project/hypixel-translators-bot") }
                )
                .setFooter(executedBy, message.author.displayAvatarURL())
            message.channel.send(embed)
        }
    }
}
