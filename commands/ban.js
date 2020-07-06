const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
  name: "ban",
  description: "Removes the user from the guild.",
  usage: "<user id> [days of messages to delete] [reason in one word]",
  cooldown: 5,
  guildOnly: true,
  execute(message, args) {
    const toBan = message.guild.members.cache.get(args[0]);
    //message.delete();
    const embed = new Discord.MessageEmbed()
      .setColor(workingColor)
      .setTitle("User Management")
      .setDescription(
        "<@" +
          message.guild.members.cache.get(args[0]) +
          "> is being banned from this guild..."
      )
      .setFooter("Executed by " + message.author.tag);

    message.channel.send(embed).then(msg => {
      if (message.member.hasPermission("KICK_MEMBERS")) {
        message.guild.members.cache
          .get(args[0])
          .ban({ days: args[1], reason: args[2] })
          .then(() => {
            const embed = new Discord.MessageEmbed()
              .setColor(successColor)
              .setTitle("User Management")
              .setDescription(
                toBan.username + "#" + toBan.discriminator +
                  " has been banned from this guild.\n\nReason:\n> " +
                  args[2]
              )
              .setFooter("Executed by " + message.author.tag);
            msg.edit(embed);
          })
          .catch(err => {
            const embed = new Discord.MessageEmbed()
              .setColor(errorColor)
              .setTitle("User Management")
              .setDescription(
                "<@" +
                  message.guild.members.cache.get(args[0]) +
                  "> couldn't be banned from this guild.\n\nReason:\n> " +
                  err
              )
              .setFooter("Executed by " + message.author.tag);
            msg.edit(embed);
          })
          .catch(err => {});
      } else {
        const embed = new Discord.MessageEmbed()
          .setColor(errorColor)
          .setTitle("User Management")
          .setDescription("You don't have permission to ban members.")
          .setFooter("Executed by " + message.author.tag);
        msg.edit(embed);
      }
    });
  }
};
