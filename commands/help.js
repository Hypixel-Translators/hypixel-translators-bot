const { loadingColor, errorColor, successColor, neutralColor } = require("../config.json");
const { prefix } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
  name: "help",
  description: "Shows you all available commands and general info about the bot.",
  aliases: ["commands", "cmds", "info", "botinfo"],
  usage: "+help [page | command name]",
  cooldown: 60,
  channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058", "749391414600925335"],
  allowDM: true,
  async execute(strings, message, args) {
    const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
    const madeBy = strings.madeBy.replace("%%QkeleQ10%%", "QkeleQ10#6046")

    if (!args[0] || args[0].length == 1) {

      //Define all pages and determine which page to use
      const pages = [
        { "n": 0 },
        { "n": 1, "f": ["help", "language", "prefix", "quote", "mention", "context", "issue", "ping"], "b": "🛠", "t": "utilityHelp" },
        { "n": 2, "f": ["invite", "guidelines", "hypixel", "quickplay", "skyblockaddons", "thread", "twitter"], "b": "ℹ", "t": "infoHelp" }
      ]

      const page1 = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setAuthor(strings.moduleName)
        .setTitle(strings.page1Title)
        .setDescription(strings.commandsListTooltip.replace("%%QkeleQ10%%", "<@722738307477536778>").replace("%%github%%", "(https://github.com/stannya/hypixel-translators-bot-discord)").replace("%%translate%%", "(https://discordapp.com/channels/549503328472530974/732587569744838777/754410226601427044)"))
        .addFields(
          { name: strings.pageNumber.replace("%%number%%", "2").replace("%%total%%", pages.length), value: strings.utilityHelp.replace("%%badge%%", "🛠"), inline: false },
          { name: strings.pageNumber.replace("%%number%%", "3").replace("%%total%%", pages.length), value: strings.infoHelp.replace("%%badge%%", "ℹ"), inline: false })
        .setFooter(executedBy + " | " + madeBy)

      pages[1].e = page1

      let page = 1
      if (args[0]) if (args[0].length = 1) page = args[0]
      let pageEmbed

      pageEmbed = await fetchPage(page, pages, strings, executedBy, madeBy, pageEmbed)
        .catch(error => console.error(error))

      await message.channel.send(pageEmbed).then(async msg => {
        await msg.react("⏮"); await msg.react("◀"); await msg.react("▶"); await msg.react("⏭")

        const filter = (reaction, user) => {
          return (reaction.emoji.name === '⏮' || reaction.emoji.name === '◀' || reaction.emoji.name === '▶' || reaction.emoji.name === '⏭') && user.id === message.author.id
        }

        const collector = message.createReactionCollector(filter, { time: 60000 })

        collector.on('collect', (reaction, user) => {
          if (reaction.emoji.name === "⏮") { //First
            page = 100
            pageEmbed = fetchPage(page, pages, strings, executedBy, madeBy, pageEmbed)
            msg.edit(pageEmbed)
          }
          if (reaction.emoji.name === "◀") { //Previous
            page--
            pageEmbed = fetchPage(page, pages, strings, executedBy, madeBy, pageEmbed)
            msg.edit(pageEmbed)
          }
          if (reaction.emoji.name === "▶") { //Next
            page++
            pageEmbed = fetchPage(page, pages, strings, executedBy, madeBy, pageEmbed)
            msg.edit(pageEmbed)
          }
          if (reaction.emoji.name === "⏭") { //Last
            page = -1
            pageEmbed = fetchPage(page, pages, strings, executedBy, madeBy, pageEmbed)
            msg.edit(pageEmbed)
          }
        })
      })

    } else {

      const { commands } = message.client
      let command

      try {
        command = commands.get(args[0].toLowerCase()) || commands.find(c => (c.aliases && c.aliases.includes(args[0].toLowerCase())) || c.name.includes(args[0].toLowerCase()))
      } catch (error) {
        console.error(error)
      }

      if (!command || !command.name) {
        const embed = new Discord.MessageEmbed()
          .setColor(errorColor)
          .setAuthor(strings.moduleName)
          .setTitle(strings.commandInfo)
          .setDescription(strings.commandNotExist)
          .setFooter(executedBy + " | " + madeBy);
        return message.channel.send(embed);
      }

      const cooldown = command.cooldown + " " + strings.seconds;
      const embed = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setAuthor(strings.moduleName)
        .setTitle(strings.commandInfoFor + "`+" + command.name + "`")
        .setDescription(strings[command.name].description || command.description)
        .addFields(
          {
            name: strings.usageField,
            value: "`" + (strings[command.name].usage || command.usage) + "`",
            inline: true
          }
        )
        .setFooter(executedBy + " | " + madeBy);
      if (command.cooldown) {
        embed.addFields({ name: strings.cooldownField, value: cooldown, inline: true })
      }
      if (command.aliases) {
        embed.addFields({ name: strings.aliasesField, value: "+" + command.aliases.join(", +"), inline: true })
      }
      message.channel.send(embed)

    }
  }
}

async function fetchPage(page, pages, strings, executedBy, madeBy, pageEmbed) {
  console.log(page)
  if (page > pages.length) page = 0
  if (page < 0) page = pages.length
  console.log(page)
  console.log(pages[page])

  if (pages[page]) {
    if (pages[page].e) {
      pageEmbed = pages[page].e
    } else if (pages[page].f) {
      pageEmbed = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setAuthor(strings.moduleName)
        .setTitle(strings[pages[page].t].replace("%%badge%%", pages[page].b))
        .setFooter(executedBy + " | " + madeBy)
      pages[page].f.forEach(f => pageEmbed.addFields({ name: strings[f].usage, value: strings[f].description }))
    } else return console.error("no embed details")
  } else return console.error("no embed listing - internal error")

  return pageEmbed
}