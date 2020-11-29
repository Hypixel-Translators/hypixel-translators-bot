const { loadingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
  name: "quickplay",
  description: "Gives you useful information regarding the Quickplay Crowdin project.",
  usage: "+quickplay",
  aliases: ["qp"],
  cooldown: 120,
  channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058", "749391414600925335", "551693960913879071"], // bots staff-bots bot-development bot-translators admin-bots
  execute(strings, message) {
    //message.delete();
    message.channel.send(strings.quickplayCrowdin.replace("%%crowdin%%", "<https://crowdin.com/project/quickplay>") + "\n" + strings.quickplayThread.replace("%%thread%%", "<https://hypixel.net/threads/1317410/>") + "\n" + strings.quickplayDiscord.replace("%%discord%%", "<https://discord.gg/373EGB4>"))
  }
};
