import Discord from "discord.js"
import { errorColor, successColor, neutralColor } from "../../config.json"
import { Command, client, GetStringFunction } from "../../index"

const command: Command = {
    name: "dm",
    description: "Sends the user a private message.",
    options: [{
        type: "USER",
        name: "user",
        description: "The user to DM",
        required: true
    },
    {
        type: "STRING",
        name: "message",
        description: "The message to send",
        required: true
    }],
    roleWhitelist: ["768435276191891456"], //Discord Staff
    async execute(interaction, getString: GetStringFunction) {
        const recipient = interaction.options.getUser("user", true),
            recipientDb = await client.getUser(recipient.id),
            message = interaction.options.getString("message", true).replaceAll("\\n", "\n"),
            dm = new Discord.MessageEmbed()
                .setColor(neutralColor as Discord.HexColorString)
                .setAuthor(getString("incoming", this.name, recipientDb.lang))
                .setDescription(message)
                .setFooter(getString("incomingDisclaimer", this.name, recipientDb.lang))
        await interaction.defer()
        recipient.send({ embeds: [dm] })
            .then(async () => {
                const embed = new Discord.MessageEmbed()
                    .setColor(successColor as Discord.HexColorString)
                    .setAuthor("Direct Message")
                    .setTitle(`Sent message to ${recipient.tag}`)
                    .setDescription(message)
                    .setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                await interaction.editReply({ embeds: [embed] })
            })
            .catch(async error => {
                const errorEmbed = new Discord.MessageEmbed()
                    .setColor(errorColor as Discord.HexColorString)
                    .setAuthor("Direct Message")
                    .setTitle(`An error occured while trying to message ${recipient.tag}`)
                    .setDescription(error.toString())
                    .setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                await interaction.editReply({ embeds: [errorEmbed] })
            })
    }
}

export default command
