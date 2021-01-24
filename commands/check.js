const { blurple } = require("../config.json")
const Discord = require("discord.js")

module.exports = {
  name: "check",
  description: "Shows information about the specified user.",
  aliases: ["user", "userinfo", "czech"],
  usage: "+check [user]",
  roleWhitelist: ["768435276191891456", "551758391127834625", "748269219619274893", "645709877536096307", "752541221980733571"], //Discord Staff and Hypixel, SBA, QP and Bot managers
  channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058", "768160446368186428"], // bots staff-bots bot-development managers
  execute(message, strings, args) {
    const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
    let user = message.member
    if (args[0]) {
      let userRaw = args[0].replace("<@", "").replace(">", "")
      user = message.guild.members.cache.find(m => m.id === userRaw || m.user.tag === userRaw || m.user.username === userRaw || m.nickname === userRaw || m.user.tag.toLowerCase().includes(userRaw.toLowerCase()) || m.displayName.toLowerCase().includes(userRaw.toLowerCase()))
      if (!user) throw "falseUser"
    }

    try {
      let note
      if (user.user.id === message.guild.ownerID) note = strings.owner
      else if (user.roles.cache.find(r => r.name === "Discord Owner")) note = strings.coOwner
      else if (user.roles.cache.find(r => r.name === "Discord Administrator")) note = strings.admin
      else if (user.roles.cache.find(r => r.name === "Discord Moderator")) note = strings.mod
      else if (user.roles.cache.find(r => r.name === "Discord Helper")) note = strings.helper
      else if (user.roles.cache.find(r => r.name.endsWith(" Manager"))) note = strings.manager

      let color = user.displayHexColor
      if (color == "#000000") color = blurple
      const joined = user.joinedAt.toLocaleString(strings.dateLocale, { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: strings.timeZone, timeZoneName: "short" })
      const created = user.user.createdAt.toLocaleString(strings.dateLocale, { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: strings.timeZone, timeZoneName: "short" })
      let joinAgo = Math.round((new Date().getTime() - user.joinedAt) / 1000)
      let createAgo = Math.round((new Date().getTime() - user.user.createdAt) / 1000)
      let userRoles = user.roles.cache
      if (userRoles.size !== 1) userRoles.delete("549503328472530974")

      const embed = new Discord.MessageEmbed()
        .setColor(color)
        .setAuthor(strings.moduleName, user.user.displayAvatarURL())
        .setTitle(user.user.tag)
        .setDescription(strings.userID.replace("%%user%%", "<@" + user.user.id + ">").replace("%%id%%", user.user.id))
        .addFields(
          { name: strings.ujoined, value: joined.charAt(0).toUpperCase() + joined.slice(1) + timeAgo(joinAgo), inline: true },
          { name: strings.ucreated, value: created.charAt(0).toUpperCase() + created.slice(1) + timeAgo(createAgo), inline: true },
          { name: strings.uroles, value: userRoles.sort((a, b) => b.position - a.position).map(r => `${r}`).join(", ") },
        )
        .setThumbnail(user.user.displayAvatarURL())
        .setFooter(executedBy, message.author.displayAvatarURL())
      if (note) embed.addField(strings.notes, note)
      message.channel.send(embed)
    } catch (err) { throw err }
    function timeAgo(time) {
      if (time == 1) time = ` (${strings.timeAgo.replace("%%time%%", time).replace("%%unit%%", strings.time.second)})`
      else if (time < 60) time = ` (${strings.timeAgo.replace("%%time%%", time).replace("%%unit%%", strings.time.seconds)})`
      else if (time == 60) time = ` (${strings.timeAgo.replace("%%time%%", Math.round(time / 60)).replace("%%unit%%", strings.time.minute)})`
      else if (time < (60 * 60 * 1.5)) time = ` (${strings.timeAgo.replace("%%time%%", Math.round(time / 60)).replace("%%unit%%", strings.time.minutes)})`
      else if (time == (60 * 60 * 1.5)) time = ` (${strings.timeAgo.replace("%%time%%", Math.round(time / (60 * 60))).replace("%%unit%%", strings.time.hour)})`
      else if (time < (60 * 60 * 24 * 1.5)) time = ` (${strings.timeAgo.replace("%%time%%", Math.round(time / (60 * 60))).replace("%%unit%%", strings.time.hours)})`
      else if (time == (60 * 60 * 24 * 1.5)) time = ` (${strings.timeAgo.replace("%%time%%", Math.round(time / (60 * 60 * 24))).replace("%%unit%%", strings.time.day)})`
      else if (time < (60 * 60 * 24 * 30 * 1.5)) time = ` (${strings.timeAgo.replace("%%time%%", Math.round(time / (60 * 60 * 24))).replace("%%unit%%", strings.time.days)})`
      else if (time == (60 * 60 * 24 * 30 * 1.5)) time = ` (${strings.timeAgo.replace("%%time%%", Math.round(time / (60 * 60 * 24 * 30))).replace("%%unit%%", strings.time.month)})`
      else if (time < (60 * 60 * 24 * 365 * 1.5)) time = ` (${strings.timeAgo.replace("%%time%%", Math.round(time / (60 * 60 * 24 * 30))).replace("%%unit%%", strings.time.months)})`
      else if (time == (60 * 60 * 24 * 365 * 1.5)) time = ` (${strings.timeAgo.replace("%%time%%", Math.round(time / (60 * 60 * 24 * 365))).replace("%%unit%%", strings.time.year)})`
      else time = ` (${strings.timeAgo.replace("%%time%%", Math.round(time / (60 * 60 * 24 * 365))).replace("%%unit%%", strings.time.years)})`
      return time
    }
  }
}
