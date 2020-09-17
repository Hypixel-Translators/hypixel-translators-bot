const { workingColor, errorColor, successColor, neutralColor, langdb } = require("../config.json");
const Discord = require("discord.js");
const fetch = require("node-fetch");

module.exports = {
    execute(client) {
        var d = new Date();
        var m = d.getHours
        var n = d.getMinutes();
        if (n == "0" && m == "4") {
            check(client)
        }
    }
}

async function check(client) {
    const ms = await message.guild.roles.get('415665311828803584').members.map(m => m.user)
}