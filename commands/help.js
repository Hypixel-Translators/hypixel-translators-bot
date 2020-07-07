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
  aliases: ["commands", "cmds", "info"],
  usage: "help [name of command]",
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
          "Execute `+help <name of command>` to learn more about a specific command.\nMore commands will come!\n_This bot was built by <@722738307477536778> for the **Hypixel Translators Community Discord** server._"
        )
        .addFields(
          { name: "Essentials", value: "help, mention, prefix", inline: true },
          { name: "More commands", value: "More commands will come soon:tm:!", inline: true }
        )
        .setFooter("Executed by " + message.author.tag);

      return message.author
        .send(embed)
        .then(() => {
          if (message.channel.type === "dm") return;
          const embed = new Discord.MessageEmbed()
            .setColor(successColor)
            .setTitle("Help")
            .setDescription(
              "I sent you a private message with all available commands!"
            )
            .setFooter("Executed by " + message.author.tag);

          message.channel.send(embed);
        })
        .catch(error => {
          console.error(
            `Kon ${message.author.tag} geen bericht sturen.\n`,
            error
          );
          const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setTitle("Help")
            .setDescription(
              "I couldn't send you a private message! Please check your DM settings."
            )
            .setFooter("Executed by " + message.author.tag);
          return message.channel.send(embed);
        });
    }

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
        .setTitle("Command help")
        .setAuthor("Command: " + command.name)
        .setDescription(command.description)
        .addFields(
          { name: "Aliases", value: command.aliases.join(", "), inline: true },
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

      message.channel.send(embed);
  }
};