const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
  name: "ping",
  description: "Gives you the bot's ping",
  usage: "+ping",
  aliases: ["latency"],
  cooldown: 60,
  channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058", "749391414600925335", "551693960913879071"], // bots staff-bots bot-development bot-translators admin-bots
  execute(strings, message) {
    const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
    const ping = Date.now() - message.createdTimestamp
    const latency = Math.round(message.client.ws.ping)

    //Contributed by marzeq. Original idea by Rodry
    let color
    if (ping <= 200) { //if ping is less than 200 the color is green
      color = successColor
    } else if (ping <= 400) { //if ping is between 200 and 400 the color is yellow
      color = workingColor
    } else if (ping < 0) {
      color = errorColor
      console.log("Something went terribly wrong and the ping is negative. Come pick me up I'm scared.")
    } else { //if ping is higher than 400 the color is red
      color = errorColor
    }
    const embed = new Discord.MessageEmbed()
      .setColor(color)
      .setAuthor(strings.moduleName)
      .setTitle(strings.pong.replace("%%pingEmote%%", "<:ping:620954198493888512>"))
      .setDescription(strings.message.replace("%%ping%%", ping).replace("%%latency%%", latency))
      .setFooter(executedBy)
    message.channel.send(embed)
  }
};
