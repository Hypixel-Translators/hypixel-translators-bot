const {
    workingColor,
    errorColor,
    successColor,
    neutralColor
  } = require("../config.json");
  const Discord = require("discord.js");
  
  module.exports = {
    name: "guidelines",
    description: "Shows you the official thread regarding Hypixel translations.",
    aliases: ["guide", "translationguide", "officialthread"],
    usage: "guidelines",
    cooldown: 30,
    execute(message) {
      //message.delete();
      message.channel.send("Here are the official Hypixel translation guidelines!\nhttps://hypixel.net/translate/#post-7078208")
    }
  };
  