const { successColor } = require("../config.json")
const Discord = require("discord.js")

module.exports = {
  name: "bulksend",
  description: "Send messages in a channel, ready to be edited.",
  usage: "+bulksend <channel> <amount>",
  roleWhitelist: ["764442984119795732"], //Discord Administrator
  execute(message, strings, args) {
    const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
    const sendTo = message.client.channels.cache.get(args[0].replace(/[\\<>@#&!]/g, ""))
    for (t = args[1]; t > 0; t--) { sendTo.send("Language statistics will be here shortly!") }
    const embed = new Discord.MessageEmbed()
      .setColor(successColor)
      .setAuthor(strings.moduleName)
      .setDescription(sendTo)
      .setFooter(executedBy, message.author.displayAvatarURL())
    if (args[1] == 1) embed.setTitle(strings.success1)
    else embed.setTitle(strings.success)
    message.channel.send(embed)
  }
}
