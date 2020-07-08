const {
    workingColor,
    errorColor,
    successColor,
    neutralColor
} = require("../config.json");
const Discord = require("discord.js");

module.exports = {
    name: "hypixel",
    description: "Gives you the link to the Hypixel translation project.",
    usage: "hypixel",
    cooldown: 30,
    channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058"],
    execute(message) {
        //message.delete();
        message.channel.send("This is the Hypixel translation project on Crowdin:\nhttps://crowdin.com/project/hypixel\nIf you'd like to see the official translation guidelines and other info, run !guidelines.")
    }
};
