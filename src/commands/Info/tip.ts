import Discord from "discord.js"
import { Command } from "../../lib/dbclient"

const command: Command = {
  name: "tip",
  description: "Gives you a random tip.",
  usage: "+tip",
  cooldown: 10,
  allowDM: true,
  allowTip: false,
  channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058", "551693960913879071"], // bots staff-bots bot-development admin-bots
  execute(message: Discord.Message, args: string[], getString: (path: string, cmd?: string, lang?: string)=>any) {
    const keys = Object.keys(getString("tips", "global"))
    const tip = getString(`tips.${keys[keys.length * Math.random() << 0]}`, "global")
    message.channel.send(`**${getString("tip", "global").toUpperCase()}:** ${tip.replace("%%botUpdates%%", "<#732587569744838777>").replace("%%gettingStarted%%", "<#699275092026458122>").replace("%%twitter%%", "<https://twitter.com/HTranslators>").replace("%%rules%%", "<#796159719617986610>").replace("%%serverInfo%%", "<#762341271611506708>").replace("%%bots%%", "<#549894938712866816>")}`)
  }
}

export default command
