const { loadingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");
const { isZalgo } = require("unzalgo");

module.exports = {
    execute(client, manual) {
        var d = new Date()
        var h = d.getUTCHours()
        var m = d.getUTCMinutes()
        if ((h == "4" && m == "00") || manual) check(client)
    }
}

async function check(client) {
    console.log("Checking zalgo nicks now!")
    let members = await client.guilds.cache.get("549503328472530974").members.fetch()
    members.forEach(member => {
        if (isZalgo(member.displayName, 0.1)) {
            member.send("Your nickname on the Hypixel Translators Community Discord was automatically set to Unknown because it had Zalgo in it (here's what it looked like before: " + member.displayName + "). If you believe this is an error, feel free to respond to this message saying so. Keep in mind anything sent in these DMs will be sent to staff and that this message was automated.")
            member.setNickname("Unknown", "More than 90% of user's name was zalgo")
                .then(() => console.log("Changed the nick of " + member.user.tag + " to Unknown becase they had Zalgo in their name"))
                .catch(() => console.log("Changed the nick of " + member.user.tag + " to Unknown because they had Zalgo in their nick, but couldn't DM them with the alert."))
        }
    })
}