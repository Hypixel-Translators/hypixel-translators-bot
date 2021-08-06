import { loadingColor, errorColor, successColor } from "../../config.json"
import Discord from "discord.js"
import { Command, GetStringFunction } from "../../index"

const command: Command = {
  name: "ping",
  description: "Gives you the bot's ping",
  cooldown: 20,
  allowDM: true,
  channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058", "551693960913879071"], // bots staff-bots bot-development admin-bots
  async execute(interaction, getString: GetStringFunction) {
    const executedBy = getString("executedBy", { user: interaction.user.tag }, "global"),
      ping = Date.now() - interaction.createdTimestamp,
      onlineSince = Math.round(interaction.client.readyTimestamp! / 1000)

    //Contributed by marzeq. Original idea by Rodry
    let color: Discord.HexColorString
    if (ping < 0) { //if ping is negative the color is red
      color = errorColor as Discord.HexColorString
      console.log("Something went terribly wrong and the ping is negative. Come pick me up I'm scared.")
    } else if (ping <= 200) { //if ping is less than 200 the color is green
      color = successColor as Discord.HexColorString
    } else if (ping <= 400) { //if the ping is between 200 and 400 the color is yellow
      color = loadingColor as Discord.HexColorString
    } else { //if ping is higher than 400 the color is red
      color = errorColor as Discord.HexColorString
    }
    const embed = new Discord.MessageEmbed()
      .setColor(color)
      .setAuthor(getString("moduleName"))
      .setTitle(getString("pong", { pingEmote: "<:ping:620954198493888512>" }))
      .setDescription(
        `${getString("message", { ping: ping })}\n\n${getString("onlineSince", {
          timestamp: `<t:${onlineSince}>`,
          timestampRelative: `<t:${onlineSince}:R>`
        })}`
      )
      .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
    await interaction.reply({ embeds: [embed] })
  }
}

export default command
