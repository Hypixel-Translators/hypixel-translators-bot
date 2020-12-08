const { loadingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
  name: "check",
  description: "Shows information about the specified user.",
  aliases: ["perm", "perms", "user", "userinfo", "permission", "permissions", "czech"],
  usage: "+check [user]",
  channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058", "768160446368186428"], // bots staff-bots bot-development managers
  execute(strings, message, args) {
    const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)

    if (!message.member.hasPermission("VIEW_AUDIT_LOG") && !message.member.roles.cache.has("551758391127834625") && !message.member.roles.cache.has("748269219619274893") && !message.member.roles.cache.has("645709877536096307") && !message.member.roles.cache.has("752541221980733571")) throw "noAccess"; //hypixel, sba, qp and bot managers

    var user = message.member
    if (args[0]) {
      var userRaw = args[0].replace("<@", "").replace(">", "")
      user = message.guild.members.cache.find(m => m.id === userRaw || m.user.tag === userRaw || m.user.username === userRaw || m.nickname === userRaw || m.user.tag.toLowerCase().includes(userRaw.toLowerCase()) || m.displayName.toLowerCase().includes(userRaw.toLowerCase()))
      if (!user) {
        message.channel.send("That user hasn't been found!")
        return;
        //throw "falseUser"
      }
    }

    try {
      var userP = []
      user.permissions.toArray().forEach(e => { userP.push(strings.perms[e] || e) })

      const joinD = user.joinedAt.toLocaleString(strings.dateLocale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: "2-digit", minute: "2-digit", timeZone: strings.timeZone, timeZoneName: "short" })
      const creaD = user.user.createdAt.toLocaleString(strings.dateLocale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: "2-digit", minute: "2-digit", timeZone: strings.timeZone, timeZoneName: "short" })

      const embed = new Discord.MessageEmbed()
        .setColor(successColor)
        .setAuthor(strings.moduleName, user.user.displayAvatarURL())
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
      message.channel.send(embed)
    } catch (err) { throw err }
  }
}