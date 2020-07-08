const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
    name: "verify",
    description: "Verifies the user on the Hypixel project.",
    usage: "verify <mention> <language> <role> <profile>",
    cooldown: 3,
    execute(message) {
        if (message.member.hasPermission("ADMINISTRATOR")) {
            //message.delete();
            message.channel.send("Not set up yet.")
        }
    }
};