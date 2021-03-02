import Discord from "discord.js"
import { Command } from "../../lib/dbclient"

const command: Command = {
  name: "skyblockaddons",
  description: "Gives you useful information regarding the SkyblockAddons Crowdin project.",
  usage: "+skyblockaddons",
  aliases: ["sba"],
  cooldown: 120,
  allowDM: true,
  channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058", "551693960913879071"], // bots staff-bots bot-development admin-bots
  execute(message: Discord.Message, args: string[], getString: (path: string, cmd?: string, lang?: string)=>any) {
    message.channel.send(`${getString("sbaCrowdin").replace("%%crowdin%%", "<https://crowdin.com/project/skyblockaddons>")}\n${getString("sbaThread").replace("%%thread%%", "<https://hypixel.net/threads/2109217/>")}\n${getString("sbaDiscord").replace("%%discord%%", "<https://discord.gg/biscuit>")}`)
  }
}

export default command
