const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
    name: "verify",
    description: "Verifies the user on the Hypixel project.",
    usage: "verify <mention> <language> <role> <profile>",
    cooldown: 30,
    channelWhiteList: ["569178590697095168"],
    execute(message) {
        //message.delete();
        message.channel.send("Not set up yet.")
    }
};