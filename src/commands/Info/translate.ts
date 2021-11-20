import { HexColorString, MessageEmbed } from "discord.js"
import { neutralColor, ids } from "../../config.json"
import { generateTip } from "../../lib/util"

import type { Command, GetStringFunction } from "../../lib/imports"

const command: Command = {
    name: "translate",
    description: "Gives you useful information on how to translate the Bot.",
    cooldown: 120,
    allowDM: true,
    channelWhitelist: [ids.channels.bots, ids.channels.staffBots, ids.channels.botDev, ids.channels.adminBots],
    async execute(interaction, getString: GetStringFunction) {
        const randomTip = generateTip(getString),
            member = interaction.client.guilds.cache.get("549503328472530974")!.members.resolve(interaction.user.id)!

        if (member.roles.cache.find(role => role.name.startsWith("Bot ") && role.name !== "Bot Updates")) {
            const embed = new MessageEmbed()
                .setColor(neutralColor as HexColorString)
                .setAuthor(getString("moduleName"))
                .setTitle(getString("alreadyTranslator"))
                .setDescription(getString("projectLink", { link: "https://crowdin.com/project/hypixel-translators-bot" }))
                .addFields(
                    { name: getString("question"), value: getString("askTranslators", { botTranslators: `<#${ids.channels.botTranslators}>` }) },
                    { name: getString("newCrowdin"), value: getString("checkGuide", { gettingStarted: `<#${ids.channels.gettingStarted}>` }) }
                )
                .setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))
            await interaction.reply({ embeds: [embed] })
        } else {
            const embed = new MessageEmbed()
                .setColor(neutralColor as HexColorString)
                .setAuthor(getString("moduleName"))
                .setTitle(getString("newTranslator"))
                .setDescription(getString("join"))
                .addFields(
                    { name: getString("openProject"), value: getString("howOpen", { link: "https://crowdin.com/project/hypixel-translators-bot" }) },
                    { name: getString("clickLanguage"), value: getString("requestJoin") },
                    { name: getString("lastThing"), value: getString("requestInfo", { tag: interaction.user.tag, id: interaction.user.id }) },
                    { name: getString("noLanguage"), value: getString("langRequest") }
                )
                .setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))
            await interaction.reply({ embeds: [embed] })
        }
    }
}

export default command
