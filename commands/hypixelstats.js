const discord = require("discord.js");
const fetch = require("node-fetch");
const { loadingColor, errorColor, successColor, neutralColor } = require("../config.json")


/*
PLEASE FOR THE LOVE OF GOD TEST THIS COMMAND.
I CAN'T TEST IT HERE, AND I CAN ONLY TEST IT BY SETTING UP A NEW EMPTY PROJECT, SO PLEASE PLEASE PLEASE TEST IT
*/

//Credits to marzeq_
module.exports = {
    name: "hypixelstats",
    description: "Shows you basic Hypixel stats of the provided user.",
    usage: "+hypixelstats <username>",
    cooldown: 60, // feel free to change it
    channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058", "749391414600925335"], //bots staff-bots bot-dev bot-translators
    allowDM: true,
    execute(strings, message, args) {
        const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
        let username = args[0]

        // make a response to the slothpixel api (hypixel api but we dont need an api key)
        fetch(`https://api.slothpixel.me/api/players/${username}`, { method: "Get" })
            .then(res => (res.json())) // get the response json
            .then((json) => { // here we do stuff with the json

                if (json.error === "Player does not exist") throw "falseUser"
                else if (json.error !== undefined) { // if other error we didn't plan for appeared
                    console.log(`Welp, we didn't plan for this to happen. While you have a mental breakdown, enjoy this little error I have for you\n${json.error}`)
                    throw "apiError"
                }

                let rank // some ranks are just prefixes so this code accounts for that
                if (json.prefix !== null) rank = json.prefix.replace(/&([1-9]|[a-z])/g, "")
                else rank = json.rank_formatted.replace(/&([0-9]|[a-z])/g, "")
                username = json.username.replace("_", "\\_") // change the nickname in a way that doesn't accidentally mess up the formatting in the embed
                let language = json.language.toLowerCase().charAt(0).toUpperCase() + json.language.toLowerCase().slice(1) // make the language properly capitalised and not all caps
                let online
                if (json.online == true) online = strings.online
                else online = strings.offline

                // craft the embed and send it
                const embed = new discord.MessageEmbed()
                    .setAuthor(strings.moduleName)
                    .setTitle(`${rank} ${json.username}`)
                    .setDescription(strings.description.replace("%%username%%", username).replace("%%link%%", `(https://api.slothpixel.me/api/players/${username})`))
                    .addFields(
                        { name: strings.networkLevel, value: +Math.round(json.level), inline: true },
                        { name: strings.karma, value: json.karma.toLocaleString(), inline: true },
                        { name: online, value: strings.lastSeen.replace("%%game%%", json.last_game), inline: true },
                        { name: strings.lastGame, value: json.last_game, inline: true },
                        { name: strings.language, value: language, inline: true },
                        { name: strings.uuid, value: json.uuid, inline: true }

                    )
                    .setFooter(executedBy, message.author.displayAvatarURL())
                    .setThumbnail("https://crafatar.com/renders/body/" + json.uuid + "&overlay")
                message.channel.send(embed)
            })
    }
}
