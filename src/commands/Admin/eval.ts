const { loadingColor, errorColor, successColor, neutralColor, blurple, listeningStatuses, watchingStatuses, playingStatuses } = require("../../config.json")
const fetch = require("node-fetch")
const { flag, code, name, countries } = require('country-emoji')
const fs = require("fs")
const country = require("countryjs")
const { client } = require("../../index.js")
import { db as mongoDb } from "../../lib/dbclient"
import { transpile } from "typescript"
import Discord from "discord.js"
import { inspect } from "util"
import { Command } from "../../index"

const command: Command = {
  name: "eval",
  description: "Evals the specified code.",
  usage: "+eval <code>",
  aliases: ["evaluate", "ev"],
  allowTip: false,
  roleWhitelist: ["620274909700161556"], //*
  channelWhitelist: ["624881429834366986", "730042612647723058", "551693960913879071"], // staff-bots bot-development admin-bots
  async execute(message: Discord.Message, args: string[], getString: (path: string, variables?: { [key: string]: string | number }, cmd?: string, lang?: string) => any) {
    const me = message.member
    const guild = message.guild
    const channel = message.channel as Discord.TextChannel
    const db = mongoDb
    const discord = Discord

    let evaled
    let codeToRun = args.join(" ").replace(/[“”]/gim, '"')
    if (codeToRun.includes("await ")) codeToRun = `(async () => {\n${codeToRun}\n})()`
    codeToRun = transpile(codeToRun)
    try {
      evaled = await eval(codeToRun)
      message.channel.send(inspect(evaled).substring(0, 255))
      console.log(inspect(evaled))
    } catch (error) {
      console.error(error)
      message.channel.send(`Something went wrong. Here is the error:\n${error}`)
    }
  }
}

export default command
