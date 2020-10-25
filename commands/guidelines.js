const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
  name: "guidelines",
  description: "Gives you the link to the translations guide on Hypixel.",
  aliases: ["guide"],
  usage: "guidelines",
  cooldown: 120,
  channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058", "749391414600925335", "551693960913879071"], // bots staff-bots bot-development bot-translators admin-bots
  execute(strings, message) {
    //message.delete();
    message.channel.send(strings.guide.replace("%%guide%%", "https://hypixel.net/translate/#post-7078208"))
  }
};
