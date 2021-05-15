import { errorColor, neutralColor, prefix } from "../../config.json"
import Discord from "discord.js"
import fs from "fs"
import { Command, client } from "../../index"

const command: Command = {
  name: "help",
  description: "Shows you all available commands and general info about the bot.",
  aliases: ["commands", "cmds", "info", "botinfo"],
  usage: "+help [page | command name]",
  cooldown: 5,
  channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058"], //bots staff-bots bot-dev 
  allowDM: true,
  async execute(message: Discord.Message, args: string[], getString: (path: string, variables?: { [key: string]: string | number } | string, cmd?: string, lang?: string) => any) {
    const executedBy = getString("executedBy", { user: message.author.tag }, "global")
    const madeBy = getString("madeBy", { QkeleQ10: "QkeleQ10#8482" })

    // Define categories to get commands from and all pages
    const categories = ["Utility", "Info", "Projects"],
      pages = [
        { n: 0 },
        { n: 1, b: "🛠", t: "utilityHelp" },
        { n: 2, b: "ℹ", t: "infoHelp" },
        { n: 3, b: "<:crowdin:820381256016723988>", t: "projectsHelp" }
      ] as Page[]
    let pageIndex = 1
    categories.forEach(category => {
      const categoryCommands: string[] = []
      fs.readdirSync(`./src/commands/${category}/`).forEach(command => categoryCommands.push(command.split(".").shift()!))
      categoryCommands.forEach(cmd => {
        if (client.commands.get(cmd)!.dev) categoryCommands.splice(categoryCommands.indexOf(cmd), 1)
        else if (!client.commands.get(cmd)!.allowDM && message.channel.type === "dm") categoryCommands.splice(categoryCommands.indexOf(cmd), 1)
      })
      pages[pageIndex].f = categoryCommands
      pageIndex++
    })

    if (args[0] && args[0].startsWith(prefix)) args[0] = args[0].slice(1)
    if (!args[0] || Number(args[0])) {

      if (Number(args[0]) > pages.length || Number(args[0]) < 1) {
        const embed = new Discord.MessageEmbed()
          .setColor(errorColor)
          .setAuthor(getString("moduleName"))
          .setTitle(getString("page1Title"))
          .setDescription(getString("pageNotExist"))
          .setFooter(`${executedBy} | ${madeBy}`, message.author.displayAvatarURL({ format: "png", dynamic: true }))
        return message.channel.send(embed)
      }

      //Determine which page to use
      const page1 = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setAuthor(getString("moduleName"))
        .setTitle(getString("page1Title"))
        .setDescription(getString("commandsListTooltip", { developer: "<@!807917674477649943>", github: "(https://github.com/Hypixel-Translators/hypixel-translators-bot)" }))
        .addFields(
          { name: getString("pageNumber", { number: 2, total: pages.length }), value: `🛠 ${getString("utilityHelp")}`, inline: true },
          { name: getString("pageNumber", { number: 3, total: pages.length }), value: `ℹ ${getString("infoHelp")}`, inline: true },
          { name: getString("pageNumber", { number: 4, total: pages.length }), value: `<:crowdin:820381256016723988> ${getString("projectsHelp")}`, inline: true })
        .setFooter(`${executedBy} | ${madeBy}`, message.author.displayAvatarURL({ format: "png", dynamic: true }))

      pages[0].e = page1

      let page = 0
      if (args[0]?.length === 1) page = Number(args[0]) - 1

      let pageEmbed = fetchPage(page, pages, getString, executedBy, message) as Discord.MessageEmbed

      await message.channel.send(pageEmbed).then(async msg => {
        await msg.react("⏮"); await msg.react("◀"); await msg.react("▶"); await msg.react("⏭")

        const collector = msg.createReactionCollector((reaction: Discord.MessageReaction, user: Discord.User) => (reaction.emoji.name === "⏮" || reaction.emoji.name === "◀" || reaction.emoji.name === "▶" || reaction.emoji.name === "⏭") && user.id === message.author.id, { time: 120000 }) //2 minutes

        collector.on("collect", reaction => {
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
          pageEmbed = fetchPage(page, pages, getString, executedBy, message) as Discord.MessageEmbed
          msg.edit(pageEmbed)
        })

        collector.on("end", () => {
          msg.edit(getString("timeOut", { command: "`+help`" }))
          if (message.channel.type !== "dm") msg.reactions.removeAll()
          else msg.reactions.cache.forEach(reaction => reaction.users.remove()) //remove all reactions by the bot
        })
      })

    } else {

      const command = client.commands.get(args[0].toLowerCase()) || client.commands.find(c => c.aliases?.includes(args[0].toLowerCase()) || c.name === args[0].toLowerCase())

      if (!command || !command.name) throw "noCommand"

      let cmdDesc, cmdUsage
      if (command.category !== "Admin" && command.category !== "Staff") {
        cmdDesc = getString(`${command.name}.description`)
        cmdUsage = getString(`${command.name}.usage`)
      } else if (command.category === "Staff" && message.member?.roles.cache.has("768435276191891456") || command.category === "Admin" && message.member?.roles.cache.has("764442984119795732")) {
        cmdDesc = command.description
        cmdUsage = command.usage
      }

      if (command.dev && !message.member?.roles.cache.has("768435276191891456")) cmdDesc = getString("inDev") // Discord Staff

      const embed = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setAuthor(getString("moduleName"))
        .setTitle(getString("commandInfoFor") + `\`+${command.name}\``)
        .setDescription(cmdDesc || getString("staffOnly"))
        .setFooter(`${executedBy} | ${madeBy}`, message.author.displayAvatarURL({ format: "png", dynamic: true }))
      if (cmdUsage && cmdDesc !== getString("inDev")) {
        embed.addField(getString("usageField"), `\`${cmdUsage}\``, true)
        if (command.cooldown) {
          if (command.cooldown >= 120) embed.addField(getString("cooldownField"), `${command.cooldown / 60} ${getString("minutes")}`, true)
          else if (command.cooldown === 1) embed.addField(getString("cooldownField"), `${command.cooldown} ${getString("second")}`, true)
          else embed.addField(getString("cooldownField"), `${command.cooldown} ${getString("seconds")}`, true)
        }
        if (command.aliases?.length) {
          embed.addField(getString("aliasesField"), `\`+${command.aliases!.join("`, `+")}\``, true)
        }
      }
      message.channel.send(embed)
    }
  }
}

function fetchPage(page: number, pages: Page[], getString: (path: string, variables?: { [key: string]: string | number } | string, cmd?: string, lang?: string) => any, executedBy: string, message: Discord.Message) {
  if (page > pages.length - 1) page = pages.length - 1
  if (page < 0) page = 0
  let pageEmbed: Discord.MessageEmbed

  if (pages[page]) {
    if (pages[page].e) pageEmbed = pages[page].e!
    else if (pages[page].f) {
      pageEmbed = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setAuthor(getString("moduleName"))
        .setTitle(`${pages[page].b} ${getString(pages[page].t!)}`)
        .setFooter(`${getString("page", { number: page + 1, total: pages.length })} | ${executedBy}`, message.author.displayAvatarURL({ format: "png", dynamic: true }))
      pages[page].f!.forEach(f => pageEmbed!.addField(`\`${getString(`${f}.usage`)}\``, getString(`${f}.description`)))
    } else return console.error(`Help page ${page} has no embed fields specified!`)
  } else return console.error(`Tried accessing help page ${page} but it doesn't exist in the pages array!`)

  return pageEmbed
}

interface Page {
  n: number
  f?: string[]
  b?: string
  t?: string
  e?: Discord.MessageEmbed
}

export default command
