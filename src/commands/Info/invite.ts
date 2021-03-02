import Discord from "discord.js"
import { Command } from "../../lib/dbclient"

const command: Command = {
  name: "invite",
  description: "Gives you the server's invite link.",
  aliases: ["invitelink"],
  usage: "+invite",
  cooldown: 120,
  allowDM: true,
  channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058"], //bots staff-bots bot-dev bot-translators
  execute(message: Discord.Message, args: string[], getString: (path: string, cmd?: string, lang?: string) => any) {
    let inviteURL = "https://discord.gg/rcT948A"
    if (message.guild!.premiumTier >= 3) inviteURL = `discord.gg/${message.client.guilds.cache.get("549503328472530974")!.vanityURLCode}`
    message.channel.send(getString("invite").replace("%%invite%%", inviteURL))
  }
}

export default command
