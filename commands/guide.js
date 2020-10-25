const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
  name: "guide",
  description: "Gives you the link to the translations guide on Hypixel.",
  aliases: ["forumguide"],
  usage: "guide",
  cooldown: 120,
  channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058", "749391414600925335"],
  execute(strings, message) {
    const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
    //message.delete();
    message.channel.send(strings.guide + " https://hypixel.net/translate")
  }
};
