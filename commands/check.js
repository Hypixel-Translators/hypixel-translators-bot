const { blurple } = require("../config.json")
const Discord = require("discord.js")

module.exports = {
  name: "check",
  description: "Shows information about the specified user.",
  aliases: ["user", "userinfo", "czech"],
  usage: "+check [user]",
  channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058", "768160446368186428"], // bots staff-bots bot-development managers
  execute(message, strings, args) {
    const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)

    if (!message.member.hasPermission("VIEW_AUDIT_LOG") && !message.member.roles.cache.has("551758391127834625") && !message.member.roles.cache.has("748269219619274893") && !message.member.roles.cache.has("645709877536096307") && !message.member.roles.cache.has("752541221980733571")) throw "noAccess" //hypixel, sba, qp and bot managers

    let user = message.member
    if (args[0]) {
      let userRaw = args[0].replace("<@", "").replace(">", "")
      user = message.guild.members.cache.find(m => m.id === userRaw || m.user.tag === userRaw || m.user.username === userRaw || m.nickname === userRaw || m.user.tag.toLowerCase().includes(userRaw.toLowerCase()) || m.displayName.toLowerCase().includes(userRaw.toLowerCase()))
      if (!user) {
        message.channel.send(strings.userNotFound)
        return
        //throw "falseUser"
      }
    }

    try {
      let userP = []
      user.permissions.toArray().forEach(e => { userP.push(strings.perms[e] || e) })

      let color = user.displayHexColor
      if (color == "#000000") color = blurple
      const joinD = user.joinedAt.toLocaleString(strings.dateLocale, { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: strings.timeZone, timeZoneName: "short" })
      const creaD = user.user.createdAt.toLocaleString(strings.dateLocale, { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: strings.timeZone, timeZoneName: "short" })
      let userRoles = user.roles.cache
      userRoles.delete("549503328472530974")

      const embed = new Discord.MessageEmbed()
        .setColor(color)
        .setAuthor(strings.moduleName, user.user.displayAvatarURL())
        .setTitle(user.user.tag)
        .setDescription(strings.userID.replace("%%user%%", "<@" + user.user.id + ">").replace("%%id%%", user.user.id))
        .addFields(
          { name: strings.ujoined, value: joinD.charAt(0).toUpperCase() + joinD.slice(1), inline: true },
          { name: strings.ucreated, value: creaD.charAt(0).toUpperCase() + creaD.slice(1), inline: true },
          { name: strings.uroles, value: userRoles.sort((a, b) => b.position - a.position).map(r => `${r}`).join(", ") },
          { name: strings.uperms, value: userP.join(", ") }
        )
        .setThumbnail(user.user.displayAvatarURL())
        .setFooter(executedBy, message.author.displayAvatarURL())
      message.channel.send(embed)
    } catch (err) { throw err }
  }
}
