module.exports = {
  name: "quickplay",
  description: "Gives you useful information regarding the Quickplay Crowdin project.",
  usage: "+quickplay",
  aliases: ["qp"],
  cooldown: 120,
  allowDM: true,
  channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058", "551693960913879071"], // bots staff-bots bot-development admin-bots
  execute(message, args, getString) {
    message.channel.send(`${getString("quickplayCrowdin").replace("%%crowdin%%", "<https://crowdin.com/project/quickplay>")}\n${getString("quickplayThread").replace("%%thread%%", "<https://hypixel.net/threads/1317410/>")}\n${getString("quickplayDiscord").replace("%%discord%%", "<https://discord.gg/373EGB4>")}`)
  }
}
