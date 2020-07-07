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
        var prefixes = ""
        var user = message.member
        if (args) {
          user = message.guild.members.cache.get(args[0])
        }

        if (user.roles.cache.some(r => r.name.startsWith("Bulgarian"))) {
          msg.react("🇧🇬")
        }
        if (user.roles.cache.some(r => r.name.startsWith("Chinese"))) {
          msg.react("🇨🇳")
        }
        if (user.roles.cache.some(r => r.name.startsWith("Czech"))) {
          msg.react("🇨🇿")
        }
        if (user.roles.cache.some(r => r.name.startsWith("Danish"))) {
          msg.react("🇩🇰")
        }
        if (user.roles.cache.some(r => r.name.startsWith("Dutch"))) {
          msg.react("🇳🇱")
        }
        if (user.roles.cache.some(r => r.name.startsWith("Finnish"))) {
          msg.react("🇫🇮")
        }
        if (user.roles.cache.some(r => r.name.startsWith("French"))) {
          msg.react("🇫🇷")
        }
        if (user.roles.cache.some(r => r.name.startsWith("German"))) {
          msg.react("🇩🇪")
        } 
        if (user.roles.cache.some(r => r.name.startsWith("Greek"))) {
          msg.react("🇬🇷")
        }
        if (user.roles.cache.some(r => r.name.startsWith("Italian"))) {
          msg.react("🇮🇹")
        }
        if (user.roles.cache.some(r => r.name.startsWith("Japanese"))) {
          msg.react("🇯🇵")
        }
        if (user.roles.cache.some(r => r.name.startsWith("Korean"))) {
          msg.react("🇰🇷")
        }
        if (user.roles.cache.some(r => r.name.startsWith("Norwegian"))) {
          msg.react("🇳🇴")
        }
        if (user.roles.cache.some(r => r.name.startsWith("Polish"))) {
          msg.react("🇵🇱")
        }
        if (user.roles.cache.some(r => r.name.startsWith("Portuguese"))) {
          msg.react("🇵🇹")
        }
        if (user.roles.cache.some(r => r.name.startsWith("Brazilian"))) {
          msg.react("🇧🇷")
        }
        if (user.roles.cache.some(r => r.name.startsWith("Russian"))) {
          msg.react("🇷🇺")
        }
        if (user.roles.cache.some(r => r.name.startsWith("Spanish"))) {
          msg.react("🇪🇸")
        }
        if (user.roles.cache.some(r => r.name.startsWith("Swedish"))) {
          msg.react("🇸🇪")
        }
        if (user.roles.cache.some(r => r.name.startsWith("Thai"))) {
          msg.react("🇹🇭")
        }
        if (user.roles.cache.some(r => r.name.startsWith("Turkish"))) {
          msg.react("🇹🇷")
        }
        if (user.roles.cache.some(r => r.name.startsWith("Ukrainian"))) {
          msg.react("🇺🇦")
        }
        /*const embed = new Discord.MessageEmbed()
          .setColor(workingColor)
          .setTitle("Prefix")
          .setDescription("Changing username with prefix(es) \`" + prefixes + "\`...")
          .setFooter("Executed by " + message.author.tag);
        msg.edit(embed)
        console.log(prefixes)
        user.setNickname("[" + prefixes + "] " + user.user.username)
          .then(() => {
            const embed = new Discord.MessageEmbed()
              .setColor(successColor)
              .setTitle("Prefix")
              .setDescription("Changed username with prefix(es) \`" + prefixes + "\`.")
              .setFooter("Executed by " + message.author.tag);
            msg.edit(embed)
          })
          .catch(err => {
            const embed = new Discord.MessageEmbed()
              .setColor(errorColor)
              .setTitle("Prefix")
              .setDescription("Failed to change nickname to" + prefixes + ".\n\nReason:\n> " + err)
              .setFooter("Executed by " + message.author.tag);
            msg.edit(embed)
            console.log(err)
          })*/
      })
  }
}
