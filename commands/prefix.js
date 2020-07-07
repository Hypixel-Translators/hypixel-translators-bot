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
          const prefixes = ""
          const guild = msg.client.guilds.cache.get("549503328472530974")
          const user = guild.member(args[0])
          if (user.roles.some(r => r.name.startsWith("Bulgarian"))) {
            if (prefixes.length > 4) {
              prefixes = (prefixes + "-")
            }
            prefixes = (prefixes + "🇧🇬")
          }
          if (user.roles.some(r => r.name.startsWith("Chinese"))) {
            if (prefixes.length > 4) {
              prefixes = (prefixes + "-")
            }
            prefixes = (prefixes + "🇨🇳")
          }
          if (user.roles.some(r => r.name.startsWith("Czech"))) {
            if (prefixes.length > 4) {
              prefixes = (prefixes + "-")
            }
            prefixes = (prefixes + "🇨🇿")
          }
          if (user.roles.some(r => r.name.startsWith("Danish"))) {
            if (prefixes.length > 4) {
              prefixes = (prefixes + "-")
            }
            prefixes = (prefixes + "🇩🇰")
          }
          if (user.roles.some(r => r.name.startsWith("Dutch"))) {
            if (prefixes.length > 4) {
              prefixes = (prefixes + "-")
            }
            prefixes = (prefixes + "🇳🇱")
          }
          if (user.roles.some(r => r.name.startsWith("Finnish"))) {
            if (prefixes.length > 4) {
              prefixes = (prefixes + "-")
            }
            prefixes = (prefixes + "🇫🇮")
          }
          if (user.roles.some(r => r.name.startsWith("French"))) {
            if (prefixes.length > 4) {
              prefixes = (prefixes + "-")
            }
            prefixes = (prefixes + "🇫🇷")
          }
          if (user.roles.some(r => r.name.startsWith("German"))) {
            if (prefixes.length > 4) {
              prefixes = (prefixes + "-")
            }
            prefixes = (prefixes + "🇩🇪")
          } if (user.roles.some(r => r.name.startsWith("Greek"))) {
            if (prefixes.length > 4) {
              prefixes = (prefixes + "-")
            }
            prefixes = (prefixes + "🇬🇷")
          }
          if (user.roles.some(r => r.name.startsWith("Italian"))) {
            if (prefixes.length > 4) {
              prefixes = (prefixes + "-")
            }
            prefixes = (prefixes + "🇮🇹")
          }
          if (user.roles.some(r => r.name.startsWith("Japanese"))) {
            if (prefixes.length > 4) {
              prefixes = (prefixes + "-")
            }
            prefixes = (prefixes + "🇯🇵")
          }
          if (user.roles.some(r => r.name.startsWith("Korean"))) {
            if (prefixes.length > 4) {
              prefixes = (prefixes + "-")
            }
            prefixes = (prefixes + "🇰🇷")
          }
          if (user.roles.some(r => r.name.startsWith("Norwegian"))) {
            if (prefixes.length > 4) {
              prefixes = (prefixes + "-")
            }
            prefixes = (prefixes + "🇳🇴")
          }
          if (user.roles.some(r => r.name.startsWith("Polish"))) {
            if (prefixes.length > 4) {
              prefixes = (prefixes + "-")
            }
            prefixes = (prefixes + "🇵🇱")
          }
          if (user.roles.some(r => r.name.startsWith("Portuguese"))) {
            if (prefixes.length > 4) {
              prefixes = (prefixes + "-")
            }
            prefixes = (prefixes + "🇵🇹")
          }
          if (user.roles.some(r => r.name.startsWith("Brazilian"))) {
            if (prefixes.length > 4) {
              prefixes = (prefixes + "-")
            }
            prefixes = (prefixes + "🇧🇷")
          }
          if (user.roles.some(r => r.name.startsWith("Russian"))) {
            if (prefixes.length > 4) {
              prefixes = (prefixes + "-")
            }
            prefixes = (prefixes + "🇷🇺")
          }
          if (user.roles.some(r => r.name.startsWith("Spanish"))) {
            if (prefixes.length > 4) {
              prefixes = (prefixes + "-")
            }
            prefixes = (prefixes + "🇪🇸")
          }
          if (user.roles.some(r => r.name.startsWith("Swedish"))) {
            if (prefixes.length > 4) {
              prefixes = (prefixes + "-")
            }
            prefixes = (prefixes + "🇸🇪")
          }
          if (user.roles.some(r => r.name.startsWith("Thai"))) {
            if (prefixes.length > 4) {
              prefixes = (prefixes + "-")
            }
            prefixes = (prefixes + "🇹🇭")
          }
          if (user.roles.some(r => r.name.startsWith("Turkish"))) {
            if (prefixes.length > 4) {
              prefixes = (prefixes + "-")
            }
            prefixes = (prefixes + "🇹🇷")
          }
          if (user.roles.some(r => r.name.startsWith("Ukrainian"))) {
            if (prefixes.length > 4) {
              prefixes = (prefixes + "-")
            }
            prefixes = (prefixes + "🇺🇦")
          }
          message.channel.send("Your prefixes would be: " + prefixes)
        }



        const embed = new Discord.MessageEmbed()
          .setColor(errorColor)
          .setTitle("Prefix")
          .setDescription("This command hasn't been programmed yet, this is a fallback message.")
          .setFooter("Executed by " + message.author.tag);
        msg.edit(embed)
      })
  }
}
