import Discord from "discord.js"
import { Command } from "../../index"

const command: Command = {
  name: "skyblockaddons",
  description: "Gives you useful information regarding the SkyblockAddons Crowdin project.",
  usage: "+skyblockaddons",
  aliases: ["sba"],
  cooldown: 120,
  allowDM: true,
  channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058", "551693960913879071"], // bots staff-bots bot-development admin-bots
  execute(interaction: Discord.CommandInteraction, args: string[], getString: (path: string, variables?: { [key: string]: string | number } | string, cmd?: string, lang?: string) => any) {
    interaction.reply(`${getString("sbaCrowdin", { crowdin: "<https://crowdin.com/project/skyblockaddons>" })}\n${getString("sbaThread", { thread: "<https://hypixel.net/threads/2109217/>" })}\n${getString("sbaDiscord", { discord: "https://discord.gg/zWyr3f5GXz" })}`)
  }
}

export default command
