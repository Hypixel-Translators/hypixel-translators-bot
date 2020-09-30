const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
  name: "say",
  description: "Says something in a specific channel.",
  usage: "+say <message>",
  aliases: ["parrot", "repeat", "send"],
  allowDM: true,
  async execute(strings, message, args) {
    const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
    const rawSendTo = args[0]
    args.splice(0, 1)
    const toSend = args.join(" ")
    const sendTo = message.client.channels.cache.get(rawSendTo.replace("<#", "").replace(">", "")) F
    var msg

    var allowed = false
    if (message.author.id == "722738307477536778") { allowed = true }
    if (message.channel.type !== "dm") { if (message.member.roles.cache.has("621071221462663169") || message.member.roles.cache.has("549885657749913621") || message.member.roles.cache.has("241926666400563203")) { allowed = true } }
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
