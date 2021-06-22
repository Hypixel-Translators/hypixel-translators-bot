import Discord from "discord.js"
import { Command, GetStringFunction } from "../../index"

const command: Command = {
  name: "quickplay",
  description: "Gives you useful information regarding the Quickplay Crowdin project.",
  cooldown: 120,
  allowDM: true,
  channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058", "551693960913879071"], // bots staff-bots bot-development admin-bots
  async execute(interaction: Discord.CommandInteraction, getString: GetStringFunction) {
    await interaction.reply(`${getString("quickplayCrowdin", { crowdin: "<https://crowdin.com/project/quickplay>" })}\n${getString("quickplayThread", { thread: "<https://hypixel.net/threads/1317410/>" })}\n${getString("quickplayDiscord", { discord: "<https://discord.gg/373EGB4>" })}`)
  }
}

export default command
