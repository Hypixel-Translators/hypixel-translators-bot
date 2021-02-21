module.exports = {
  name: "thread",
  description: "Gives you a link to the thread announcing this discord",
  usage: "+thread",
  cooldown: 120,
  allowDM: true,
  channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058", "551693960913879071"], // bots staff-bots bot-development admin-bots
  execute(message, args, getString) {
    message.channel.send(getString("thread").replace("%%thread%%", "<https://hypixel.net/threads/1970571>"))
  }
}
