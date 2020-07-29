const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
    name: "poll",
    description: "Creates a poll in the current channel. Arguments are split ",
    usage: "poll <question>-<",
    cooldown: 30,
    execute(message) {
    }
}