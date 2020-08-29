const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const { prefix } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
  name: "help",
  description: "Shows you all available commands and general info about the bot.",
  aliases: ["commands", "cmds", "info", "botinfo"],
  usage: "help [name of command]",
  channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058"],
  allowDM: true,
  cooldown: 5,
  async execute(strings, message, args) {
    const { commands } = message.client;

    if (!args.length) {
      const embed = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setAuthor(strings.moduleName)
        .setTitle(strings.commandsListTitle)
        .setDescription(strings.commandsListTooltip)
        .addFields(
          { name: "`" + commands.get("help").usage + "`", value: commands.get("help").description, inline: false },
          { name: "`" + commands.get("prefix").usage + "`", value: commands.get("prefix").description, inline: false },
          { name: "`" + commands.get("quote").usage + "`", value: commands.get("quote").description, inline: false },
          { name: "`" + commands.get("mention").usage + "`", value: commands.get("mention").description, inline: false },
          { name: "`" + commands.get("context").usage + "`", value: commands.get("context").description, inline: false },
          { name: "`" + commands.get("bug").usage + "`", value: commands.get("bug").description, inline: false },
          { name: "`" + commands.get("feedback").usage + "`", value: commands.get("feedback").description, inline: false }
        )
        .setFooter(strings.executedBy + message.author.tag);
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
          .setFooter(strings.executedBy + message.author.tag);
        return message.channel.send(embed);
      }

      const cooldown = command.cooldown + strings.seconds;
      const embed = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setAuthor(strings.moduleName)
        .setTitle(strings.commandInfoFor + command.name)
        .setDescription(command.description)
        .addFields(
          {
            name: strings.usageField,
            value: "`" + prefix + command.usage + "`",
            inline: true
          },
          {
            name: strings.cooldownField,
            value: cooldown,
            inline: true
          }
        )
        .setFooter(strings.executedBy + message.author.tag);
      if (command.aliases) {
        embed.addFields({ name: strings.aliasesField, value: command.aliases.join(", "), inline: true })
      }
      message.channel.send(embed);
    }
  }
};