import Discord from "discord.js"
import { client } from "../index"

client.on("voiceStateUpdate", (oldState, newState) => {
    if (newState.guild.id === "549503328472530974") {
        const logs = client.channels.cache.get("591280178873892901") as Discord.TextChannel,
            successColor = "43B581",
            errorColor = "FF470F",
        
        // Give users access to #no-mic
        if (!oldState.channel && newState.channel) newState.member!.roles.add("829312419406020608", "Joined a voice channel") // In Voice
        else if (oldState.channel && !newState.channel) newState.member!.roles.remove("829312419406020608", "Left a voice channel")

        if (oldState.serverMute != newState.serverMute) {
            const embed = new Discord.MessageEmbed()
                .setColor(newState.serverMute ? errorColor : successColor)
                .setAuthor(newState.member!.user.tag, newState.member!.user.displayAvatarURL({ format: "png", dynamic: true }))
                .setDescription(`**${newState.member} was server ${newState.serverMute ? "muted" : "unmuted"} in ${newState.channel?.name}**`)
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