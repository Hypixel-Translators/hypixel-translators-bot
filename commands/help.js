const { loadingColor, errorColor, successColor, neutralColor } = require("../config.json");
const { prefix } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
  name: "help",
  description: "Shows you all available commands and general info about the bot.",
  aliases: ["commands", "cmds", "info", "botinfo"],
  usage: "+help [name of command]",
  channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058", "749391414600925335"],
  allowDM: true,
  async execute(strings, message, args) {
    const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
    const madeBy = strings.madeBy.replace("%%QkeleQ10%%", "QkeleQ10#6046")

    let pages = ['1', '2', '3']
    let page = 1

    const page1 = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setAuthor(strings.moduleName)
        .setTitle(strings.page1Title)
        .setDescription(strings.commandsListTooltip.replace("%%QkeleQ10%%", "<@722738307477536778>").replace("%%github%%", "(https://github.com/stannya/hypixel-translators-bot-discord)").replace("%%translate%%", "(https://discordapp.com/channels/549503328472530974/732587569744838777/754410226601427044)"))
        .addFields(
          { name: strings.pageNumber.replace("%%number%%", "2").replace("%%total%%", pages.length), value: strings.utilityHelp.replace("%%badge%%", "🛠"), inline: false },
          { name: strings.pageNumber.replace("%%number%%", "3").replace("%%total%%", pages.length), value: strings.infoHelp.replace("%%badge%%", "ℹ"), inline: false })
        .setFooter(executedBy + " | " + madeBy);

    const page2 = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setAuthor(strings.moduleName)
        .setTitle(strings.utilityHelp.replace("%%badge%%", "🛠"))
        .addFields(
          { name: "`" + strings.help.usage + "`", value: strings.help.description, inline: false },
          { name: "`" + strings.language.usage + "`", value: strings.language.description, inline: false },
          { name: "`" + strings.prefix.usage + "`", value: strings.prefix.description, inline: false },
          { name: "`" + strings.quote.usage + "`", value: strings.quote.description, inline: false },
          { name: "`" + strings.mention.usage + "`", value: strings.mention.description, inline: false },
          { name: "`" + strings.context.usage + "`", value: strings.context.description, inline: false },
          { name: "`" + strings.issue.usage + "`", value: strings.issue.description, inline: false },
          { name: "`" + strings.ping.usage + "`", value: strings.ping.description, inline: false }
        )
        .setFooter(strings.page.replace("%%number%%", "2").replace("%%total%%", pages.length) + " | " + executedBy)

    const page3 = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setAuthor(strings.moduleName)
        .setTitle(strings.infoHelp.replace("%%badge%%", "ℹ"))
        .addFields(
          { name: "`" + strings.invite.usage + "`", value: strings.invite.description, inline: false },
          { name: "`" + strings.guidelines.usage + "`", value: strings.guidelines.description, inline: false },
          { name: "`" + strings.hypixel.usage + "`", value: strings.hypixel.description, inline: false },
          { name: "`" + strings.quickplay.usage + "`", value: strings.quickplay.description, inline: false },
          { name: "`" + strings.skyblockaddons.usage + "`", value: strings.skyblockaddons.description, inline: false },
          { name: "`" + strings.thread.usage + "`", value: strings.thread.description, inline: false },
          { name: "`" + strings.twitter.usage + "`", value: strings.twitter.description, inline: false }
        )
        .setFooter(strings.page.replace("%%number%%", "3").replace("%%total%%", pages.length) + " | " + executedBy)

    let pageEmbed
    if (page == 1) { pageEmbed = page1 }
    if (page == 2) { pageEmbed = page2 }
    if (page == 3) { pageEmbed = page3 }

    if (!args.length || args[0] === "1") {
      message.channel.send(page1).then(msg => { msg.react("⏮").then(r => { msg.react("◀").then(r => { msg.react("▶").then(r => { msg.react("⏭")

      const userId = message.author.id

          const backwardsFilter = (reaction, user) => reaction.emoji.name == "◀" && user.id === userId
          const forwardFilter = (reaction, user) => reaction.emoji.name == "▶" && user.id === userId
          const firstFilter = (reaction, user) => reaction.emoji.name == "⏮" && user.id === userId
          const skipFilter = (reaction, user) => reaction.emoji.name == "⏭" && user.id === userId

          const backwards = msg.createReactionCollector(backwardsFilter, { time: 60000}) //1 minute to react
          const forward = msg.createReactionCollector(forwardFilter, { time: 60000}) //1 minute to react
          const first = msg.createReactionCollector(firstFilter, { time: 60000}) //1 minute to react
          const skip = msg.createReactionCollector(skipFilter, { time: 60000}) //1 minute to react

          backwards.on('end', r => {
            msg.reactions.removeAll()
            msg.edit(strings.timeOut)
          })

          backwards.on('collect', r => {
            if (page === 1) {
              clearReaction(msg)
              return;
            }
            page--;
            editPage(page)
          })

          forward.on('collect', r => {
            if (page === pages.length) {
              clearReaction(msg)
              return;
            }
            page++;
            editPage(page)
          })

          first.on('collect', r => {
            page = 1
            editPage(page)
          })

          skip.on('collect', r => {
            page = pages.length
            editPage(page)
          })

          function clearReaction(message) {
            const userReactions = message.reactions.cache.filter(reaction => reaction.users.cache.has(userId));
            for (const reaction of userReactions.values())
              reaction.users.remove(userId);
          }
          function editPage(page) {
            let pageEmbed
            if (page == 1) { pageEmbed = page1 }
            if (page == 2) { pageEmbed = page2 }
            if (page == 3) { pageEmbed = page3 }
            page2.setFooter(strings.page.replace("%%number%%", page).replace("%%total%%", pages.length) + " | " + executedBy)
            page3.setFooter(strings.page.replace("%%number%%", page).replace("%%total%%", pages.length) + " | " + executedBy)
            msg.edit(pageEmbed)
            clearReaction(msg)
          }
        })
      })
    })
  })

    } else if (args[0] === "2") {
      message.channel.send(page2)

    } else if (args[0] === "3") {
      message.channel.send(page3)
      
    } else {

      const { commands } = message.client

      const command = commands.get(args[0].toLowerCase()) || commands.find(c => (c.aliases && c.aliases.includes(args[0].toLowerCase())) || c.name.includes(args[0].toLowerCase()))

      if (!command) {
        const embed = new Discord.MessageEmbed()
          .setColor(errorColor)
          .setAuthor(strings.moduleName)
          .setTitle(strings.commandInfo)
          .setDescription(strings.commandNotExist)
          .setFooter(executedBy + madeBy);
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
        .setFooter(executedBy + madeBy);
      if (command.cooldown) {
        embed.addFields({ name: strings.cooldownField, value: cooldown, inline: true })
      }
      if (command.aliases) {
        embed.addFields({ name: strings.aliasesField, value: "+" + command.aliases.join(", +"), inline: true })
      }
      message.channel.send(embed);
    }
  }
};