const Discord = require("discord.js");
const fetch = require("node-fetch");
const { loadingColor, errorColor, successColor, neutralColor } = require("../config.json")

//Credits to marzeq_
module.exports = {
    name: "hypixelstats",
    description: "Shows you basic Hypixel stats for the provided user.",
    usage: "+hypixelstats <username>",
    aliases: ["hstats"],
    cooldown: 45,
    channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058", "749391414600925335"], //bots staff-bots bot-dev bot-translators
    allowDM: true,
    execute(message, strings, args, globalStrings) {
        function parseColorCode(rank) {
            let colorCode = rank.substring(1, 2)
            let colorsJson = { "0": "#000000", "1": "#0000AA", "2": "#00AA00", "3": "#00AAAA", "4": "#AA0000", "5": "#AA00AA", "6": "#FFAA00", "7": "#AAAAAA", "8": "#555555", "9": "#5555FF", "a": "#55FF55", "b": "#55FFFF", "c": "#FF5555", "d": "#FF55FF", "e": "#FFFF55", "f": "#FFFFFF" }
            return colorsJson[colorCode];
        }


        const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
        const credits = strings.madeBy.replace("%%developer%%", message.guild.members.cache.get("500669086947344384").user.tag)
        let username = args[0]
        if (!args[0]) throw "noUser"

        const loadingEmbed = new Discord.MessageEmbed()
            .setColor(loadingColor)
            .setAuthor(strings.moduleName)
            .setTitle(strings.loading)
            .setDescription(strings.loadingModule)
            .setFooter(`${executedBy} | ${credits}`, message.author.displayAvatarURL())
        message.channel.send(loadingEmbed)
            .then(msg => {
                // make a response to the slothpixel api (hypixel api but we dont need an api key)
                fetch(`https://api.slothpixel.me/api/players/${username}`, { method: "Get" })
                    .then(res => (res.json())) // get the response json
                    .then((json) => { // here we do stuff with the json

                        if (json.error === "Player does not exist" || json.error === "Invalid username or UUID!") throw "falseUser"
                        else if (json.error !== undefined || json.username === null) { // if other error we didn't plan for appeared
                            let error
                            if (json.error === undefined && json.username === null) error = "The user doesn't have a username for some reason"
                            else if (json.error !== undefined) error = json.error
                            console.log("Welp, we didn't plan for this to happen. While you have a mental breakdown, enjoy this little error I have for you\n" + error)
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
                        let online
                        if (json.online == true) online = strings.online
                        else online = strings.offline

                        let linkDiscord
                        if (json.links.DISCORD === null) linkDiscord = "Not connected"
                        else linkDiscord = json.links.DISCORD

                        var last_seen
                        if (json.last_game === null) last_seen = strings.lastGameHidden
                        else last_seen = strings.lastSeen.replace("%%game%%", json.last_game.replace(/([A-Z]+)/g, ' $1').trim())

                        let lastLoginSelector
                        if (json.online) { lastLoginSelector = "last_login" } else { lastLoginSelector = "last_logout" }
                        let lastLogin

                        if (json[lastLoginSelector] !== null) lastLogin = new Date(json[lastLoginSelector]).toLocaleString(strings.dateLocale, { year: 'numeric', month: 'long', day: 'numeric', hour: "2-digit", minute: "2-digit", timeZone: strings.timeZone, timeZoneName: "short" })
                        else lastLogin = strings.lastLoginHidden


                        for (const [key, value] of Object.entries(json)) {
                            if (value === null) json[key] = strings.unknown
                        }

                        // craft the embed and send it
                        const embed = new Discord.MessageEmbed()
                            .setAuthor(strings.moduleName)
                            .setTitle(rank + " " + username)
                            .setDescription(strings.description.replace("%%username%%", username).replace("%%link%%", `(https://api.slothpixel.me/api/players/${username})`))
                            .addFields(
                                { name: strings.networkLevel, value: Math.abs(json.level).toLocaleString(strings.dateLocale), inline: true },
                                { name: strings.ap, value: json.achievement_points.toLocaleString(strings.dateLocale), inline: true },
                                { name: online, value: last_seen, inline: true },
                                { name: strings.language, value: strings[json.language], inline: true },
                                { name: strings.discord, value: linkDiscord, inline: true },
                                { name: strings[lastLoginSelector], value: lastLogin, inline: true }

                            )
                            .setColor(color)
                            .setFooter(`${executedBy} | ${credits}`, message.author.displayAvatarURL())
                            .setThumbnail("https://crafatar.com/renders/body/" + json.uuid + "?overlay")
                        msg.edit(embed)
                    })
                    .catch((error) => {
                        const embed = new Discord.MessageEmbed()
                            .setColor(errorColor)
                            .setAuthor(globalStrings.error)
                            .setTitle(globalStrings[error] || error)
                            .setFooter(`${executedBy} | ${credits}`, message.author.displayAvatarURL())

                        msg.edit(embed)
                    })
            })
    }
}
