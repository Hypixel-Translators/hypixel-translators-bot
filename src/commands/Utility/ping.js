const { loadingColor, errorColor, successColor } = require("../../config.json")
const Discord = require("discord.js")

module.exports = {
  name: "ping",
  description: "Gives you the bot's ping",
  usage: "+ping",
  aliases: ["latency", "pong"],
  cooldown: 20,
  allowDM: true,
  channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058", "551693960913879071"], // bots staff-bots bot-development admin-bots
  execute(message, args, getString) {
    const executedBy = getString("executedBy").replace("%%user%%", message.author.tag)
    const ping = Date.now() - message.createdTimestamp

    //Contributed by marzeq. Original idea by Rodry
    let color
    if (ping < 0) { //if ping is negative the color is red
      color = errorColor
      console.log("Something went terribly wrong and the ping is negative. Come pick me up I'm scared.")
    } else if (ping <= 200) { //if ping is less than 200 the color is green
      color = successColor
    } else if (ping <= 400) { //if the ping is between 200 and 400 the color is yellow
      color = loadingColor
    } else { //if ping is higher than 400 the color is red
      color = errorColor
    }
    const embed = new Discord.MessageEmbed()
      .setColor(color)
      .setAuthor(getString("moduleName"))
      .setTitle(getString("pong").replace("%%pingEmote%%", "<:ping:620954198493888512>"))
      .setDescription(getString("message").replace("%%ping%%", ping))
      .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
    message.channel.send(embed)
  }
}
