const discord = require("discord.js");
const fetch = require("node-fetch");
const { loadingColor, errorColor, successColor, neutralColor } = require("../config.json")

//Credits to marzeq_
module.exports = {
    name: "hypixelstats",
    description: "Shows you basic Hypixel stats of the provided user.",
    usage: "+hypixelstats <username>",
    aliases: ["hstats"],
    cooldown: 60,
    channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058", "749391414600925335"], //bots staff-bots bot-dev bot-translators
    allowDM: true,
    execute(strings, message, args) {
        function parseColorCode(rank) {
            let colorCode = rank.substring(1, 2)
            let colorsJson = { "0": "#000000", "1": "#0000AA", "2": "#00AA00", "3": "#00AAAA", "4": "#AA0000", "5": "#AA00AA", "6": "#FFAA00", "7": "#AAAAAA", "8": "#555555", "9": "#5555FF", "a": "#55FF55", "b": "#55FFFF", "c": "#FF5555", "d": "#FF55FF", "e": "#FFFF55", "f": "#FFFFFF" }
            return colorsJson[colorCode];
        }


        const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
        let username = args[0]
        if (!args[0]) throw "noUser"

        const loadingEmbed = new discord.MessageEmbed()
            .setColor(loadingColor)
            .setAuthor(strings.moduleName)
            .setTitle(strings.loading)
            .setDescription(strings.loadingModule)
            .setFooter(executedBy, message.author.displayAvatarURL())
        message.channel.send(loadingEmbed)
        .then(msg => {
        // make a response to the slothpixel api (hypixel api but we dont need an api key)
        fetch(`https://api.slothpixel.me/api/players/${username}`, { method: "Get" })
            .then(res => (res.json())) // get the response json
            .then((json) => { // here we do stuff with the json

                if (json.error === "Player does not exist" || json.error === "Invalid username or UUID!") throw "falseUser"
                else if (json.error !== undefined) { // if other error we didn't plan for appeared
                    console.log(`Welp, we didn't plan for this to happen. While you have a mental breakdown, enjoy this little error I have for you\n${json.error}`)
                    throw "apiError"
                }

                let rank // some ranks are just prefixes so this code accounts for that
                let color
                if (json.prefix !== null) {
                    color = parseColorCode(json.prefix)
                    rank = json.prefix.replace(/&([0-9]|[a-z])/g, "")
                }
                else {
                    color = parseColorCode(json.rank_formatted)
                    rank = json.rank_formatted.replace(/&([0-9]|[a-z])/g, "")
                }
                username = json.username.split("_").join("\\_") // change the nickname in a way that doesn't accidentally mess up the formatting in the embed
                let language = json.language.toLowerCase().charAt(0).toUpperCase() + json.language.toLowerCase().slice(1) // make the language properly capitalised and not all caps
                let online
                if (json.online == true) online = strings.online
                else online = strings.offline

                let linkDiscord
                if (json.links.DISCORD === null) linkDiscord = "Not connected"
                else linkDiscord = json.links.DISCORD

                for (const [key, value] of Object.entries(json)) {
                    if (value === null) json[key] = strings.unknown
                }

                var last_seen
                if (json.last_game === "unknown") last_seen = strings.lastGameHidden
                else last_seen = strings.lastSeen.replace("%%game%%", json.last_game)

                // craft the embed and send it
                const embed = new discord.MessageEmbed()
                    .setAuthor(strings.moduleName)
                    .setTitle(rank + ' ' + username)
                    .setDescription(strings.description.replace("%%username%%", username).replace("%%link%%", `(https://api.slothpixel.me/api/players/${username})`))
                    .addFields(
                        { name: strings.networkLevel, value: Math.abs(json.level), inline: true },
                        { name: strings.karma, value: json.karma.toLocaleString(), inline: true },
                        { name: online, value: last_seen, inline: true },
                        { name: strings.language, value: language, inline: true },
                        { name: strings.discord, value: linkDiscord, inline: true },
                        { name: strings.uuid, value: json.uuid, inline: true }

                    )
                    .setColor(color)
                    .setFooter(executedBy, message.author.displayAvatarURL())
                    .setThumbnail("https://crafatar.com/renders/body/" + json.uuid + "?overlay")
                msg.edit(embed)
            })
        })
    }
}
