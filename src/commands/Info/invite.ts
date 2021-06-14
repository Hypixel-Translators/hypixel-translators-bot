import Discord from "discord.js"
import { Command } from "../../index"

const command: Command = {
  name: "invite",
  description: "Gives you the server's invite link.",
  cooldown: 120,
  allowDM: true,
  channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058"], //bots staff-bots bot-dev 
  async execute(interaction: Discord.CommandInteraction, getString: (path: string, variables?: { [key: string]: string | number } | string, cmd?: string, lang?: string) => any) {
    const vanityURLCode = interaction.client.guilds.cache.get("549503328472530974")!.vanityURLCode,
      inviteURL = `https://discord.gg/${vanityURLCode || "rcT948A"}`
    await interaction.reply(getString("invite", { invite: inviteURL }))
  }
}

export default command
