import Discord from "discord.js"
import { Command } from "../../lib/dbclient"

const command: Command = {
  name: "quickplay",
  description: "Gives you useful information regarding the Quickplay Crowdin project.",
  usage: "+quickplay",
  aliases: ["qp"],
  cooldown: 120,
  allowDM: true,
  channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058", "551693960913879071"], // bots staff-bots bot-development admin-bots
  execute(message: Discord.Message, args: string[], getString: (path: string, cmd?: string, lang?: string) => any) {
    message.channel.send(`${getString("quickplayCrowdin").replace("%%crowdin%%", "<https://crowdin.com/project/quickplay>")}\n${getString("quickplayThread").replace("%%thread%%", "<https://hypixel.net/threads/1317410/>")}\n${getString("quickplayDiscord").replace("%%discord%%", "<https://discord.gg/373EGB4>")}`)
  }
}

export default command
