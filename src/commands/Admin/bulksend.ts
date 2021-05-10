import { successColor } from "../../config.json"
import Discord from "discord.js"
import { Command } from "../../index"

const command: Command = {
  name: "bulksend",
  description: "Send messages in a channel, ready to be edited.",
  usage: "+bulksend <channel> <amount>",
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
    if (!(interaction.options[0].channel! as Discord.GuildChannel).isText()) return
    const sendTo = interaction.options[0].channel! as Discord.TextChannel
    let amount = Number(interaction.options[1].value)
    if (!amount) throw "You need to provide a number of messages to delete!"
    for (amount; amount > 0; amount--) { sendTo.send("Language statistics will be here shortly!") }
    const embed = new Discord.MessageEmbed()
      .setColor(successColor)
      .setAuthor("Bulk Send")
      .setTitle(amount === 1 ? "Success! Message sent." : "Success! Messages sent.")
      .setDescription(sendTo)
      .setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
    interaction.reply(embed)
  }
}

export default command
