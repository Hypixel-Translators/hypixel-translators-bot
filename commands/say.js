const { loadingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
  name: "say",
  description: "Says something in a specific channel.",
  usage: "+say <message>",
  cooldown: 600,
  aliases: ["parrot", "repeat", "send"],
  allowDM: true,
  async execute(strings, message, args) {
    const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
    const rawSendTo = args[0]
    args.splice(0, 1)
    const toSend = args.join(" ")
    const sendTo = message.client.channels.cache.get(rawSendTo.replace("<#", "").replace(">", ""))
    var msg

    var allowed = false
    if (strings, message.channel.type !== "dm") { if (strings, message.member.roles.cache.has("768435276191891456")) { allowed = true } } // Discord Staff
    if (!allowed) throw "noAccess";
    if (!sendTo) throw "noChannel";
    if (!toSend) throw "noMessage";

    if (message.member) if (message.member.hasPermission("ADMINISTRATOR")) {
      msg = await sendTo.send(toSend).catch(err => { throw "noChannel"; })
    } else {
      msg = await sendTo.send(">>> " + toSend).catch(err => { throw "noChannel"; })
    }
    const embed = new Discord.MessageEmbed()
      .setColor(successColor)
      .setAuthor(strings.moduleName)
      .setTitle(strings.success)
      .setDescription("<#" + sendTo.id + ">:\n" + msg.content)
      .setFooter(executedBy)
    message.channel.send(embed)
  }
};
