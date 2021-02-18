module.exports = {
  name: "skyblockaddons",
  description: "Gives you useful information regarding the SkyblockAddons Crowdin project.",
  usage: "+skyblockaddons",
  aliases: ["sba"],
  cooldown: 120,
  allowDM: true,
  channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058", "551693960913879071"], // bots staff-bots bot-development admin-bots
  execute(message, args, getString) {
    message.channel.send(`${getString("sbaCrowdin").replace("%%crowdin%%", "<https://crowdin.com/project/skyblockaddons>")}\n${getString("sbaThread").replace("%%thread%%", "<https://hypixel.net/threads/2109217/>")}\n${getString("sbaDiscord").replace("%%discord%%", "<https://discord.gg/biscuit>")}`)
  }
}
