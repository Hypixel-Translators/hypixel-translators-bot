import { successColor } from "../../config.json"
import Discord from "discord.js"
import { Command } from "../../index"

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
  }],
  async execute(interaction: Discord.CommandInteraction) {
    const sendTo = interaction.options.get("channel")!.channel as Discord.TextChannel
    if (!sendTo.isText()) throw "You must provide a text channel to send messages in!"
    let amount = Number(interaction.options.get("amount")!.value)
    if (!amount) throw "You need to provide a number of messages to delete!"
    for (amount; amount > 0; amount--) await sendTo.send("Language statistics will be here shortly!")
    const embed = new Discord.MessageEmbed()
      .setColor(successColor as Discord.HexColorString)
      .setAuthor("Bulk Send")
      .setTitle(amount === 1 ? "Success! Message sent." : "Success! Messages sent.")
      .setDescription(`${sendTo}`)
      .setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
    await interaction.reply({ embeds: [embed] })
  }
}

export default command
