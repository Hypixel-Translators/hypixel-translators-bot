import Discord from "discord.js"
import { Command } from "../../lib/dbclient"

const command: Command = {
  name: "twitter",
  description: "Gives you a link to the official Hypixel Translators Community Twitter page",
  usage: "+twitter",
  cooldown: 120,
  allowDM: true,
  channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058", "551693960913879071"], // bots staff-bots bot-development admin-bots
  execute(message: Discord.Message, args: string[], getString: (path: string, cmd?: string, lang?: string)=>any) {
    message.channel.send(getString("twitter").replace("%%twitter%%", "<https://twitter.com/HTranslators>"))
  }
}

export default command
