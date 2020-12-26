const { loadingColor, errorColor, successColor, blurple } = require("../config.json")
const Discord = require("discord.js")

module.exports = {
  name: "thread",
  description: "Gives you a link to the thread announcing this discord",
  usage: "+thread",
  cooldown: 120,
  channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058", "749391414600925335", "551693960913879071"], // bots staff-bots bot-development bot-translators admin-bots
  execute(message, strings) {
    //message.delete()
    message.channel.send(strings.thread.replace("%%thread%%", "<https://hypixel.net/threads/1970571>"))
  }
}
