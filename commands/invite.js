module.exports = {
  name: "invite",
  description: "Gives you the server's invite link.",
  aliases: ["invitelink"],
  usage: "+invite",
  cooldown: 120,
  channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058", "749391414600925335"], //bots staff-bots bot-dev bot-translators
  execute(message, strings) {
    let inviteURL = "https://discord.gg/rcT948A"
    if (message.guild.premiumTier >= 3) inviteURL = `discord.gg/${message.guild.vanityURLCode}`
    message.channel.send(strings.invite.replace("%%invite%%", inviteURL))
  }
}
