const { loadingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
  name: "hypixel",
  description: "Gives you useful information regarding the Hypixel Crowdin project.",
  usage: "+hypixel",
  cooldown: 120,
  channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058", "749391414600925335", "551693960913879071"], // bots staff-bots bot-development bot-translators admin-bots
  execute(strings, message) {
    //message.delete();
    message.channel.send(strings.hypixelCrowdin.replace("%%crowdin%%", "<https://crowdin.com/project/hypixel>") + "\n" + strings.hypixelGuide + "\n" + strings.hypixelDiscord.replace("%%discord%%", "<https://discord.gg/hypixel>"))
  }
};
