const {
  workingColor,
  errorColor,
  successColor,
  neutralColor
} = require("../config.json");
const { prefix } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
  name: "help",
  description:
    "Shows you all available commands and general info about the bot.",
  aliases: ["commands", "cmds", "info", "botinfo"],
  usage: "help [name of command]",
  channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058"],
  allowDM: true,
  cooldown: 5,
  execute(message, args) {
    //message.delete();
    const data = [];
    const { commands } = message.client;

    if (!args.length) {
      const embed = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setTitle("Information")
        .setDescription(
          "Execute `+help <name of command>` to learn more about a specific command.\n_ _"
        )
        .addFields(
          { name: "Community", value: "prefix, mention, quote", inline: true },
          { name: "Translation", value: "context", inline: true },
          { name: "Bot", value: "help, bug, feedback", inline: true },
          { name: '\u200B', value: "This bot was made by <@722738307477536778> for the **Hypixel Translators Community Discord**.\nReport any bugs using \`+bug\` and suggest stuff with \`+feedback\`." }
        )
        .setFooter("Executed by " + message.author.tag);

      message.channel.send(embed)
    } else {

      const name = args[0].toLowerCase();
      const command =
        commands.get(name) ||
        commands.find(c => c.aliases && c.aliases.includes(name));

      if (!command) {
        const embed = new Discord.MessageEmbed()
          .setColor(errorColor)
          .setTitle("Help")
          .setDescription("That command doesn't exist!")
          .setFooter("Executed by " + message.author.tag);
        return message.channel.send(embed);
      }

      const cooldown = command.cooldown + " second(s)";
      const embed = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setTitle("Command: " + command.name)
        .setAuthor("Information")
        .setDescription(command.description)
        .addFields(
          {
            name: "Usage",
            value: "`" + prefix + command.usage + "`",
            inline: true
          },
          {
            name: "Cooldown",
            value: cooldown,
            inline: true
          }
        )
        .setFooter("Executed by " + message.author.tag);
      if (command.aliases) {
        embed.addFields({ name: "Aliases", value: command.aliases.join(", "), inline: true })
      }

      message.channel.send(embed);
    }
  }
};