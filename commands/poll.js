const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
    name: "poll",
    description: "Creates a poll in the current channel. Arguments are split ",
    usage: "poll <role to ping|'none'>/<question>/<a1 emoji>/<a1 text>/<a2 emoji>/<a2 text>[/...]",
    cooldown: 30,
    execute(message) {
        const args = message.content.slice(6).split("/");
        
    }
}