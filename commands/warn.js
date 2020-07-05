const { warnRole1, warnRole2, warnRole3 } = require("../config.json");
const {
  workingColor,
  errorColor,
  successColor,
  neutralColor
} = require("../config.json");
const Discord = require("discord.js");

module.exports = {
  name: "warn",
  description: "Gives the specified user a warning.",
  aliases: ["warning", "punish"],
  usage: "<user id>",
  execute(message, args) {
    const embed = new Discord.MessageEmbed()
      .setColor(errorColor)
      .setTitle("Warn")
      .setDescription("This command is not enabled!")
      .addFields({ name: "Current warnings", value: "Couldn't fetch" })
      .setFooter("Executed by " + message.author.tag);

    message.channel.send(embed);
  }
};
/* message.delete();
    const embed = new Discord.MessageEmbed()
      .setColor(workingColor)
      .setTitle("Warn")
      .setDescription("<@" + args[0] + "> is being warned...")
      .addFields({ name: "...", value: "..." })
      .setFooter("Executed by " + message.author.tag);

    message.channel.send(embed).then(msg => {
      if (message.member.hasPermission("KICK_MEMBERS")) {
        const toWarn = message.guild.members.cache.get(args[0]);
        console.log(toWarn._roles)
        if (toWarn._roles.includes(warnRole3)) {
          const embed = new Discord.MessageEmbed()
            .setColor(successColor)
            .setTitle("Warn")
            .setDescription(
              "<@" +
              args[0] +
              "> has reached their third warning already.\nMute them by executing \`-mute\`" +
              args[0]
            )
            .addFields({ name: "Current warnings", value: "3+ warnings" })
            .setFooter("Executed by " + message.author.tag);

          msg.edit(embed);
        } else if (toWarn._roles.includes(warnRole2)) {
          const embed = new Discord.MessageEmbed()
            .setColor(successColor)
            .setTitle("Warn")
            .setDescription(
              "<@" + args[0] + "> has reached their third warning."
            )
            .addFields({ name: "Current warnings", value: "3 warnings" })
            .setFooter("Executed by " + message.author.tag);
          toWarn.roles.add(warnRole3);
          msg.edit(embed);
        } else if (toWarn._roles.includes(warnRole1)) {
          const embed = new Discord.MessageEmbed()
            .setColor(successColor)
            .setTitle("Warn")
            .setDescription(
              "<@" + args[0] + "> has reached their second warning."
            )
            .addFields({ name: "Current warnings", value: "2 warnings" })
            .setFooter("Executed by " + message.author.tag);
          toWarn.roles.add(warnRole2);
          msg.edit(embed);
        } else {
          const embed = new Discord.MessageEmbed()
            .setColor(successColor)
            .setTitle("Warn")
            .setDescription(
              "<@" + args[0] + "> has reached their first warning."
            )
            .addFields({ name: "Current warnings", value: "1 warning" })
            .setFooter("Executed by " + message.author.tag);
          toWarn.roles.add(warnRole1);
          msg.edit(embed);
        }
      }
    });
  }
};*/
