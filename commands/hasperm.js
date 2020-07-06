const {
  workingColor,
  errorColor,
  successColor,
  neutralColor
} = require("../config.json");
const Discord = require("discord.js");

module.exports = {
  name: "hasperm",
  description: "See if user has a specified permission.",
  usage: "<perms> [user]",
  execute(message, args) {
    //message.delete();
    const embed = new Discord.MessageEmbed()
      .setTitle("Has Permission")
      .setDescription("Just a moment...")
      .setFooter("Executed by " + message.author.tag);
    message.channel.send(embed).then(msg => {
      const authorPerm = message.member.hasPermission(args[0]);
      const botPerm = msg.member.hasPermission(args[0]);

      if (args[1]) {
        const user = args[1];
        console.log(user);
        const userPerm = user.hasPermission(args[0]);
        const embed = new Discord.MessageEmbed()
          .setTitle("Has Permission")
          .addFields(
            { name: "Bot has " + args[0], value: botPerm },
            { name: "Author has " + args[0], value: authorPerm },
            { name: "User _" + args[1] + "_ has " + args[0], value: userPerm }
          )
          .setFooter("Executed by " + message.author.tag);
        msg.edit(embed);
      } else {
        const embed = new Discord.MessageEmbed()
          .setTitle("Has Permission")
          .addFields(
            { name: "Bot has " + args[0], value: botPerm },
            { name: "Author has " + args[0], value: authorPerm }
          )
          .setFooter("Executed by " + message.author.tag);
        msg.edit(embed);
      }
    });
  }
};
