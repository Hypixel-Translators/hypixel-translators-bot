const Discord = require("discord.js");

module.exports = {
  name: "mention",
  description: "Mentions a language role with a message.",
  aliases: ["langping", "languageping"],
  usage: "mention <language> <proofreader|translator|all> [message]",
  cooldown: 120,
  categoryBlackList: ["549503328472530975"],
  execute(strings, message, args) {
    const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
    console.log(args)
    var type = args[1]
    const lowerArg = args[0].toLowerCase()
    var toLook = lowerArg.charAt(0).toUpperCase() + lowerArg.slice(1)
    args.splice(0, 2)
    var toSend = args.join(" ")
    if (toSend.length < 2) {
      toSend = "<a:bongoping:614477510423478275>" + toSend
    }

    if (toLook === "Chinesesimplified" || toLook === "Chinese-simplified") {
      toLook = "Chinese (Simplified)"
    }
    if (toLook === "Chinesetraditional" || toLook === "Chinese-traditional") {
      toLook = "Chinese (Traditional)"
    }
    if (toLook === "Lolcat") {
      toLook = "LOLCAT"
    }

    console.log(toLook)
    console.log(toSend)
    console.log(type)
    const role = message.guild.roles.cache.find(x => x.name == (toLook + " Proofreader"))

    if (!role) {
      message.channel.send("The role you entered doesn't exist. Make sure not to use abbreviations. For Chinese (Simplified/Traditional), use \`Chinese-simplified/traditional\`.");
      return;
    }
    if (type === "pf" || type === "pr" || type === "proofreader" || type === "Proofreader") {
      const toPing = message.guild.roles.cache.find(role => role.name === toLook + " Proofreader");
      const lowerRole = message.guild.roles.cache.find(role => role.name === toLook + " Translator");
      console.log(toPing + "\n" + lowerRole);
      if (
        message.member.roles.cache.find(
          role => role.name === toLook + " Proofreader" || message.member.hasPermission("ADMINISTRATOR")
        )
      ) {
        message.delete()
        message.channel.send("**<@" + message.member.id + ">**: <@&" + toPing + "> " + toSend);
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
          role => role.name === toLook + " Proofreader" || message.member.hasPermission("ADMINISTRATOR")
        )
      ) {
        message.delete()
        message.channel.send("**<@" + message.member.id + ">**: <@&" + toPing + "> " + toSend);
      } else {
        message.channel.send(
          "You don't have that language's proofreader role, so you can't mention its translator role. Contact the server owner or administrator if you really need to."
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
        message.delete()
        message.channel.send("**<@" + message.member.id + ">**: <@&" + translatorPing + "> <@&" + proofreaderPing + "> " + toSend);
      } else {
        message.channel.send(
          "You don't have that language's proofreader role, so you can't mention the entire language. Contact the server owner or administrator if you really need to."
        );
      }
    }

  }
};

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
