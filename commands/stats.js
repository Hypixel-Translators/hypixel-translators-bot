const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");
const fetch = require("fetch");

module.exports = {
    name: "stats",
    description: "Get the current translation progress.",
    usage: "stats",
    cooldown: 10,
    allowDM: true,
    execute(message, args) {
        get(message, args)
    }
}

async function get(message, args) {
    var itemsProcessed = 0;

    const embed = new Discord.MessageEmbed()
        .setColor(successColor)
        .setTitle("Language status")
        .setFooter("Executed by " + message.author.tag);

    let url = "https://api.crowdin.com/api/project/hypixel/language-status?login=qkeleq10&account-key=8205d22af119c4233b1940265bdd77d9&json"
    fetch(url)
        .then(res => res.json())
        .then((out) => {
            out.forEach(async (r, index, array) => {
                embed.addFields({ name: r.name, value: (r.translated + "translated _(" + ((100 * r.translated) / r.phrases) + "% from " + r.phrases + ")_, " + r.approved + " approved _(" + ((100 * r.translated) / r.phrases) + "% from " + r.phrases + ")_") })
                await itemsProcessed++
                if (itemsProcessed === array.length) {
                    message.channel.send(embed)
                }
            });

        })
        .catch(err => { throw err });
}