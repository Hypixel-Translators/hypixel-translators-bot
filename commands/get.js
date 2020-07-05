const {
  workingColor,
  errorColor,
  successColor,
  neutralColor
} = require("../config.json");
const Discord = require("discord.js");

module.exports = {
  name: "get",
  description: "Developer command.",
  execute(message) {
    message.delete();
    const embed = new Discord.MessageEmbed()
      .setTitle("Get (DEV)")
      .setDescription("Just a moment...")
      .setFooter("Executed by " + message.author.tag);
    message.channel.send(embed).then(msg => {
      if (message.author.id == "722738307477536778") {
        const perms = msg.author.permissions;
        const embed = new Discord.MessageEmbed()
          .setTitle("Get (DEV)")
          .addFields(
            { name: "Bot perms", value: perms },
            { name: "User perms", value: message.author.permissions }
          )
          .setFooter("Executed by " + message.author.tag);
        msg.edit(embed);
      } else {
        const embed = new Discord.MessageEmbed()
          .setColor(errorColor)
          .setTitle("Get")
          .setDescription(
            "You're not the bot owner, so you aren't allowed to do this. If you really want to, please contact <@722738307477536778>."
          )
          .setFooter("Executed by " + message.author.tag);
        msg.edit(embed);
      }
    });
  }
};
