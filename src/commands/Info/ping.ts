import { loadingColor, errorColor, successColor } from "../../config.json"
import Discord from "discord.js"
import { Command } from "../../index"

const command: Command = {
  name: "ping",
  description: "Gives you the bot's ping",
  usage: "+ping",
  aliases: ["latency", "pong"],
  cooldown: 20,
  allowDM: true,
  channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058", "551693960913879071"], // bots staff-bots bot-development admin-bots
  execute(interaction: Discord.CommandInteraction, args: string[], getString: (path: string, variables?: { [key: string]: string | number } | string, cmd?: string, lang?: string) => any) {
    const executedBy = getString("executedBy", { user: interaction.user.tag }, "global")
    const ping = Date.now() - interaction.createdTimestamp

    //Contributed by marzeq. Original idea by Rodry
    let color
    if (ping < 0) { //if ping is negative the color is red
      color = errorColor
      console.log("Something went terribly wrong and the ping is negative. Come pick me up I'm scared.")
    } else if (ping <= 200) { //if ping is less than 200 the color is green
      color = successColor
    } else if (ping <= 400) { //if the ping is between 200 and 400 the color is yellow
      color = loadingColor
    } else { //if ping is higher than 400 the color is red
      color = errorColor
    }
    const embed = new Discord.MessageEmbed()
      .setColor(color)
      .setAuthor(getString("moduleName"))
      .setTitle(getString("pong", { pingEmote: "<:ping:620954198493888512>" }))
      .setDescription(getString("message", { ping: ping }))
      .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
    interaction.reply(embed)
  }
}

export default command
