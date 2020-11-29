const { loadingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
  name: "twitter",
  description: "Gives you a link to the official Hypixel Translators Community Twitter page",
  aliases: [],
  usage: "+twitter",
  cooldown: 120,
  channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058", "749391414600925335", "551693960913879071"], // bots staff-bots bot-development bot-translators admin-bots
  execute(strings, message) {
    //message.delete();
    message.channel.send(strings.twitter.replace("%%twitter%%", "<https://twitter.com/HTranslators>"))
  }
};
