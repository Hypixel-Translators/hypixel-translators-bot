module.exports = {
  name: "bulksend",
  description: "Send messages in a channel, ready to be edited.",
  usage: "bulksend",
  cooldown: 30,
  allowDM: true,
  execute(strings, message, args) {
    const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
    if (!message.member.hasPermission("ADMINISTRATOR")) return;
    const sendTo = message.client.channels.cache.get(args[0].replace("<#", "").replace(">", ""))
    sendmsg(sendTo, args[1])
      .then(() => {
        const embed = new Discord.MessageEmbed()
          .setColor(successColor)
          .setAuthor(strings.moduleName)
          .setTitle(strings.success)
          .setDescription("<#" + sendTo.id + ">")
          .setFooter(executedBy)
        msg.edit(embed)
      })
  }
};

function sendmsg(sendTo, times) {
  while (times > 0) {
    sendTo.send("This is a sample message.")
    times--
  }
}