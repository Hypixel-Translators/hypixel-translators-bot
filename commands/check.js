const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
  name: "check",
  description: "Shows info about the bot, author and any specified user.",
  aliases: ["perm", "perms", "user", "userinfo", "permission", "permissions"],
  usage: "check [user]",
  channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058"], // bots staff-bots bot-development
  execute(strings, message, args) {
    try {
      const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
      const embed = new Discord.MessageEmbed()
        .setColor(workingColor)
        .setAuthor(strings.moduleName)
        .setTitle(strings.loading)
        .setFooter(executedBy)
      message.channel.send(embed).then(msg => {
        var authorP = [] //author perm array
        var botP = [] //bot perm array
        var userP = [] //user perm array
        const authorPerms = message.member.permissions.toArray().forEach(e => { authorP.push(strings.perms[e] || e) })
        const botPerms = msg.member.permissions.toArray().forEach(e => { botP.push(strings.perms[e] || e) })
        if (args[0]) const userPerms = msg.member.permissions.toArray().forEach(e => { userP.push(strings.perms[e] || e) })
        const embed = new Discord.MessageEmbed()
          .setColor(successColor)
          .setAuthor(strings.moduleName)
          .setTitle(strings.list)
          .addFields(
            { name: msg.author.tag, value: botP.join(", ") },
            { name: message.author.tag, value: authorP.join(", ") }
          ) 
          .setFooter(executedBy)
        msg.edit(embed)
      })
    } catch (err) { throw err }
  }
}