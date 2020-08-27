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
    var index = 0

    fetch(url, settings)
        .then(res => res.json())
        .then((json) => {
            json.reverse()
            message.client.channels.cache.get("748538826003054643").messages.fetch({ limit: 100 })
                .then(messages => {
                    messages.forEach(async (msg) => {
                        var r = json[index]
                        var langdbEntry = langdb.find(o => o.name === r.name)
                        const embed = new Discord.MessageEmbed()
                            .setColor(successColor)
                            .setTitle(langdbEntry.emoji + " | " + r.name)
                            .addFields({ name: (Math.round((100 * r.translated) / r.phrases) + "% translated (" + r.translated + "/" + r.phrases + ")"), value: (Math.round((100 * r.approved) / r.phrases) + "% approved (" + r.approved + "/" + r.phrases + ")") })
                            //.addFields({ name: r.name, value: ("**" + r.translated + " translated** (" + Math.round((100 * r.translated) / r.phrases) + "% from " + r.phrases + ")\n**" + r.approved + " approved** (" + Math.round((100 * r.approved) / r.phrases) + "% from " + r.phrases + ")"), inline: true })
                            .setTimestamp()
                            .setFooter("Translate on crowdin.com/project/hypixel/" + r.code);
                        msg.edit("", embed)
                        index++
                    })
                })

            message.client.channels.cache.get("730042612647723058").messages.fetch("748584877921796146")
                .then(stringCount => {
                    if (stringCount.content !== json[0].phrases) {
                        message.client.channels.cache.get("730042612647723058").send("> <a:coolparty:728990234930315344> **New Strings!**\n" + Number(Number(json[0].phrases) - Number(stringCount.content)) + " strings have been added to the Hypixel project.")
                        stringCount.edit(json[0].phrases)
                    }
                })
        })
}