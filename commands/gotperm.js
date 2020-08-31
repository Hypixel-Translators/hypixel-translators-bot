const {
  workingColor,
  errorColor,
  successColor,
  neutralColor
} = require("../config.json");
const Discord = require("discord.js");

module.exports = {
  name: "gotperm",
  description: "See if user has a specified permission.",
  usage: "gotperm <perms> [user]",
  channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058"],
  execute(strings, message, args) {
    //message.delete();
    const perm = args[0].toUpperCase()
    const embed = new Discord.MessageEmbed()
      .setColor(workingColor)
      .setTitle("Permission " + perm)
      .setDescription("One second...")
      .setFooter("Executed by " + message.author.tag);
    message.channel.send(embed).then(msg => {
      const authorPerm = message.member.hasPermission(perm);
      const botPerm = msg.member.hasPermission(perm);

      if (args[1]) {
        const guild = msg.client.guilds.get("549503328472530974")
        const user = guild.member(args[1])
        console.log(user);
        const userPerm = user.hasPermission(perm);

        const embed = new Discord.MessageEmbed()
          .setColor(successColor)
          .setTitle("Permission " + perm)
          .addFields(
            { name: "Bot", value: botPerm },
            { name: "Author", value: authorPerm },
            { name: "User", value: userPerm }
          )
          .setFooter("Executed by " + message.author.tag);
        msg.edit(embed);

      } else {

        const embed = new Discord.MessageEmbed()
          .setColor(successColor)
          .setTitle("Permission " + perm)
          .addFields(
            { name: "Bot", value: botPerm },
            { name: "Author", value: authorPerm }
          )
          .setFooter("Executed by " + message.author.tag)
        msg.edit(embed);
      }
    });
  }
};
