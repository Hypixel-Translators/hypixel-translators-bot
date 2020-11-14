const { workingColor, errorColor, successColor, neutralColor, langdb } = require("../config.json");
const Discord = require("discord.js");
const fetch = require("node-fetch");

module.exports = {
    execute(client, manual) {
        var d = new Date()
        var h = d.getUTCHours()
        var m = d.getUTCMinutes()
        if (h == "22" && m == "30" || manual) {
            check(client)
        }
    }
}

async function check(client) {
    var alert = new Date().getTime() - (7 * 24 * 60 * 60 * 1000)
    //Get date 7 days ago                   d   h    m    s    ms
    var kick = new Date().getTime() - (14 * 24 * 60 * 60 * 1000)
    //Get date 14 days ago                   d    h    m    s    ms

    await client.guilds.cache.get("549503328472530974").roles.get("777270531857711114").members.forEach(async member => { //guid ID and Unverified(testing for now)
        if (member.joinedAt >= alert) {
            member.send("Hey there!\nWe noticed you haven't verified yourself on our server. Are you having any trouble? Please message Rodry or Stannya or just ask any questions in the verify channel! Otherwise, please send your profile link like shown in the channel.\n\nThis message was sent to you because you have been on our server for too long, and you're in risk of getting kicked for inactivity soon.\nPlease do not reply to this bot.")
            client.channels.cache.get("662660931838410754").send("Sent an alert to **<@" + member.id + ">** as they've been stood in the server for 7 days without verifying.") //verify-logs
            console.log(member)
        }
    })
}