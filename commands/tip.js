const { neutralColor } = require("../config.json")
const Discord = require("discord.js")

module.exports = {
  name: "tip",
  description: "Gives you a random tip.",
  usage: "+tip",
  cooldown: 10,
  allowDM: true,
  channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058", "749391414600925335", "551693960913879071"], // bots staff-bots bot-development bot-translators admin-bots
  execute(message, strings, args, globalStrings) {
    const executedBy = globalStrings.executedBy.replace("%%user%%", message.author.tag)
    let keys = Object.keys(globalStrings.tips)
    let tip = globalStrings.tips[keys[keys.length * Math.random() << 0]]
    const embed = new Discord.MessageEmbed()
      .setColor(neutralColor)
      .setAuthor(globalStrings.tip)
      .setDescription(tip.replace("%%botUpdates%%", "<#732587569744838777>").replace("%%gettingStarted%%", "<#699275092026458122>").replace("%%twitter%%", "<https://twitter.com/HTranslators>").replace("%%rules%%", "<#699367003135148063>").replace("%%serverInfo%%", "<#762341271611506708>").replace("%%bots%%", "<#549894938712866816>"))
      .setFooter(executedBy, message.author.displayAvatarURL())
    message.channel.send(embed)
  }
}
