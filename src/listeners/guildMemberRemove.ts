import { client } from "../index"
import { db } from "../lib/dbclient"
import Discord from "discord.js"

client.on("guildMemberRemove", async member => {
    if (member.guild.id !== "549503328472530974") return
    //Leave message
    const joinLeave = member.guild.channels.cache.get("549882021934137354") as Discord.TextChannel
    await joinLeave.send(`**${member.user!.tag}** just left the server 🙁`)

    //Run if the member who leaves had the Bot Translator/Proofreader/Manager roles
    const botRole = member.roles.cache.find(role => role.name.startsWith("Bot ") && role.id !== "732615152246980628")
    if (botRole) { //bot updates
        const memberDb = await db.collection("users").findOne({ id: member.id }),
            managers = client.channels.cache.get("768160446368186428") as Discord.TextChannel
        if (memberDb.profile) await managers.send({ content: `${member.user!.tag} had the ${botRole} role and just left the server! Here's their Crowdin profile: ${memberDb.profile}`, allowedMentions: { roles: [] } })
        else await managers.send({ content: `${member.user!.tag} had the ${botRole} role and just left the server! Unfortunately, their profile wasn't registered on the database.`, allowedMentions: { roles: [] } })
        console.log(`${member.user!.tag} left and had the ${botRole.name} role`)
    }
    if (!member.user!.bot) await db.collection("users").deleteOne({ id: member.user!.id })
})