const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
    name: "context",
    description: "Does nothing for now!",
    usage: "context <link/ID>",
    channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058"],
    cooldown: 3,
    execute(message, args) {

    }
}
