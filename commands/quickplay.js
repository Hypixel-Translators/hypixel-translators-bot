const {
    workingColor,
    errorColor,
    successColor,
    neutralColor
} = require("../config.json");
const Discord = require("discord.js");

module.exports = {
    name: "quickplay",
    description: "Gives you the link to the Quickplay translation project.",
    usage: "quickplay",
    cooldown: 30,
    channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058"],
    execute(message) {
        //message.delete();
        message.channel.send("This is the Quickplay translation project on Crowdin:\nhttps://crowdin.com/project/quickplay")
    }
};
