const { workingColor, errorColor, successColor, neutralColor, langdb } = require("../config.json");
const Discord = require("discord.js");
const fetch = require("node-fetch");

module.exports = {
    execute(client) {
        var d = new Date()
        var m = d.getUTCHours()
        var n = d.getUTCMinutes()
        if (n == "3" && m == "19") {
            check(client)
        }
    }
}

async function check(client) {
    var timestamp = new Date().getTime() - (7 * 24 * 60 * 60 * 1000)
    //Get date 7 days ago                   d   h    m    s    ms
    var timestamp2 = new Date().getTime() - (14 * 24 * 60 * 60 * 1000)
    //Get date 14 days ago                   d    h    m    s    ms

    await client.guilds.cache.get().guild.roles.get('415665311828803584').members.forEach(async m => {
        if (m.joinedAt > timestamp) {
            m.send("Hey there!\nWe noticed you haven't verified yourself on our server. Are you having any trouble? Please message Rodry or Stannya or just ask any questions in the verify channel! Otherwise, please send your profile link like shown in the channel.\n\nThis message was sent to you because you have been on our server for too long, and you're in risk of getting kicked for inactivity soon.\nPlease do not reply to this bot.")
            client.channels.cache.get("662660931838410754").send("Sent an alert to **<@" + m.id + ">** as they've been stood in the server for 7 days without verifying.")
        }
    })
}