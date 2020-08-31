const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
  name: "invite",
  description: "Gives you the server's invite link.",
  aliases: ["invitelink"],
  usage: "invite",
  cooldown: 120,
  channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058"],
  execute(strings, message) {
    //message.delete();
    message.channel.send("You can use this link to invite others to the community:\nhttps://discord.gg/rcT948A")
  }
};