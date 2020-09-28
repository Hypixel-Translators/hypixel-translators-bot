const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
  name: "say",
  description: "Say something in a specific channel.",
  usage: "say <message>",
  aliases: ["sayadmin"],
  allowDM: true,
  execute(strings, message, args) {
    const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
    const rawSendTo = args[0]
    args.splice(0, 1)
    var toSend = args.join(" ")

    //message.delete();
    var allowed = false
    const errEmbed = new Discord.MessageEmbed()
      .setColor(errorColor)
      .setAuthor(strings.moduleName)
      .setTitle(strings.error)
      .setFooter(executedBy)
    if (message.channel.type !== "dm") { if (message.member.roles.cache.has("620274909700161556")) { allowed = true } } // * role
    if (!allowed) message.channel.send(errEmbed);

    const embed = new Discord.MessageEmbed()
      .setColor(workingColor)
      .setAuthor(strings.moduleName)
      .setTitle(strings.loading)
      .setFooter(executedBy)
    message.channel.send(embed)
      .then(msg => {
        const sendTo = msg.client.channels.cache.get(rawSendTo.replace("<#", "").replace(">", ""))
        sendTo.send(toSend)
          .catch(err => {
            msg.delete()
            throw "noChannel";
            /*const embed = new Discord.MessageEmbed()
              .setColor(errorColor)
              .setAuthor(strings.moduleName)
              .setTitle(strings.invalidArg)
              .setFooter(executedBy)
            if (!rawSendTo) { embed.setDescription(strings.notProvided.replace("%%type%%", strings.aChannel)) }
            else { embed.setDescription(strings.notFound.replace("%%type%%", strings.thatChannel)) }
            msg.edit(embed)*/
          })
        const embed = new Discord.MessageEmbed()
          .setColor(successColor)
          .setAuthor(strings.moduleName)
          .setTitle(strings.success)
          .setDescription("<#" + sendTo.id + ">:\n>>> " + toSend)
          .setFooter(executedBy)
        msg.edit(embed)
      })
  }
};