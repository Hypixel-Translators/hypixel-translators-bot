module.exports = {
  name: "bulksend",
  description: "Send messages in a channel, ready to be edited.",
  usage: "bulksend",
  cooldown: 30,
  allowDM: true,
  execute(message, args) {
    if (!message.member.hasPermission("ADMINISTRATOR")) return;
    const embed = new Discord.MessageEmbed()
      .setColor(workingColor)
      .setTitle("Bulk send")
      .setDescription("Sending...")
      .setFooter("Executed by " + message.author.tag);
    message.channel.send(embed)
      .then(msg => {
        const sendTo = msg.client.channels.cache.get(args[0])
        sendmsg(sendTo, args[1])
        const embed = new Discord.MessageEmbed()
          .setColor(successColor)
          .setTitle("Bulk send")
          .setDescription("Sent!")
          .setFooter("Executed by " + message.author.tag);
        msg.edit(embed)
      })
  }
};

function sendmsg(sendTo, times) {
  while (times > 0) {
    sendTo.send("This is a sample message.")
    times--;
  }
}