import Discord from "discord.js"
import { successColor, errorColor } from "../../config.json"
import { db } from "../../lib/dbclient"
import { Command, GetStringFunction } from "../../index"
import { updateRoles } from "../../lib/util"

const command: Command = {
    name: "hypixelunverify",
    description: "Unlinks your Discord account from your Hypixel player",
    cooldown: 60,
    options: [{
        type: "USER",
        name: "user",
        description: "The user to unverify. Admin-only",
        required: false
    }],
    channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058"], // bots staff-bots bot-dev 
    async execute(interaction, getString: GetStringFunction) {
        const executedBy = getString("executedBy", { user: interaction.user.tag }, "global"),
            memberInput = interaction.options.getMember("user", false) as Discord.GuildMember | null

        if (memberInput && (interaction.member as Discord.GuildMember).roles.cache.has("764442984119795732")) { //Discord Administrator
            await updateRoles(memberInput)
            await db.collection("users").updateOne({ id: memberInput.id }, { $unset: { uuid: true } }).then(async r => {
                if (r.modifiedCount) {
                    const embed = new Discord.MessageEmbed()
                        .setColor(successColor as Discord.HexColorString)
                        .setAuthor("Hypixel Verification")
                        .setTitle(`Successfully unverified ${memberInput.user.tag}`)
                        .setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                    return await interaction.reply({ embeds: [embed] })
                } else {
                    const embed = new Discord.MessageEmbed()
                        .setColor(errorColor as Discord.HexColorString)
                        .setAuthor("Hypixel Verification")
                        .setTitle(`Couldn't unverify ${memberInput.user.tag}!`)
                        .setDescription("This happened because this user isn't verified yet.")
                        .setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                    return await interaction.reply({ embeds: [embed], ephemeral: true })
                }
            })
        } else {
            await updateRoles(interaction.member as Discord.GuildMember)
            await db.collection("users").updateOne({ id: interaction.user.id }, { $unset: { uuid: true } }).then(async r => {
                if (r.modifiedCount) {
                    const embed = new Discord.MessageEmbed()
                        .setColor(successColor as Discord.HexColorString)
                        .setAuthor(getString("moduleName"))
                        .setTitle(getString("unverified"))
                        .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                    return await interaction.reply({ embeds: [embed] })
                } else {
                    const embed = new Discord.MessageEmbed()
                        .setColor(errorColor as Discord.HexColorString)
                        .setAuthor(getString("moduleName"))
                        .setTitle(getString("notUnverified"))
                        .setDescription(getString("whyNotUnverified"))
                        .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                    return await interaction.reply({ embeds: [embed], ephemeral: true })
                }
            })
        }
    }
}

export default command