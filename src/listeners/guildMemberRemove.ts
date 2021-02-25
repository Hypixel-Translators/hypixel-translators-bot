import { client } from "../index.js"
import Discord from "discord.js"

client.on("guildMemberRemove", async (member: Discord.GuildMember | Discord.PartialGuildMember) => {
    //Leave message
    const channel = member.guild.channels.cache.get("549882021934137354") as Discord.TextChannel
    channel.send(`**${member.user!.tag}** just left the server 🙁`) //join-leave

    //Run if the member who leaves had the Bot Translator/Proofreader/Manager roles
    const botRole = member.roles.cache.find((role: Discord.Role) => role.name.startsWith("Bot ") && role.id !== "732615152246980628")
    if (botRole) { //bot updates
        const memberDb = await client.db.collection("users").findOne({ id: member.id })
        const staffchannel = client.channels.cache.get("768160446368186428") as Discord.TextChannel
        if (memberDb.profile) staffchannel.send(`${member.user!.tag} had the ${botRole} role and just left the server! Here's their Crowdin profile: ${memberDb.profile}`) //managers
        else staffchannel.send(`${member.user!.tag} had the ${botRole} role and just left the server! Unfortunately, their profile wasn't registered on the database.`) //managers
        console.log(`${member.user!.tag} left and had the ${botRole.name} role`)
    }
    if (member.user!.bot) client.db.collection("users").deleteOne({ id: member.user!.id })
})