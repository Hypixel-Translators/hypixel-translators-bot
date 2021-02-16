const { successColor } = require("../../config.json")
const Discord = require("discord.js")

module.exports = {
  name: "bulksend",
  description: "Send messages in a channel, ready to be edited.",
  usage: "+bulksend <channel> <amount>",
  roleWhitelist: ["764442984119795732"], //Discord Administrator
  execute(message, args) {
    const sendTo = message.client.channels.cache.get(args[0].replace(/[\\<>@#&!]/g, ""))
    for (t = args[1]; t > 0; t--) { sendTo.send("Language statistics will be here shortly!") }
    const embed = new Discord.MessageEmbed()
      .setColor(successColor)
      .setAuthor("Bulk Send")
      .setDescription(sendTo)
      .setFooter(`Executed by ${message.author.tag}`, message.author.displayAvatarURL({ format: "png", dynamic: true }))
    if (args[1] == 1) embed.setTitle("Success! Message sent.")
    else embed.setTitle("Success! Messages sent.")
    message.channel.send(embed)
  }
}
