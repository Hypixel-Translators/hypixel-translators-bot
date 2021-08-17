const { loadingColor, errorColor, successColor, neutralColor, listeningStatuses, watchingStatuses, playingStatuses } = require("../../config.json")
const fetch = require("node-fetch")
const { flag, code, name, countries } = require("country-emoji")
const fs = require("fs")
const country = require("countryjs")
const { updateButtonColors, getUUID, updateRoles, getXpNeeded } = require("../../lib/util")
const { crowdinVerify } = require("../../lib/crowdinverify")
const { leveling } = require("../../lib/leveling")
import { db as mongoDb } from "../../lib/dbclient"
import { transpile } from "typescript"
import discord from "discord.js"
import { inspect } from "util"
import { Command, client as Client, GetStringFunction } from "../../index"

const command: Command = {
  name: "eval",
  description: "Evals the specified code.",
  roleWhitelist: ["620274909700161556"], //*
  channelWhitelist: ["624881429834366986", "730042612647723058", "551693960913879071"], // staff-bots bot-development admin-bots
  options: [{
    type: "STRING",
    name: "code",
    description: "The code to run",
    required: true
  }],
  async execute(interaction, getString: GetStringFunction) {
    const me = interaction.member ?? interaction.user,
      guild = interaction.guild!,
      channel = interaction.channel as discord.TextChannel,
      db = mongoDb,
      Discord = discord,
      client = Client

    await interaction.deferReply()
    let evaled,
      codeToRun = interaction.options.getString("code", true).replaceAll(/[“”]/gim, '"')
    if (codeToRun.includes("await ")) codeToRun = `(async () => {\n${codeToRun}\n})()`
    codeToRun = transpile(codeToRun)
    try {
      evaled = await eval(codeToRun)
      await interaction.editReply(inspect(evaled).substring(0, 255))
      console.log(inspect(evaled))
    } catch (error) {
      console.error(error)
      await interaction.editReply(`Something went wrong. Here is the error:\n${error}`)
    }
  }
}

export default command
