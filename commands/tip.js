const { loadingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
  name: "tip",
  description: "Gives you a random tip.",
  usage: "+tip",
  cooldown: 10,
  channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058", "749391414600925335", "551693960913879071"], // bots staff-bots bot-development bot-translators admin-bots
  execute(globalStrings, message) {
    const embed = new Discord.MessageEmbed()
      .setColor(successColor)
      .setAuthor(globalStrings.tip)
      .setDescription(globalStrings.tips[Math.floor(Math.random() * Object.keys(globalStrings.tips).length)].replace("%%botUpdates%%", "<#732587569744838777>").replace("%%gettingStarted%%", "<#699275092026458122>").replace("%%twitter%%", "<https://twitter.com/HTranslators>").replace("%%translate%%", "<https://discordapp.com/channels/549503328472530974/732587569744838777/754410226601427044>").replace("%%rules%%", "<#699367003135148063>").replace("%%serverInfo%%", "<#699367079241056347>"))
      .setFooter(executedBy, message.author.displayAvatarURL)
    message.channel.send(embed)
  }
}