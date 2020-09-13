const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
  name: "gotperm",
  description: "See if user has a specified permission.",
  aliases: ["hasperm", "permchecker", "permcheck", "checkperm"],
  usage: "gotperm <permission name> [user]",
  channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058"],
  execute(strings, message, args) {
    const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
    //message.delete();
    const perm = args[0].toUpperCase()
    const embed = new Discord.MessageEmbed()
      .setColor(workingColor)
      .setAuthor(strings.moduleName)
      .setTitle(strings.loading)
      .setFooter(executedBy)
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
          .setAuthor(strings.moduleName)
          .setTitle(perm)
          .addFields(
            { name: strings.bot, value: botPerm },
            { name: strings.author, value: authorPerm },
            { name: strings.user, value: userPerm }
          )
          .setFooter(executedBy)
        msg.edit(embed);

      } else {

        const embed = new Discord.MessageEmbed()
          .setColor(successColor)
          .setAuthor(strings.moduleName)
          .setTitle(perm)
          .addFields(
            { name: strings.bot, value: botPerm },
            { name: strings.author, value: authorPerm }
          )
          .setFooter(executedBy)
        msg.edit(embed);
      }
    });
  }
};
