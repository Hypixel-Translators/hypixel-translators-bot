const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
  name: "ping",
  description: "Gives you the bot's ping",
  usage: "ping",
  aliases: ["botping", "latency"],
  cooldown: 60,
  channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058", "749391414600925335", "551693960913879071"], // bots staff-bots bot-development bot-translators admin-bots
  execute(message) {
    //message.delete();
    message.channel.send(`<:ping:620954198493888512> Pong! \`${Date.now() - message.createdTimestamp}ms.\` API Latency is ${Math.round(client.ws.ping)}ms`);
}
};
