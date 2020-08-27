module.exports = {
  name: "bulksend",
  description: "Send messages in a channel, ready to be edited.",
  usage: "bulksend",
  cooldown: 30,
  allowDM: true,
  execute(message, args) {
    if (!message.member.hasPermission("ADMINISTRATOR")) return;
    const sendTo = message.client.channels.cache.get(args[0])
    sendmsg(sendTo, args[1])
  }
};

function sendmsg(sendTo, times) {
  while (times > 0) {
    sendTo.send("This is a sample message.")
    times--;
  }
}