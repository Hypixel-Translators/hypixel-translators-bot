const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
    execute(reaction, user) {
        setTimeout(() => {
            if (reaction.message.reactions.cache.get(reaction).count > 0) { reaction.message.delete() }
        }, 10000)
    }
}