import Discord from "discord.js"
import { Command, GetStringFunction } from "../../index"

const command: Command = {
  name: "hypixel",
  description: "Gives you useful information regarding the Hypixel Crowdin project.",
  cooldown: 120,
  allowDM: true,
  channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058", "551693960913879071"], // bots staff-bots bot-development admin-bots
  async execute(interaction: Discord.CommandInteraction, getString: GetStringFunction) {
    await interaction.reply(`${getString("hypixelCrowdin", { crowdin: "<https://crowdin.com/project/hypixel>" })}\n${getString("hypixelGuide")}\n${getString("hypixelDiscord", { discord: "<https://discord.gg/hypixel>" })}`)
  }
}

export default command
