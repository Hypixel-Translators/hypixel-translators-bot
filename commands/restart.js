const {
  workingColor,
  errorColor,
  successColor,
  neutralColor
} = require("../config.json");
const Discord = require("discord.js");

module.exports = {
  name: "restart",
  description: "Refresh the bot to apply changes and to fix errors.",
  aliases: ["refresh", "reload", "update"],
  usage: "restart",
  allowDM: true,
  channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058"],
  execute(strings, message) {
    const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
    //message.delete();
    const embed = new Discord.MessageEmbed()
      .setColor(workingColor)
      .setTitle("Restart")
      .setDescription("Just a moment...")
      .setFooter(executedBy)
    message.channel.send(embed).then(msg => {
      if (message.author.id == "722738307477536778") {
        const embed = new Discord.MessageEmbed()
          .setColor(successColor)
          .setTitle("Restart")
          .setDescription("Restarting...\nGive me a minute.")
          .setFooter(executedBy)
        msg.edit(embed);
        msg.client.user.setStatus("idle");
        setTimeout(() => {
          process.exit();
        }, 3000);
      } else {
        const embed = new Discord.MessageEmbed()
          .setColor(errorColor)
          .setTitle("Restart")
          .setDescription(
            "You're not the bot owner, so you aren't allowed to restart the bot. If you really want to, please contact <@722738307477536778>."
          )
          .setFooter(executedBy)
        msg.edit(embed);
      }
    });
  }
};
