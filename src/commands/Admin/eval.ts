const { loadingColor, errorColor, successColor, neutralColor, blurple, listeningStatuses, watchingStatuses, playingStatuses } = require("../../config.json")
const fetch = require("node-fetch")
//@ts-ignore
const { flag, code, name, countries } = require('country-emoji')
const fs = require("fs")
const country = require("countryjs")
const { client } = require("../../index.js")
const dbclient = require("../../lib/dbclient")
import { transpile } from "typescript"
import Discord from "discord.js"
import { inspect } from "util"
import { Command } from "../../index"


const command: Command = {
  name: "eval",
  description: "Evals the specified code.",
  usage: "+eval <code>",
  aliases: ["evaluate", "ev"],
  roleWhitelist: ["620274909700161556"], //*
  channelWhitelist: ["624881429834366986", "730042612647723058", "551693960913879071"], // staff-bots bot-development admin-bots
  async execute(message: Discord.Message, args: string[], getString: (path: string, cmd?: string, lang?: string) => any) {
    const me = message.member
    const guild = message.guild

    let evaled
    let code = args.join(" ").replace(/[“”]/gim, '"')
    if (code.includes("await ")) code = `(async () => {\n${code}\n})()`
    code = transpile(code)
    try {
      evaled = await eval(code)
      message.channel.send(inspect(evaled).substring(0, 255))
      console.log(inspect(evaled))
    } catch (error) {
      console.error(error)
      message.channel.send(`Something went wrong. Here is the error:\n${error}`)
    }
  }
}

export default command
