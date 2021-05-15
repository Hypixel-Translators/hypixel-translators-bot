import { successColor } from "../../config.json"
import Discord from "discord.js"
import { Command } from "../../index"

const command: Command = {
  name: "say",
  description: "Says something in a specific channel.",
  usage: "+say <message>",
  cooldown: 600,
  aliases: ["parrot", "repeat", "send"],
  roleWhitelist: ["768435276191891456"], //Discord Staff
  async execute(message: Discord.Message, args: string[]) {
    if (!args[0]) throw "noMessage"
    const sendTo = message.client.channels.cache.get(args[0].replace(/[\\<>@#&!]/g, "")) as (Discord.TextChannel | Discord.NewsChannel)
    args.splice(0, 1)
    const toSend = args.join(" ")

    if (!sendTo) throw "noChannel"
    if (!toSend) throw "noMessage"
    if (!message.member!.permissionsIn(sendTo).has("SEND_MESSAGES")) throw "noPermission"

    if (message.member!.permissions.has("MANAGE_ROLES")) sendTo.send(toSend)
    else sendTo.send(">>> " + toSend)
    const embed = new Discord.MessageEmbed()
      .setColor(successColor)
      .setAuthor("Message")
      .setTitle("Success! Message sent.")
      .setDescription(`${sendTo}:\n${toSend}`)
      .setFooter(`Executed by ${message.author.tag}`, message.author.displayAvatarURL({ format: "png", dynamic: true }))
    message.channel.send(embed)
  }
}

export default command
