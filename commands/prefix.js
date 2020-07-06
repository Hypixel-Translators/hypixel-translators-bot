const {
  workingColor,
  errorColor,
  successColor,
  neutralColor,
  langdb
} = require("../config.json");
const Discord = require("discord.js");

module.exports = {
  name: "prefix",
  description: "Gives the specified user the appropriate prefix for their language(s).",
  aliases: ["langprefix", "languageprefix"],
  usage: "[user]",
  guildOnly: true,
  execute(message, args) {
    //message.delete();
    if (!args[0]) {
      const embed = new Discord.MessageEmbed()
        .setColor(workingColor)
        .setTitle("Prefix")
        .setDescription("Your prefix is being changed... ")
        .setFooter("Executed by " + message.author.tag);
      message.channel.send(embed)
        .then(msg => {
          
        })
    }
  }
}
