import { neutralColor, ids } from "../../config.json"
import Discord from "discord.js"
import { client, Command, GetStringFunction } from "../../index"
import { generateTip } from "../../lib/util"

const command: Command = {
    name: "translate",
    description: "Gives you useful information on how to translate the Bot.",
    cooldown: 120,
    allowDM: true,
    channelWhitelist: [ids.channels.bots, ids.channels.staffBots, ids.channels.botDev, ids.channels.adminBots],
    async execute(interaction, getString: GetStringFunction) {
        const randomTip = generateTip(getString),
            member = client.guilds.cache.get("549503328472530974")!.members.resolve(interaction.user.id)!

        if (member.roles.cache.find(role => role.name.startsWith("Bot ") && role.name !== "Bot Updates")) {
            const embed = new Discord.MessageEmbed()
                .setColor(neutralColor as Discord.HexColorString)
                .setAuthor(getString("moduleName"))
                .setTitle(getString("alreadyTranslator"))
                .setDescription(getString("projectLink", { link: "https://crowdin.com/project/hypixel-translators-bot" }))
                .addFields(
                    { name: getString("question"), value: getString("askTranslators", { botTranslators: "<#749391414600925335>" }) },
                    { name: getString("newCrowdin"), value: getString("checkGuide", { gettingStarted: "<#699275092026458122>" }) }
                )
                .setFooter(randomTip, member.displayAvatarURL({ format: "png", dynamic: true }))
            await interaction.reply({ embeds: [embed] })
        } else {
            const embed = new Discord.MessageEmbed()
                .setColor(neutralColor as Discord.HexColorString)
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
