const {
  workingColor,
  errorColor,
  successColor,
  neutralColor
} = require("../config.json");
const Discord = require("discord.js");

module.exports = {
  name: "say",
  description: "Say something in a specified channel.",
  usage: "say",
  cooldown: 3,
  allowDM: true,
  execute(message, args) {
    const rawSendTo = args[0]
    args.splice(0, 1)
    var toSend = args.join(" ")

    //message.delete();
    var allowed = false
    if (message.author.id == "722738307477536778") { allowed = true }
    if (message.channel.type !== "dm") { if (message.member.roles.cache.has("621071221462663169") || message.member.roles.cache.has("549885657749913621") || message.member.roles.cache.has("241926666400563203")) { allowed = true } }
    if (!allowed) return;

    const embed = new Discord.MessageEmbed()
      .setColor(workingColor)
      .setTitle("Say")
      .setDescription("Saying...")
      .setFooter("Executed by " + message.author.tag);
    message.channel.send(embed)
      .then(msg => {
        const sendTo = msg.client.channels.cache.get(rawSendTo)
        sendTo.send(toSend)
        const embed = new Discord.MessageEmbed()
          .setColor(successColor)
          .setTitle("Say")
          .setDescription("Said!")
          .setFooter("Executed by " + message.author.tag);
        msg.edit(embed)
      })
  }
};