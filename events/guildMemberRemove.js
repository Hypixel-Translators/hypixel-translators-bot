const { client } = require("../index.js")
const { getDb } = require("../lib/mongodb")

client.on("guildMemberRemove", member => {
    //Leave message
    member.guild.channels.cache.get("549882021934137354").send(`**${member.user.tag}** just left the server 🙁`) //join-leave

    //Run if the member who leaves had the Bot Translator/Proofreader/Manager roles
    const botRole = member.roles.cache.find(role => role.name.startsWith("Bot ") && role.id !== "732615152246980628")
    if (botRole) { //bot updates
        client.channels.cache.get("768160446368186428").send(`${member.user.tag} had the ${botRole} role and just left the server!`) //managers
        console.log(`${member.user.tag} left and had the ${botRole.name} role`)
    }
    if (!member.user.bot) getDb().collection("users").deleteOne({ id: member.user.id })
})