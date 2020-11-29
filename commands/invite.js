const { loadingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
  name: "invite",
  description: "Gives you the server's invite link.",
  aliases: ["invitelink"],
  usage: "+invite",
  cooldown: 120,
  channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058", "749391414600925335"],
  execute(strings, message) {
    const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
    let inviteURL = "https://discord.gg/rcT948A"
    if (message.guild.premiumTier >= 3) inviteURL = "discord.gg/hypixeltranslators"
    message.channel.send(strings.invite.replace("%%invite%%", inviteURL))
  }
};
