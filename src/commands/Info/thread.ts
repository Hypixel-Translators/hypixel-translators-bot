import Discord from "discord.js"
import { Command } from "../../lib/dbclient"

const command: Command = {
  name: "thread",
  description: "Gives you a link to the thread announcing this discord",
  usage: "+thread",
  cooldown: 120,
  allowDM: true,
  channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058", "551693960913879071"], // bots staff-bots bot-development admin-bots
  execute(message: Discord.Message, args: string[], getString: (path: string, cmd?: string, lang?: string)=>any) {
    message.channel.send(getString("thread").replace("%%thread%%", "<https://hypixel.net/threads/1970571>"))
  }
}

export default command
