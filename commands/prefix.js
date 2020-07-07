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
    const embed = new Discord.MessageEmbed()
      .setColor(workingColor)
      .setTitle("Prefix")
      .setDescription("Your prefix is being changed... ")
      .setFooter("Executed by " + message.author.tag);
    message.channel.send(embed)
      .then(msg => {
        if (args[0]) {
          const guild = msg.client.guilds.cache.get("549503328472530974")
          const user = guild.member(args[0])
          var roles = user.roles.member[0].guild[0]._roles
          console.log(roles)
          var langRoles = roles.filter(x => !x.name.endsWith("Proofreader") || !x.name.endsWith("Translator"))
          console.log(langRoles)
        }



        const embed = new Discord.MessageEmbed()
          .setColor(errorColor)
          .setTitle("Prefix")
          .setDescription("This command hasn't been programmed yet, this is a fallback message. ")
          .setFooter("Executed by " + message.author.tag);
        msg.edit(embed)
      })
  }
}
