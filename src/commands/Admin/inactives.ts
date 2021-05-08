import { successColor } from "../../config.json"
import Discord from "discord.js"
import inactives from "../../events/inactives.js"
import { Command, client } from "../../index"

const command: Command = {
    name: "inactives",
    description: "Checks for inactive unverified members (if applicable).",
    usage: "+inactives",
    aliases: ["updateinactives", "unverifieds", "inactive"],
    allowDM: true,
    roleWhitelist: ["764442984119795732"], //Discord Administrator
    execute(interaction: Discord.CommandInteraction) {
        inactives(client, true)
        const embed = new Discord.MessageEmbed()
            .setColor(successColor)
            .setAuthor("Inactive checker")
            .setTitle("All inactive members have been notified!")
            .setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
        interaction.reply(embed)
    }
}

export default command
