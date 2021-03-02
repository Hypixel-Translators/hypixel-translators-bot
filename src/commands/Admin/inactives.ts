import { successColor } from "../../config.json"
import Discord from "discord.js"
import inactives from "../../events/inactives.js"
import { client } from "../../index"
import { Command } from "../../lib/dbclient"

const command: Command = {
    name: "inactives",
    description: "Checks for inactive unverified members (if applicable).",
    usage: "+inactives",
    aliases: ["updateinactives", "unverifieds", "inactive"],
    roleWhitelist: ["764442984119795732"], //Discord Administrator
    execute(message: Discord.Message) {
        inactives(client, true)
        const embed = new Discord.MessageEmbed()
            .setColor(successColor)
            .setAuthor("Inactive checker")
            .setTitle("All inactive members have been notified!")
            .setFooter(`Executed by ${message.author.tag}`, message.author.displayAvatarURL({ format: "png", dynamic: true }))
        message.channel.send(embed)
    }
}

export default command
