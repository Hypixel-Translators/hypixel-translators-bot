const Discord = require("discord.js");

module.exports = {
  name: "mention",
  description: "Mentions a language role.",
  aliases: ["langping", "languageping"],
  usage: "<language> <pf|tr>",
  execute(message, args) {
    const toLook = capitalizeFirstLetter(args[0])
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
        message.channel.send("<@&" + toPing + "> 🏓");
      } else {
        message.channel.send(
          "You don't have a role of that language, so you can't mention it."
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
        message.channel.send("<@&" + toPing + "> 🏓");
      } else {
        message.channel.send(
          "You don't have a role of that language, so you can't mention it."
        );
      }
    }
  }
};

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}