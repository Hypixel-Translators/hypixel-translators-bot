const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
    name: "boop",
    description: "Boop!",
    usage: "boop <mention>",
    cooldown: 600000,
    allowDM: true,
    execute(strings, message, args) {
        if (!args[0]) { throw "noUser" }
        var userToSend = args[0].replace(/[\\<>@#&!]/g, "")
        var boop = "<:Fr:758299142765805599><:om:758299142865944627> " + message.author.tag + "<:B_:758300178784059402><:oo:758299143059275816><:p_:758299143021395978>"
        try {
            if (message.client.members.cache.get(userToSend).presence.status === "online") {
                message.client.members.cache.get(userToSend).send(boop)
            }
        } catch { throw "falseUser" }
    }
}