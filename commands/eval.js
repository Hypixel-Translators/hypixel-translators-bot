const { loadingColor, errorColor, successColor, neutralColor, langdb } = require("../config.json");
const fetch = require("node-fetch")
const Discord = require("discord.js")
const client = new Discord.Client()
const { inspect } = require("util");
const { clean, isZalgo } = require("unzalgo")

module.exports = {
  name: "eval",
  description: "Evals the specified code.",
  usage: "+eval <code>",
  aliases: ["evaluate"],
  cooldown: 60,
  channelWhiteList: ["624881429834366986", "730042612647723058", "551693960913879071"], // staff-bots bot-development admin-bots
  async execute(strings, message, args) {
    if (!message.member.hasPermission("ADMINISTRATOR")) return

    const me = message.member
    const guild = message.guild
    const client = message.client

    let evaled
    try {
      evaled = await eval(args.join(" "))
      message.channel.send(inspect(evaled).substring(0, 255))
      console.log(inspect(evaled))
    } catch (error) {
      console.error(error)
      message.channel.send(strings.error + "\n" + error)
    }
  }
}
