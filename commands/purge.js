const {
  workingColor,
  errorColor,
  successColor,
  neutralColor
} = require("../config.json");
const Discord = require("discord.js");

module.exports = {
  name: "purge",
  description: "Clears a specified amount of messages.",
  aliases: ["clear", "deletemsgs", "clean"],
  usage: "<amount>",
  cooldown: 3,
  guildOnly: true,
  execute(message, args) {
    message.delete();
    if (message.member.hasPermission("MANAGE_MESSAGES")) {
      message.channel
        .bulkDelete(args[0])
        .catch(err => {
          const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setTitle("Purge")
            .setDescription(
              "Couldn't clear out " +
              args[0] +
              " messages.\n\nReason:\n> " +
              err
            )
            .setFooter("Executed by " + message.author.tag);
          message.channel.send(embed);
        })
        .then(() => {
          const embed = new Discord.MessageEmbed()
            .setColor(successColor)
            .setTitle("Purge")
            .setDescription("Cleared out " + args[0] + " messages.")
            .setFooter("Executed by " + message.author.tag);
          message.channel.send(embed);
        });
    } else {
      const embed = new Discord.MessageEmbed()
        .setColor(errorColor)
        .setTitle("Purge")
        .setDescription("You don't have permission to manage messages.")
        .setFooter("Executed by " + message.author.tag);
      message.channel.send(embed);
    }
  }
};
