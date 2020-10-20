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
        if (!args[0]) { //no arguments given - display bot and author perms
          var authorP = []
          var botP = []
          message.member.permissions.toArray().forEach(e => { authorP.push(strings.perms[e] || e) })
          msg.member.permissions.toArray().forEach(e => { botP.push(strings.perms[e] || e) })
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
        } else {
          var user = msg.guild.members.find(m => m.id === args[0].replace("<@", "").replace(">", "")) || m.user.username === args[0] || m.nickname === args[0] || m.user.username.toLowerCase().includes(args[0].toLowerCase()) || m.nickname.toLowerCase().includes(args[0].toLowerCase())
          var userP = []
          user.permissions.toArray().forEach(e => { userP.push(strings.perms[e] || e) })
          const embed = new Discord.MessageEmbed()
            .setColor(successColor)
            .setAuthor(strings.moduleName)
            .setTitle(strings.list)
            .addFields(
              { name: strings.uperms.replace("%%uperms%%", user.tag), value: userP.join(", ") }
            )
            .setFooter(executedBy)
          msg.edit(embed)
        }
      })
    } catch (err) { throw err }
  }
}