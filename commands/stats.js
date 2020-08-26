const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
    name: "bug",
    description: "Report a bug present in the bot.",
    usage: "bug <message>",
    aliases: ["bugreport", "reportbug"],
    cooldown: 480,
    allowDM: true,
    channelBlackList: "621298919535804426",
    execute(message, args) {

    }
}