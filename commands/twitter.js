const {
    workingColor,
    errorColor,
    successColor,
    neutralColor
  } = require("../config.json");
  const Discord = require("discord.js");
  
  module.exports = {
    name: "twitter",
    description: "Refresh the bot to apply changes and to fix errors.",
    usage: "twitter",
    cooldown: 30,
    channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058"],
    execute(message) {
      //message.delete();
      message.channel.send("This is our official Twitter account:\nhttps://twitter.com/HTranslators\n Please feel free to share it with others!")
    }
  };
  