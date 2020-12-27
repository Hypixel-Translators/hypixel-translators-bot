module.exports = {
  name: "skyblockaddons",
  description: "Gives you useful information regarding the SkyblockAddons Crowdin project.",
  usage: "+skyblockaddons",
  aliases: ["sba"],
  cooldown: 120,
  channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058", "749391414600925335", "551693960913879071"], // bots staff-bots bot-development bot-translators admin-bots
  execute(message, strings) {
    //message.delete()
    message.channel.send(strings.sbaCrowdin.replace("%%crowdin%%", "<https://crowdin.com/project/skyblockaddons>") + "\n" + strings.sbaDiscord.replace("%%discord%%", "<https://discord.gg/biscuit>"))
  }
}
