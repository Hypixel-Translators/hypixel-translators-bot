import Discord from "discord.js"
import { inspect } from "util"
import { loadingColor, errorColor, successColor, neutralColor, blurple, listeningStatuses, watchingStatuses, playingStatuses } from "../../config.json"
import fetch from "node-fetch"
import { clean, isZalgo } from "unzalgo"
import { flag, code, name, countries } from 'country-emoji'
import fs from "fs"
import country from 'countryjs'
import { client } from "../../index.js"

module.exports = {
  name: "eval",
  description: "Evals the specified code.",
  usage: "+eval <code>",
  aliases: ["evaluate", "ev"],
  roleWhitelist: ["620274909700161556"], //*
  channelWhitelist: ["624881429834366986", "730042612647723058", "551693960913879071"], // staff-bots bot-development admin-bots
  async execute(message: Discord.Message, args: string[], getString: (path: string, cmd?: string, lang?: string) => any) {
    const me = message.member
    const guild = message.guild
    const client = message.client

    let evaled
    try {
      evaled = await eval(args.join(" ").replace(/[“”]/gim, '"'))
      message.channel.send(inspect(evaled).substring(0, 255))
      console.log(inspect(evaled))
    } catch (error) {
      console.error(error)
      message.channel.send(`Something went wrong. Here is the error:\n${error}`)
    }
  }
}
