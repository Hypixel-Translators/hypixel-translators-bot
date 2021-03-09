import Discord from "discord.js"
import { client } from "../index"

client.on("voiceStateUpdate", (oldState, newState) => {
    if (newState.guild.id === "549503328472530974") {
        const logs = client.channels.cache.get("591280178873892901") as Discord.TextChannel
        const successColor = "43B581"
        const errorColor = "FF470F"
        if (oldState.serverMute != newState.serverMute) {
            const embed = new Discord.MessageEmbed()
                .setColor(newState.serverMute ? errorColor : successColor)
                .setAuthor(newState.member!.user.tag, newState.member!.user.displayAvatarURL({ format: "png", dynamic: true }))
                .setDescription(`**${newState.member} was server ${newState.serverMute ? "muted" : "unmuted"} in ${newState.channel!.name}**`)
                .setFooter(`ID: ${newState.member!.id}`)
                .setTimestamp(Date.now())
            logs.send(embed)
        } else if (oldState.serverDeaf != newState.serverDeaf) {
            const embed = new Discord.MessageEmbed()
                .setColor(newState.serverDeaf ? errorColor : successColor)
                .setAuthor(newState.member!.user.tag, newState.member!.user.displayAvatarURL({ format: "png", dynamic: true }))
                .setDescription(`**${newState.member} was server ${newState.serverDeaf ? "deafened" : "undeafened"} in ${newState.channel?.name}**`)
                .setFooter(`ID: ${newState.member!.id}`)
                .setTimestamp(Date.now())
            logs.send(embed)
        }
    }
})