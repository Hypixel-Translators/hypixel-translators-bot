import Discord from "discord.js"
import { Command, GetStringFunction } from "../../index"

const command: Command = {
  name: "skyblockaddons",
  description: "Gives you useful information regarding the SkyblockAddons Crowdin project.",
  cooldown: 120,
  allowDM: true,
  channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058", "551693960913879071"], // bots staff-bots bot-development admin-bots
  async execute(interaction: Discord.CommandInteraction, getString: GetStringFunction) {
    await interaction.reply(`${getString("sbaCrowdin", { crowdin: "<https://crowdin.com/project/skyblockaddons>" })}\n${getString("sbaThread", { thread: "<https://hypixel.net/threads/2109217/>" })}\n${getString("sbaDiscord", { discord: "https://discord.gg/zWyr3f5GXz" })}`)
  }
}

export default command
