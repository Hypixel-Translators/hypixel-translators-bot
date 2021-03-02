import { successColor } from "../../config.json"
import Discord from "discord.js"
import unzalgo from "../../events/unzalgo.js"
import { Command } from "../../lib/dbclient"
import { client } from "../../index"

const command: Command = {
    name: "unzalgo",
    description: "Checks for zalgo characters in member's nicks and changes them",
    usage: "+unzalgo",
    aliases: ["zalgo", "zalgocheck"],
    roleWhitelist: ["768435276191891456"], //Discord Staff
    channelWhitelist: ["624881429834366986", "730042612647723058", "551693960913879071"], // staff-bots bot-development admin-bots
    execute(message: Discord.Message) {
        unzalgo(client, true)
        const embed = new Discord.MessageEmbed()
            .setColor(successColor)
            .setAuthor("Zalgo checker")
            .setTitle("All zalgo nicknames have been changed!")
            .setFooter(`Executed by ${message.author.tag}`, message.author.displayAvatarURL({ format: "png", dynamic: true }))
        message.channel.send(embed)
    }
}

export default command
