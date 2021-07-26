import { successColor } from "../../config.json"
import Discord from "discord.js"
import { Command } from "../../index"
import { db } from "../../lib/dbclient"
import { updateProjectStatus } from "../../events/stats"
import { CrowdinProject } from "../../lib/util"

const command: Command = {
  name: "bulksend",
  description: "Send messages in a channel, ready to be edited.",
  defaultPermission: false,
  roleWhitelist: ["764442984119795732"], //Discord Administrator
  options: [{
    type: "CHANNEL",
    name: "channel",
    description: "The channel to send bulk messages in",
    required: true
  },
  {
    type: "INTEGER",
    name: "amount",
    description: "The amount of messages to send in bulk",
    required: true
  },
  {
    type: "BOOLEAN",
    name: "update",
    description: "Whether to update language statistics once all messages have been sent",
    required: false
  }],
  async execute(interaction) {
    const sendTo = interaction.options.getChannel("channel", true) as Discord.TextChannel
    if (!sendTo.isText()) throw "You must provide a text channel to send messages in!"
    let amount = interaction.options.getInteger("amount", true)
    if (!amount) throw "You need to provide a number of messages to delete!"
    await interaction.defer()
    for (amount; amount > 0; amount--) await sendTo.send("Language statistics will be here shortly!")
    const embed = new Discord.MessageEmbed()
      .setColor(successColor as Discord.HexColorString)
      .setAuthor("Bulk Send")
      .setTitle(`Success! Message${amount === 1 ? "" : "s"} sent!`)
      .setDescription(`${sendTo}`)
      .setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
    await interaction.editReply({ embeds: [embed] })
    if (interaction.options.getBoolean("update", false)) {
      const project = await db.collection("crowdin").findOne({ shortName: sendTo.name.split("-")[0] }) as CrowdinProject
      if (!project) return await interaction.followUp("Couldn't update language statistics because the project was not found!")
      await updateProjectStatus(interaction.client, project.id)
      await interaction.followUp(`Language statistics have been successfully updated on the ${project.name} project!`)
    }
  }
}

export default command
