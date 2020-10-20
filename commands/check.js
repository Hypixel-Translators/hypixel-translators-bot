const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
  name: "check",
  description: "Shows info about the bot, author and any specified user.",
  aliases: ["perm", "perms", "user", "userinfo", "permission", "permissions"],
  usage: "check [user]",
  channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058", "768160446368186428"], // bots staff-bots bot-development managers
  async execute(strings, message, args) {
    if (args[0]) {
      var user = msg.guild.members.cache.find(m => (m.id === args[0].replace("<@", "").replace(">", "")) || m.user.tag === args[0] || m.user.username === args[0] || m.nickname === args[0] || m.user.tag.toLowerCase().includes(args[0].toLowerCase()) || m.displayName.toLowerCase().includes(args[0].toLowerCase()))
      if (!user) { throw "falseUser" }
    }
    if (!message.member.hasPermission("VIEW_AUDIT_LOG") && !message.member.roles.cache.has("748269219619274893") && !message.member.roles.cache.has("752541221980733571")) return;
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
        } else { //arguments given - display specified user info
          var userP = []
          user.permissions.toArray().forEach(e => { userP.push(strings.perms[e] || e) })

          const joinD = user.joinedAt.toLocaleString(strings.dateLocale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: "2-digit", minute: "2-digit", timeZone: strings.timeZone, timeZoneName: "short" })
          const creaD = user.user.createdAt.toLocaleString(strings.dateLocale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: "2-digit", minute: "2-digit", timeZone: strings.timeZone, timeZoneName: "short" })

          const embed = new Discord.MessageEmbed()
            .setColor(successColor)
            .setAuthor(strings.moduleName)
            .setTitle(user.user.tag)
            .setDescription("<@" + user.user.id + "> (ID: `" + user.user.id + "`)")
            .addFields(
              { name: strings.ujoined, value: joinD.charAt(0).toUpperCase() + joinD.slice(1), inline: true },
              { name: strings.ucreated, value: creaD.charAt(0).toUpperCase() + creaD.slice(1), inline: true },
              { name: strings.uroles, value: user.roles.cache.sort((a, b) => b.position - a.position).map(r => `${r}`).join(', ') },
              { name: strings.uperms, value: userP.join(", ") }
            )
            .setThumbnail(user.user.displayAvatarURL())
            .setFooter(executedBy)
          msg.edit(embed)
        }
      })
    } catch (err) { throw err }
  }
}