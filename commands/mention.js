const Discord = require("discord.js");

module.exports = {
  name: "mention",
  description: "Mentions a language role.",
  aliases: ["langping", "languageping"],
  usage: "mention <language> <proofreader|translator|all>",
  cooldown: 60,
  categoryBlackList: ["549503328472530975"],
  execute(message, args) {
    var type = args[1]
    const lowerArg = args[0].toLowerCase()
    var toLook = lowerArg.charAt(0).toUpperCase() + lowerArg.slice(1)

    if (toLook === "Chinesesimplified" || toLook === "Chinese-simplified") {
      toLook = "Chinese (Simplified)"
    }
    if (toLook === "Chinesetraditional" || toLook === "Chinese-traditional") {
      toLook = "Chinese (Traditional)"
    }

    console.log(toLook)
    console.log(type)
    const role = message.guild.roles.cache.find(x => x.name == (toLook + " Proofreader"))
    console.log(role)

    if (!role) {
      message.channel.send("The role you entered doesn't exist. Make sure not to use abbreviations. For Chinese (Simplified/Traditional), use \`Chinese-simplified/traditional\`.")
    } else {
      if (type === "pf" || type === "proofreader" || type === "Proofreader") {
        const toPing = message.guild.roles.cache.find(role => role.name === toLook + " Proofreader");
        const lowerRole = message.guild.roles.cache.find(role => role.name === toLook + " Translator");
        console.log(toPing + "\n" + lowerRole);
        if (
          message.member.roles.cache.find(
            role => role.name === toLook + " Proofreader" || message.member.hasPermission("ADMINISTRATOR")
          )
        ) {
          message.channel.send("<@&" + toPing + "> <a:bongoping:614477510423478275>");
        } else {
          message.channel.send(
            "You don't have that language's proofreader role, so you can't mention it. Contact the server owner or administrator if you really need to."
          );
        }
      } else if (type === "tr" || type === "translator" || type === "Translator") {
        const toPing = message.guild.roles.cache.find(role => role.name === toLook + " Translator");
        const higherRole = message.guild.roles.cache.find(role => role.name === toLook + " Proofreader");
        console.log(toPing + "\n" + higherRole);
        if (
          message.member.roles.cache.find(
            role => role.name === toLook + " Translator"
          ) ||
          message.member.roles.cache.find(
            role => role.name === toLook + " Proofreader" || message.member.hasPermission("ADMINISTRATOR")
          )
        ) {
          message.channel.send("<@&" + toPing + "> <a:bongoping:614477510423478275>");
        } else {
          message.channel.send(
            "You don't have a role of that language, so you can't mention it. Contact the server owner or administrator if you really need to."
          );
        }
      } else if (type === "all" || type === "both") {
        const translatorPing = message.guild.roles.cache.find(role => role.name === toLook + " Translator");
        const proofreaderPing = message.guild.roles.cache.find(role => role.name === toLook + " Proofreader");
        console.log(translatorPing + "\n" + proofreaderPing);
        if (
          message.member.roles.cache.find(
            role => role.name === toLook + " Proofreader" || message.member.hasPermission("ADMINISTRATOR")
          )
        ) {
          message.channel.send("<@&" + translatorPing + "> and <@&" + proofreaderPing + "> <a:bongoping:614477510423478275>");
        } else {
          message.channel.send(
            "You don't have that language's proofreader role, so you can't mention the entire language. Contact the server owner or administrator if you really need to."
          );
        }
      }
    }
  }
};

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
