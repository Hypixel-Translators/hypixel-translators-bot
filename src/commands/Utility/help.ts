import { errorColor, neutralColor, prefix } from "../../config.json"
import Discord from "discord.js"
import fs from "fs"
import { client } from "../../index"
import { Command } from "../../lib/dbclient"

const command: Command = {
  name: "help",
  description: "Shows you all available commands and general info about the bot.",
  aliases: ["commands", "cmds", "info", "botinfo"],
  usage: "+help [page | command name]",
  cooldown: 5,
  channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058"], //bots staff-bots bot-dev bot-translators
  allowDM: true,
  async execute(message: Discord.Message, args: string[], getString: (path: string, cmd?: string, lang?: string) => any) {
    const executedBy = getString("executedBy", "global").replace("%%user%%", message.author.tag)
    const madeBy = getString("madeBy").replace("%%QkeleQ10%%", "QkeleQ10#6046")

    //Define command categories
    const utilityCmds: string[] = []
    fs.readdirSync("./commands/Utility/").forEach(command => utilityCmds.push(command.split(".").shift()!))
    const infoCmds: string[] = []
    fs.readdirSync("./commands/Info/").forEach(command => infoCmds.push(command.split(".").shift()!))
    utilityCmds.forEach(cmd => {
      if (client.commands.get(cmd)!.dev) utilityCmds.splice(utilityCmds.indexOf(cmd), 1)
      else if (!client.commands.get(cmd)!.allowDM && message.channel.type === "dm") utilityCmds.splice(utilityCmds.indexOf(cmd), 1)
    })
    infoCmds.forEach(cmd => {
      if (client.commands.get(cmd)!.dev) infoCmds.splice(infoCmds.indexOf(cmd), 1)
      else if (!client.commands.get(cmd)!.allowDM && message.channel.type === "dm") utilityCmds.splice(utilityCmds.indexOf(cmd), 1)
    })

    //Define all pages
    const pages = [
      { "n": 0 },
      { "n": 1, "f": utilityCmds, "b": "🛠", "t": "utilityHelp" },
      { "n": 2, "f": infoCmds, "b": "ℹ", "t": "infoHelp" }
    ] as Page[]

    if (args[0] && args[0].startsWith(prefix)) args[0] = args[0].slice(1)
    if (!args[0] || !Number(args[0])) {

      if (Number(args[0]) > pages.length || Number(args[0]) < 1) {
        const embed = new Discord.MessageEmbed()
          .setColor(errorColor)
          .setAuthor(getString("moduleName"))
          .setTitle(getString("page1Title"))
          .setDescription(getString("pageNotExist"))
          .setFooter(executedBy + " | " + madeBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
        return message.channel.send(embed)
      }

      //Determine which page to use
      const page1 = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setAuthor(getString("moduleName"))
        .setTitle(getString("page1Title"))
        .setDescription(getString("commandsListTooltip").replace("%%developer%%", "<@722738307477536778>").replace("%%github%%", "(https://github.com/Hypixel-Translators/hypixel-translators-bot)"))
        .addFields(
          { name: getString("pageNumber").replace("%%number%%", "2").replace("%%total%%", pages.length), value: getString("utilityHelp").replace("%%badge%%", "🛠"), inline: true },
          { name: getString("pageNumber").replace("%%number%%", "3").replace("%%total%%", pages.length), value: getString("infoHelp").replace("%%badge%%", "ℹ"), inline: true })
        .setFooter(executedBy + " | " + madeBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))

      pages[0].e = page1

      let page = 0
      if (args[0]?.length === 1) page = Number(args[0]) - 1

      let pageEmbed = await fetchPage(page, pages, getString, executedBy, message)
        .catch(error => console.error(error)) as Discord.MessageEmbed

      await message.channel.send(pageEmbed).then(async msg => {
        await msg.react("⏮"); await msg.react("◀"); await msg.react("▶"); await msg.react("⏭")

        const filter = (reaction: Discord.MessageReaction, user: Discord.User) => {
          return (reaction.emoji.name === "⏮" || reaction.emoji.name === "◀" || reaction.emoji.name === "▶" || reaction.emoji.name === "⏭") && user.id === message.author.id
        }

        const collector = msg.createReactionCollector(filter, { time: 60000 }) //1 minute

        collector.on("collect", async reaction => {
          if (reaction.emoji.name === "⏮") page = 0 //First
          if (reaction.emoji.name === "⏭") page = pages.length - 1 //Last
          if (reaction.emoji.name === "◀") { //Previous
            page--
            if (page < 0) page = 0
          }
          if (reaction.emoji.name === "▶") { //Next
            page++
            if (page > pages.length - 1) page = pages.length - 1
          }
          if (message.channel.type !== "dm") reaction.users.remove(message.author.id)
          pageEmbed = await fetchPage(page, pages, getString, executedBy, message) as Discord.MessageEmbed
          msg.edit(pageEmbed)
        })

        collector.on("end", async () => {
          msg.edit(getString("timeOut"))
          if (message.channel.type !== "dm") msg.reactions.removeAll()
          else msg.reactions.cache.forEach(reaction => reaction.users.remove(message.client.user!.id)) //remove all reactions by the bot
          msg.suppressEmbeds()
        })
      })

    } else {

      let command

      try {
        command = client.commands.get(args[0].toLowerCase()) || client.commands.find(c => (c.aliases && c.aliases.includes(args[0].toLowerCase())) || c.name === args[0].toLowerCase())
      } catch (error) {
        console.error(error)
      }

      if (!command || !command.name) {
        const embed = new Discord.MessageEmbed()
          .setColor(errorColor)
          .setAuthor(getString("moduleName"))
          .setTitle(getString("commandInfo"))
          .setDescription(getString("commandNotExist"))
          .setFooter(executedBy + " | " + madeBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
        return message.channel.send(embed)
      }

      if (getString(command.name)) {
        if (getString(`${command.name}.description`)) var cmdDesc = getString(`${command.name}.description`)
        if (getString(`${command.name}.usage`)) var cmdUsage = getString(`${command.name}.usage`)
      }

      if (command.dev) cmdDesc = getString("inDev")

      const embed = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setAuthor(getString("moduleName"))
        .setTitle(getString("commandInfoFor") + `\`+${command.name}\``)
        .setDescription(cmdDesc || getString("staffOnly"))
        .setFooter(executedBy + " | " + madeBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
      if (cmdUsage && cmdDesc !== getString("inDev")) {
        embed.addFields({ name: getString("usageField"), value: "`" + cmdUsage + "`", inline: true })
        if (command.cooldown) {
          if (command.cooldown >= 120) embed.addFields({ name: getString("cooldownField"), value: `${command.cooldown / 60} ${getString("minutes")}`, inline: true })
          else if (command.cooldown === 1) embed.addFields({ name: getString("cooldownField"), value: `${command.cooldown} ${getString("second")}`, inline: true })
          else embed.addFields({ name: getString("cooldownField"), value: `${command.cooldown} ${getString("seconds")}`, inline: true })
        }
        if (command.aliases) {
          embed.addFields({ name: getString("aliasesField"), value: "`+" + command.aliases.join("`, `+") + "`", inline: true })
        }
      }
      message.channel.send(embed)
    }
  }
}

async function fetchPage(page: number, pages: Page[], getString: (path: string, cmd?: string, lang?: string) => any, executedBy: string, message: Discord.Message) {
  if (page > pages.length - 1) page = pages.length - 1
  if (page < 0) page = 0
  let pageEmbed: Discord.MessageEmbed | undefined

  if (pages[page]) {
    if (pages[page].e) {
      pageEmbed = pages[page].e
    } else if (pages[page].f) {
      pageEmbed = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setAuthor(getString("moduleName"))
        .setTitle(getString(pages[page].t!).replace("%%badge%%", pages[page].b))
        .setFooter(`${getString("page").replace("%%number%%", page + 1).replace("%%total%%", pages.length)} | ${executedBy}`, message.author.displayAvatarURL({ format: "png", dynamic: true }))
      pages[page].f!.forEach(f => pageEmbed!.addField(`\`${getString(`${f}.usage`)}\``, getString(`${f}.description`)))
    } else return console.error("no embed details")
  } else return console.error("no embed listing - internal error")

  return pageEmbed as Discord.MessageEmbed
}

interface Page {
  n: number
  f?: string[]
  b?: string
  t?: string
  e?: Discord.MessageEmbed
}

export default command
