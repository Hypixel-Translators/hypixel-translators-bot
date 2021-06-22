import Discord from "discord.js"
import { successColor, errorColor } from "../../config.json"
import { db } from "../../lib/dbclient"
import { Command, client, GetStringFunction } from "../../index"
import { updateRoles } from "./hypixelverify"

const command: Command = {
    name: "hypixelunverify",
    description: "Unlinks your Discord account from your Hypixel player",
    cooldown: 60,
    channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058"], // bots staff-bots bot-dev 
    async execute(interaction: Discord.CommandInteraction, getString: GetStringFunction) {
        const executedBy = getString("executedBy", { user: interaction.user.tag }, "global")

        await updateRoles(interaction.member as Discord.GuildMember)
        await db.collection("users").updateOne({ id: interaction.user.id }, { $unset: { uuid: true } }).then(async r => {
            if (r.result.nModified) {
                const embed = new Discord.MessageEmbed()
                    .setColor(successColor)
                    .setAuthor(getString("moduleName"))
                    .setTitle(getString("unverified"))
                    .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                return await interaction.reply({ embeds: [embed] })
            } else {
                const embed = new Discord.MessageEmbed()
                    .setColor(errorColor)
                    .setAuthor(getString("moduleName"))
                    .setTitle(getString("notUnverified"))
                    .setDescription(getString("whyNotUnverified"))
                    .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                return await interaction.reply({ embeds: [embed], ephemeral: true })
            }
        })
        return
    },
}

export default command