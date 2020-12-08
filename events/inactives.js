const { loadingColor, errorColor, successColor, neutralColor, langdb } = require("../config.json");
const Discord = require("discord.js");
const fetch = require("node-fetch");

module.exports = {
    execute(client, manual) {
        var d = new Date()
        var h = d.getUTCHours()
        var m = d.getUTCMinutes()
        if ((h == "2" && m == "00") || manual) {
            check(client)
        }
    }
}

async function check(client) {
    const alert = new Date().getTime() - (7 * 24 * 60 * 60 * 1000)
    //Get date 7 days ago                 d    h    m    s     ms
    const kick = new Date().getTime() - (14 * 24 * 60 * 60 * 1000)
    //Get date 14 days ago                d    h    m    s     ms

    client.guilds.cache.get("549503328472530974").roles.cache.get("739111904672481280").members.forEach(async member => { //guid ID and Unverified
        await client.guilds.cache.get("549503328472530974").members.fetch(member.user.id) //fetch the member
        if (member.roles.cache.has("756199836470214848")) {
            if (member.joinedTimestamp <= kick) {
                member.send("You stood in the verify channel for too long and, because of that, you were kicked for inactivity. If you wish to join back, feel free to do so at https://discord.gg/rcT948A")
                    .then(() => {
                        client.channels.cache.get("662660931838410754").send("**" + member.user.tag + "** has been kicked for inactivity")
                        console.log("Kicked " + member.user.tag + " for inactivity")
                    })
                    .catch(() => {
                        client.channels.cache.get("662660931838410754").send("Kicked **" + member.user.tag + "** for inactivity but couldn't send them a DM with the reason.")
                        console.error("Kicked " + member.user.tag + " for inactivity but couldn't DM them")
                    })
                member.kick("Stood on the server for 14 days without verifying")
            } return;
        }
        if (member.joinedTimestamp <= alert) {
            member.send("Hey there!\nWe noticed you haven't verified yourself on our server. Are you having any trouble? Please message Rodry or Stannya or just ask any questions in the verify channel! Otherwise, please send your profile link like shown in the channel.\n\nThis message was sent to you because you have been on our server for too long, and you're in risk of getting kicked for inactivity soon.\nPlease do not reply to this bot.")
                .then(() => {
                    client.channels.cache.get("662660931838410754").send("Sent an alert to **<@" + member.id + ">** as they've been in the server for 7 days without verifying.")
                    console.log(member.user.tag + " was alerted for inactivity")
                })
                .catch(() => {
                    client.channels.cache.get("662660931838410754").send("Tried to send an alert to **<@" + member.id + ">** as they've been stood in the server for 7 days without verifying, but they had private messages disabled from this server.")
                    console.error("Tried to alert " + member.user.tag + " but they had DMs disabled.")
                })
            member.roles.add("756199836470214848", "Stood on the server for 7 days without verifying")
        } else { console.log(member.user.tag + " wasn't alerted nor kicked") }
    })
}
