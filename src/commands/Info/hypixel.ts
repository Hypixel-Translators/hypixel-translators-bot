import Discord from "discord.js"
import { Command } from "../../lib/dbclient"

const command: Command = {
  name: "hypixel",
  description: "Gives you useful information regarding the Hypixel Crowdin project.",
  usage: "+hypixel",
  aliases: ["hp"],
  cooldown: 120,
  allowDM: true,
  channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058", "551693960913879071"], // bots staff-bots bot-development admin-bots
  execute(message: Discord.Message, args: string[], getString: (path: string, cmd?: string, lang?: string)=>any) {
    message.channel.send(`${getString("hypixelCrowdin").replace("%%crowdin%%", "<https://crowdin.com/project/hypixel>")}\n${getString("hypixelGuide")}\n${getString("hypixelDiscord").replace("%%discord%%", "<https://discord.gg/hypixel>")}`)
  }
}

export default command
