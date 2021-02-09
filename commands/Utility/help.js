const { errorColor, neutralColor, prefix } = require("../../config.json")
const Discord = require("discord.js")
const fs = require("fs")

module.exports = {
  name: "help",
  description: "Shows you all available commands and general info about the bot.",
  aliases: ["commands", "cmds", "info", "botinfo"],
  usage: "+help [page | command name]",
  cooldown: 5,
  channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058", "749391414600925335"], //bots staff-bots bot-dev bot-translators
  allowDM: true,
  async execute(message, strings, args) {
    const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
    const madeBy = strings.madeBy.replace("%%QkeleQ10%%", "QkeleQ10#6046")

    //Define command categories
    const utilityCmds = []
    fs.readdirSync("./commands/Utility/").forEach(command => utilityCmds.push(command.split(".").shift()))
    const infoCmds = []
    fs.readdirSync("./commands/Info/").forEach(command => infoCmds.push(command.split(".").shift()))
    utilityCmds.forEach(cmd => {
      if (message.client.commands.get(cmd).dev) utilityCmds.splice(utilityCmds.indexOf(cmd), 1)
    })
    infoCmds.forEach(cmd => {
      if (message.client.commands.get(cmd).dev) infoCmds.splice(infoCmds.indexOf(cmd), 1)
    })

    //Define all pages
    const pages = [
      { "n": 0 },
      { "n": 1, "f": utilityCmds, "b": "🛠", "t": "utilityHelp" },
      { "n": 2, "f": infoCmds, "b": "ℹ", "t": "infoHelp" }
    ]

    if (args[0] && args[0].startsWith(prefix)) args[0] = args[0].slice(1)
    if (!args[0] || !isNaN(args[0])) {

      if (args[0] > pages.length || args[0] < 1) {
        const embed = new Discord.MessageEmbed()
          .setColor(errorColor)
          .setAuthor(strings.moduleName)
          .setTitle(strings.page1Title)
          .setDescription(strings.pageNotExist)
          .setFooter(executedBy + " | " + madeBy, message.author.displayAvatarURL())
        return message.channel.send(embed)
      }

      //Determine which page to use

      const page1 = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setAuthor(strings.moduleName)
        .setTitle(strings.page1Title)
        .setDescription(strings.commandsListTooltip.replace("%%developer%%", "<@722738307477536778>").replace("%%github%%", "(https://github.com/Hypixel-Translators/hypixel-translators-bot)"))
        .addFields(
          { name: strings.pageNumber.replace("%%number%%", "2").replace("%%total%%", pages.length), value: strings.utilityHelp.replace("%%badge%%", "🛠"), inline: true },
          { name: strings.pageNumber.replace("%%number%%", "3").replace("%%total%%", pages.length), value: strings.infoHelp.replace("%%badge%%", "ℹ"), inline: true })
        .setFooter(executedBy + " | " + madeBy, message.author.displayAvatarURL())

      pages[0].e = page1

      let page = 0
      if (args[0]) if (args[0].length = 1) page = args[0] - 1
      let pageEmbed

      pageEmbed = await fetchPage(page, pages, strings, executedBy, message, pageEmbed)
        .catch(error => console.error(error))

      await message.channel.send(pageEmbed).then(async msg => {
        await msg.react("⏮"); await msg.react("◀"); await msg.react("▶"); await msg.react("⏭")

        const filter = (reaction, user) => {
          return (reaction.emoji.name === "⏮" || reaction.emoji.name === "◀" || reaction.emoji.name === "▶" || reaction.emoji.name === "⏭") && user.id === message.author.id
        }

        const collector = msg.createReactionCollector(filter, { time: 60000 }) //1 minute

        collector.on("collect", async (reaction, user) => {
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
          pageEmbed = await fetchPage(page, pages, strings, executedBy, message, pageEmbed)
          msg.edit(pageEmbed)
        })

        collector.on("end", async () => {
          msg.edit(strings.timeOut)
          if (message.channel.type !== "dm") msg.reactions.removeAll()
          setTimeout(() => {
            msg.suppressEmbeds()
          }, 10000)
        })
      })

    } else {

      const { commands } = message.client
      let command

      try {
        command = commands.get(args[0].toLowerCase()) || commands.find(c => (c.aliases && c.aliases.includes(args[0].toLowerCase())) || c.name === args[0].toLowerCase())
      } catch (error) {
        console.error(error)
      }

      if (!command || !command.name) {
        const embed = new Discord.MessageEmbed()
          .setColor(errorColor)
          .setAuthor(strings.moduleName)
          .setTitle(strings.commandInfo)
          .setDescription(strings.commandNotExist)
          .setFooter(executedBy + " | " + madeBy, message.author.displayAvatarURL())
        return message.channel.send(embed)
      }

      if (strings[command.name]) {
        if (strings[command.name].description) var cmdDesc = strings[command.name].description
        if (strings[command.name].usage) var cmdUsage = strings[command.name].usage
      }

      if (command.dev) cmdDesc = strings.inDev

      const embed = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setAuthor(strings.moduleName)
        .setTitle(strings.commandInfoFor + "`+" + command.name + "`")
        .setDescription(cmdDesc || strings.staffOnly)
        .setFooter(executedBy + " | " + madeBy, message.author.displayAvatarURL())
      if (cmdUsage && cmdDesc !== strings.inDev) {
        embed.addFields({ name: strings.usageField, value: "`" + cmdUsage + "`", inline: true })
        if (command.cooldown) {
          if (command.cooldown >= 120) embed.addFields({ name: strings.cooldownField, value: `${command.cooldown / 60} ${strings.minutes}`, inline: true })
          else if (command.cooldown === 1) embed.addFields({ name: strings.cooldownField, value: `${command.cooldown} ${strings.second}`, inline: true })
          else embed.addFields({ name: strings.cooldownField, value: `${command.cooldown} ${strings.seconds}`, inline: true })
        }
        if (command.aliases) {
          embed.addFields({ name: strings.aliasesField, value: "`+" + command.aliases.join("`, `+") + "`", inline: true })
        }
      }
      message.channel.send(embed)
    }
  }
}

async function fetchPage(page, pages, strings, executedBy, message, pageEmbed) {
  if (page > pages.length - 1) page = pages.length - 1
  if (page < 0) page = 0

  if (pages[page]) {
    if (pages[page].e) {
      pageEmbed = pages[page].e
    } else if (pages[page].f) {
      pageEmbed = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setAuthor(strings.moduleName)
        .setTitle(strings[pages[page].t].replace("%%badge%%", pages[page].b))
        .setFooter(strings.page.replace("%%number%%", page + 1).replace("%%total%%", pages.length) + " | " + executedBy, message.author.displayAvatarURL())
      pages[page].f.forEach(f => pageEmbed.addFields({ name: `\`${strings[f].usage}\``, value: strings[f].description }))
    } else return console.error("no embed details")
  } else return console.error("no embed listing - internal error")

  return pageEmbed
}
