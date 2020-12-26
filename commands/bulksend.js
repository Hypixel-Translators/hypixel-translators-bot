const { loadingColor, errorColor, successColor, blurple } = require("../config.json")
const Discord = require("discord.js")

module.exports = {
  name: "bulksend",
  description: "Send messages in a channel, ready to be edited.",
  usage: "+bulksend <channel> <amount>",
  allowDM: true,
  execute(message, strings, args) {
    const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
    if (!message.member.hasPermission("ADMINISTRATOR")) return
    const sendTo = message.client.channels.cache.get(args[0].replace("<#", "").replace(">", ""))
    sendmsg(sendTo, args[1])
    const embed = new Discord.MessageEmbed()
      .setColor(successColor)
      .setAuthor(strings.moduleName)
      .setDescription("<#" + sendTo.id + ">")
      .setFooter(executedBy, message.author.displayAvatarURL())
      if (args[1] == 1) embed.setTitle(strings.success1)
      else embed.setTitle(strings.success)
    message.channel.send(embed)
      .catch(error => { throw error })
  }
}

function sendmsg(sendTo, times) {
  while (times > 0) {
    sendTo.send("Language statistics will be here shortly!")
    times--
  }
}