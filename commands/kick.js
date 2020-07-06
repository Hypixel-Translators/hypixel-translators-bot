const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
  name: "kick",
  description: "Removes the user from the guild.",
  usage: "<user id> [reason in one word]",
  cooldown: 5,
  guildOnly: true,
  execute(message, args) {
    //message.delete();
    const embed = new Discord.MessageEmbed()
      .setColor(workingColor)
      .setTitle("User Management")
      .setDescription(
        "<@" +
          message.guild.members.cache.get(args[0]) +
          "> is being removed from this guild..."
      )
      .setFooter("Executed by " + message.author.tag);

    message.channel.send(embed).then(msg => {
      if (message.member.hasPermission("KICK_MEMBERS")) {
        message.guild.members.cache
          .get(args[0])
          .kick({ reason: args[1] })
          .then(() => {
            const embed = new Discord.MessageEmbed()
              .setColor(successColor)
              .setTitle("User Management")
              .setDescription(
                "<@" +
                  message.guild.members.cache.get(args[0]) +
                  "> has been removed from this guild.\n\nReason:\n> " +
                  args[1]
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
                  "> couldn't be removed from this guild.\n\nReason:\n> " +
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
          .setDescription("You don't have permission to kick members.")
          .setFooter("Executed by " + message.author.tag);
        msg.edit(embed);
      }
    });
  }
};
