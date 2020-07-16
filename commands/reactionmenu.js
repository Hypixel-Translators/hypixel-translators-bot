const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
    name: "rolemenu",
    description: "Create a new reaction menu. This isn't immediately functional.",
    usage: "rolemenu",
    cooldown: 3,
    execute(message, args) {
        message.delete();
        var allowed = false
        if (message.author.id == "722738307477536778") { allowed = true }
        if (message.channel.type !== "dm") { if (message.member.roles.cache.has("621071221462663169") || message.member.roles.cache.has("549885657749913621") || message.member.roles.cache.has("241926666400563203")) { allowed = true } }
        if (!allowed) return;

        const embed = new Discord.MessageEmbed()
            .setColor(neutralColor)
            .setTitle("Get notified of bot updates")
            .setDescription("React with 🤖 to get mentioned whenever a bot update comes out. (<@&732615152246980628>)")
            .setFooter("This menu is not fully operational yet, wait about a minute for the changes to come through.");
        message.channel.send(embed).then(msg => {
            msg.react("🤖")
        })
    }
};