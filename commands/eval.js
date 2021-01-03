const { loadingColor, errorColor, successColor, neutralColor, blurple, langdb, listenStatuses, watchStatuses } = require("../config.json")
const fetch = require("node-fetch")
const Discord = require("discord.js")
const { inspect } = require("util")
const { clean, isZalgo } = require("unzalgo")
const { flag, code, name, countries } = require('country-emoji')
const fs = require("fs")

module.exports = {
  name: "eval",
  description: "Evals the specified code.",
  usage: "+eval <code>",
  aliases: ["evaluate", "ev"],
  roleWhitelist: ["620274909700161556"], //*
  channelWhitelist: ["624881429834366986", "730042612647723058", "551693960913879071"], // staff-bots bot-development admin-bots
  async execute(message, strings, args) {
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
