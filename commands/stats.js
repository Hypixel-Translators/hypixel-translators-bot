const { workingColor, errorColor, successColor, neutralColor, langdb } = require("../config.json");
const Discord = require("discord.js");
const fetch = require("node-fetch");

module.exports = {
    name: "stats",
    description: "Get the current translation progress.",
    usage: "stats",
    cooldown: 10,
    execute(message, args) {
        if (!message.member.hasPermission("KICK_MEMBERS")) return;
        get(message, args)
    }
}

async function get(message, args) {
    let url = "https://api.crowdin.com/api/project/hypixel/status?login=qkeleq10&account-key=8205d22af119c4233b1940265bdd77d9&json"
    let settings = { method: "Get" }

    fetch(url, settings)
        .then(res => res.json())
        .then((json) => {
            message.client.channels.cache.get("748538826003054643").messages.fetch({ limit: 100 })
                .then(messages => {
                    messages.forEach(async (msg, index, array) => {
                        var r = json[index]
                        console.log(r)
                        const embed = new Discord.MessageEmbed()
                            .setColor(successColor)
                            .setTitle(langdb[r.name].emoji + " | " + r.name)
                            .addFields({ name: (Math.round((100 * r.translated) / r.phrases) + " translated (" + r.translated + "/" + r.phrases + ")"), value: (Math.round((100 * r.approved) / r.phrases) + " approved (" + r.approved + "/" + r.phrases + ")") })
                            //.addFields({ name: r.name, value: ("**" + r.translated + " translated** (" + Math.round((100 * r.translated) / r.phrases) + "% from " + r.phrases + ")\n**" + r.approved + " approved** (" + Math.round((100 * r.approved) / r.phrases) + "% from " + r.phrases + ")"), inline: true })
                            .setFooter("Translate on https://crowdin.com/project/hypixel/" + r.code);
                        if ((index + 1) == array.length) {
                            msg.edit(embed)
                        }
                    })
                })
        })
}