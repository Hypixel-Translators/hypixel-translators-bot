module.exports = {
  name: "invite",
  description: "Gives you the server's invite link.",
  aliases: ["invitelink"],
  usage: "+invite",
  cooldown: 120,
  allowDM: true,
  channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058"], //bots staff-bots bot-dev bot-translators
  execute(message, args, getString) {
    let inviteURL = "https://discord.gg/rcT948A"
    if (message.guild.premiumTier >= 3) inviteURL = `discord.gg/${message.client.guilds.cache.get("549503328472530974").vanityURLCode}`
    message.channel.send(getString("invite").replace("%%invite%%", inviteURL))
  }
}
