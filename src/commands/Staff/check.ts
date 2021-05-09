import { blurple } from "../../config.json"
import Discord from "discord.js"
import { db, DbUser } from "../../lib/dbclient"
import { Command } from "../../index"

const command: Command = {
  name: "check",
  description: "Shows information about the specified user.",
  aliases: ["user", "userinfo", "czech"],
  usage: "+check [user]",
  roleWhitelist: ["768435276191891456", "551758391127834625", "748269219619274893", "645709877536096307", "752541221980733571"], //Discord Staff and Hypixel, SBA, QP and Bot managers
  channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058", "768160446368186428"], // bots staff-bots bot-development managers
  async execute(interaction: Discord.CommandInteraction, args: string[], getString: (path: string, variables?: { [key: string]: string | number } | string, cmd?: string, lang?: string) => any) {
    let member = interaction.member
    if (args[0]) {
      let userRaw = args[0].replace(/[\\<>@&!]/g, "")
      member = interaction.guild!.members.cache.find(m => m.id === userRaw || m.user.tag === userRaw || m.user.username === userRaw || m.nickname === userRaw || m.user.tag.toLowerCase().includes(userRaw.toLowerCase()) || m.displayName.toLowerCase().includes(userRaw.toLowerCase())) as (Discord.GuildMember | null)
      if (!member) throw "falseUser"
    }

    const userDb: DbUser | null = await db.collection("users").findOne({ id: member!.user.id })
    let note
    if (member!.user.id === interaction.guild!.ownerID) note = "Discord Owner"
    else if (member!.roles.cache.find(r => r.name === "Discord Owner")) note = "Discord Co-Owner"
    else if (member!.roles.cache.find(r => r.name === "Discord Administrator")) note = "Discord Administrator"
    else if (member!.roles.cache.find(r => r.name === "Discord Moderator")) note = "Discord Moderator"
    else if (member!.roles.cache.find(r => r.name === "Discord Helper")) note = "Discord Helper"
    else if (member!.roles.cache.find(r => r.name.endsWith(" Manager"))) note = "Project Manager"
    else if (member!.roles.cache.find(r => r.name === "Hypixel Staff")) note = "Hypixel Staff Member"
    else if (userDb?.profile) note = userDb.profile

    let color = member!.displayHexColor
    if (color == "#000000") color = blurple
    let timeZone = getString("timeZone", "hypixelstats")
    if (timeZone.startsWith("crwdns")) timeZone = getString("timeZone", "hypixelstats", "en")
    const joined = member!.joinedAt!.toLocaleString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: timeZone, timeZoneName: "short" })
    const created = member!.user.createdAt.toLocaleString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: timeZone, timeZoneName: "short" })
    let joinAgo = Math.round((new Date().getTime() - Number(member!.joinedAt!)) / 1000)
    let createAgo = Math.round((new Date().getTime() - Number(member!.user.createdAt)) / 1000)
    const rolesCache = member!.roles.cache
    let userRoles
    if (rolesCache.size !== 1) {
      rolesCache.delete("549503328472530974")
      userRoles = rolesCache.sort((a: Discord.Role, b: Discord.Role) => b.position - a.position).map((r: Discord.Role) => `${r}`).join(", ")
    } else userRoles = "No roles yet!"

    const embed = new Discord.MessageEmbed()
      .setColor(color)
      .setAuthor("User information", member!.user.displayAvatarURL({ format: "png", dynamic: true }))
      .setTitle(member!.user.tag)
      .setDescription(`${member} (ID: ${member!.user.id})`)
      .addFields(
        { name: "Joined on", value: joined.charAt(0).toUpperCase() + joined.slice(1) + timeAgo(joinAgo), inline: true },
        { name: "Account created on", value: created.charAt(0).toUpperCase() + created.slice(1) + timeAgo(createAgo), inline: true },
        { name: "Roles", value: userRoles },
      )
      .setThumbnail(member!.user.displayAvatarURL({ format: "png", dynamic: true }))
      .setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
    if (note) embed.addField("Note", note)
    interaction.reply(embed)
    function timeAgo(time: number) {
      let timeString: string
      if (time == 1) timeString = ` (${time} second ago)`
      else if (time < 60) timeString = ` (${time} seconds ago)`
      else if (time == 60) timeString = ` (${Math.round(time / 60)} minute ago)`
      else if (time < (60 * 60 * 1.5)) timeString = ` (${Math.round(time / 60)} minutes ago)`
      else if (time == (60 * 60 * 1.5)) timeString = ` (${Math.round(time / (60 * 60))} hour ago)`
      else if (time < (60 * 60 * 24 * 1.5)) timeString = ` (${Math.round(time / (60 * 60))} hours ago)`
      else if (time == (60 * 60 * 24 * 1.5)) timeString = ` (${Math.round(time / (60 * 60 * 24))} day ago)`
      else if (time < (60 * 60 * 24 * 30 * 1.5)) timeString = ` (${Math.round(time / (60 * 60 * 24))} days ago)`
      else if (time == (60 * 60 * 24 * 30 * 1.5)) timeString = ` (${Math.round(time / (60 * 60 * 24 * 30))} month ago)`
      else if (time < (60 * 60 * 24 * 365 * 1.5)) timeString = ` (${Math.round(time / (60 * 60 * 24 * 30))} months ago)`
      else if (time == (60 * 60 * 24 * 365 * 1.5)) timeString = ` (${Math.round(time / (60 * 60 * 24 * 365))} year ago)`
      else timeString = ` (${Math.round(time / (60 * 60 * 24 * 365))} years ago)`
      return timeString
    }
  }
}

export default command
