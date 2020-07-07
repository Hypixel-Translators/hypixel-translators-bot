const Discord = require("discord.js");

module.exports = {
  name: "mention",
  description: "Mentions a language role.",
  aliases: ["langping", "languageping"],
  usage: "mention <language> <pf|tr|all>",
  cooldown: 3,
  execute(message, args) {
    const lowerArg = args[0].toLowerCase()
    const toLook = lowerArg.charAt(0).toUpperCase() + lowerArg.slice(1)
    if (args[1] === "pf" || args[1] === "proofreader" || args[1] === "Proofreader") {
      const toPing = message.guild.roles.cache.find(role => role.name === toLook + " Proofreader");
      const lowerRole = message.guild.roles.cache.find(role => role.name === toLook + " Translator");
      console.log(toPing + "\n" + lowerRole);
      if (
        message.member.roles.cache.find(
          role => role.name === toLook + " Proofreader"
        ) ||
        message.member.roles.cache.find(
          role => role.name === toLook + " Translator"
        )
      ) {
        message.channel.send("<@&" + toPing + "> <a:bongoping:614477510423478275>");
      } else {
        message.channel.send(
          "You don't have a role of that language, so you can't mention it. Contact the server owner or administrator if you really need to."
        );
      }
    } else if (args[1] === "tr" || args[1] === "translator" || args[1] === "Translator") {
      const toPing = message.guild.roles.cache.find(role => role.name === toLook + " Translator");
      const higherRole = message.guild.roles.cache.find(role => role.name === toLook + " Proofreader");
      console.log(toPing + "\n" + higherRole);
      if (
        message.member.roles.cache.find(
          role => role.name === toLook + " Translator"
        ) ||
        message.member.roles.cache.find(
          role => role.name === toLook + " Proofreader"
        )
      ) {
        message.channel.send("<@&" + toPing + "> <a:bongoping:614477510423478275>");
      } else {
        message.channel.send(
          "You don't have a role of that language, so you can't mention it. Contact the server owner or administrator if you really need to."
        );
      }
    } else if (args[1] === "all" || args[1] === "both") {
      const translatorPing = message.guild.roles.cache.find(role => role.name === toLook + " Translator");
      const proofreaderPing = message.guild.roles.cache.find(role => role.name === toLook + " Proofreader");
      console.log(translatorPing + "\n" + proofreaderPing);
      if (
        message.member.roles.cache.find(
          role => role.name === toLook + " Translator"
        ) ||
        message.member.roles.cache.find(
          role => role.name === toLook + " Proofreader"
        )
      ) {
        message.channel.send("<@&" + translatorPing + "> and <@&" + proofreaderPing + "> <a:bongoping:614477510423478275>");
      } else {
        message.channel.send(
          "You don't have a role of that language, so you can't mention it. Contact the server owner or administrator if you really need to."
        );
      }
    }
  }
};

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
