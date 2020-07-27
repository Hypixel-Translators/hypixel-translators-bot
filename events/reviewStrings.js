const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
    execute(reaction) {
        reaction.message.react("⏱")
        setTimeout(() => {
            reaction.message.delete() 
        }, 10000)
    }
}