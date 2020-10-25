const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const { prefix } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
  name: "help",
  description: "Shows you all available commands and general info about the bot.",
  aliases: ["commands", "cmds", "info", "botinfo"],
  usage: "help [name of command]",
  channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058", "749391414600925335"],
  allowDM: true,
  async execute(strings, message, args) {
    const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
    const madeBy = strings.madeBy.replace("%%QkeleQ10%%", "QkeleQ10#6046")
    const { commands } = message.client;

    if (!args.length) {
      const embed = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setAuthor(strings.moduleName)
        .setTitle(strings.commandsListTitle)
        .setDescription(strings.commandsListTooltip.replace("%%QkeleQ10%%", "<@722738307477536778>").replace("%%github%%", "(https://github.com/QkeleQ10/hypixel-translators-bot-discord)").replace("%%translate%%", "(https://discordapp.com/channels/549503328472530974/732587569744838777/754410226601427044)"))
        .addFields(
          { name: "`" + strings.help.usage + "`", value: strings.help.description, inline: false },
          { name: "`" + strings.language.usage + "`", value: strings.language.description, inline: false },
          { name: "`" + strings.prefix.usage + "`", value: strings.prefix.description, inline: false },
          { name: "`" + strings.quote.usage + "`", value: strings.quote.description, inline: false },
          { name: "`" + strings.boop.usage + "`", value: strings.boop.description, inline: false },
          { name: "`" + strings.mention.usage + "`", value: strings.mention.description, inline: false },
          { name: "`" + strings.context.usage + "`", value: strings.context.description, inline: false },
          { name: "`" + strings.issue.usage + "`", value: strings.issue.description, inline: false },
          { name: "`" + strings.invite.usage + "`", value: strings.invite.description, inline: false},
          { name: "`" + strings.guide.usage + "`", value: strings.invite.description, inline: false}
        )
        .setFooter(executedBy + madeBy);
      message.channel.send(embed)


    } else {

      const name = args[0].toLowerCase();
      const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

      if (!command) {
        const embed = new Discord.MessageEmbed()
          .setColor(errorColor)
          .setAuthor(strings.moduleName)
          .setTitle(strings.commandInfo)
          .setDescription(strings.commandNotExist)
          .setFooter(executedBy + madeBy);
        return message.channel.send(embed);
      }

      const cooldown = command.cooldown + strings.seconds;
      const embed = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setAuthor(strings.moduleName)
        .setTitle(strings.commandInfoFor + "`+" + command.name + "`")
        .setDescription(strings[command.name].description)
        .addFields(
          {
            name: strings.usageField,
            value: "`" + strings[command.name].usage + "`",
            inline: true
          }
        )
        .setFooter(executedBy + madeBy);
      if (command.cooldown) {
        embed.addFields({ name: strings.cooldownField, value: cooldown, inline: true })
      }
      if (command.aliases) {
        embed.addFields({ name: strings.aliasesField, value: command.aliases.join(", "), inline: true })
      }
      message.channel.send(embed);
    }
  }
};