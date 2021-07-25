import { Command, GetStringFunction } from "../../index"

const command: Command = {
  name: "twitter",
  description: "Gives you a link to the official Hypixel Translators Community Twitter page",
  cooldown: 120,
  allowDM: true,
  channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058", "551693960913879071"], // bots staff-bots bot-development admin-bots
  async execute(interaction, getString: GetStringFunction) {
    await interaction.reply(getString("twitter", { twitter: "<https://twitter.com/HTranslators>" }))
  }
}

export default command
