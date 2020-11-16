const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
  name: "invite",
  description: "Gives you the server's invite link.",
  aliases: ["invitelink"],
  usage: "invite",
  cooldown: 120,
  channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058", "749391414600925335"],
  execute(strings, message, client) {
    const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
    if (client.guilds.cache.get("549503328472530974").premiumTier >= "3") {
      const inviteURL = "discord.gg/hypixeltranslators"
    } else { const inviteURL = "https://discord.gg/rcT948A" }
    //message.delete();
    console.log(inviteURL)
    console.log(premiumTier)
    message.channel.send(strings.invite.replace("%%invite%%", inviteURL))
  }
};
