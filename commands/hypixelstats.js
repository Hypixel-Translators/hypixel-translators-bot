const Discord = require("discord.js")
const fetch = require("node-fetch")
const { errorColor } = require("../config.json")

//Credits to marzeq_
module.exports = {
    name: "hypixelstats",
    description: "Shows you basic Hypixel stats for the provided user.",
    usage: "+hypixelstats <username> [social]",
    aliases: ["hstats"],
    cooldown: 45,
    channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058", "749391414600925335"], //bots staff-bots bot-dev bot-translators
    allowDM: true,
    execute(message, strings, args, globalStrings) {
        function parseColorCode(rank) {
            const colorCode = rank.substring(1, 2)
            const colorsJson = { "0": "#000000", "1": "#0000AA", "2": "#00AA00", "3": "#00AAAA", "4": "#AA0000", "5": "#AA00AA", "6": "#FFAA00", "7": "#AAAAAA", "8": "#555555", "9": "#5555FF", "a": "#55FF55", "b": "#55FFFF", "c": "#FF5555", "d": "#FF55FF", "e": "#FFFF55", "f": "#FFFFFF" }
            return colorsJson[colorCode]
        }

        const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
        const credits = strings.madeBy.replace("%%developer%%", message.client.guilds.cache.get("549503328472530974").members.cache.get("500669086947344384").user.tag)
        let username = args[0]
        if (!args[0]) throw "noUser"

        message.channel.startTyping()
        // make a response to the slothpixel api (hypixel api but we dont need an api key)
        fetch(`https://api.slothpixel.me/api/players/${username}`, { method: "Get" })
            .then(res => (res.json())) // get the response json
            .then((json) => { // here we do stuff with the json

                //Handle errors
                if (json.error === "Player does not exist" || json.error === "Invalid username or UUID!") throw "falseUser"
                else if (json.error !== undefined || json.username === null) { // if other error we didn't plan for appeared
                    let error
                    if (json.error === undefined && json.username === null) throw "noPlayer"
                    else if (json.error !== undefined) error = json.error
                    console.log("Welp, we didn't plan for this to happen. While you have a mental breakdown, enjoy this little error I have for you\n" + error)
                    throw "apiError"
                }

                //Define each value
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
                if (json.links.DISCORD === null) linkDiscord = strings.notConnected
                else linkDiscord = json.links.DISCORD.split("_").join("\\_")

                let last_seen
                if (json.last_game === null) last_seen = strings.lastGameHidden
                else last_seen = strings.lastSeen.replace("%%game%%", json.last_game.replace(/([A-Z]+)/g, ' $1').trim())

                let lastLoginSelector
                if (json.online) lastLoginSelector = "last_login"
                else lastLoginSelector = "last_logout"

                let lastLogin
                if (json[lastLoginSelector] !== null) lastLogin = new Date(json[lastLoginSelector]).toLocaleString(strings.dateLocale, { year: 'numeric', month: 'long', day: 'numeric', hour: "2-digit", minute: "2-digit", timeZone: strings.timeZone, timeZoneName: "short" })
                else lastLogin = strings.lastLoginHidden

                const firstLogin = new Date(json.first_login).toLocaleString(strings.dateLocale, { year: 'numeric', month: 'long', day: 'numeric', hour: "2-digit", minute: "2-digit", timeZone: strings.timeZone, timeZoneName: "short" })

                for (const [key, value] of Object.entries(json)) {
                    if (value === null) json[key] = strings.unknown
                }

                if (!args[1] || args[1] === "stats") {
                    const embed = new Discord.MessageEmbed()
                        .setColor(color)
                        .setAuthor(strings.moduleName)
                        .setTitle(`${rank} ${username}`)
                        .setThumbnail(`https://mc-heads.net/body/${json.uuid}/left`)
                        .setDescription(`${strings.description.replace("%%username%%", username).replace("%%link%%", `(https://api.slothpixel.me/api/players/${json.username})`)}\n${strings.updateNotice}\n${strings.mediaTip.replace("%%command%%", `\`+hypixelstats ${json.username} social\``)}`)
                        .addFields(
                            { name: strings.networkLevel, value: Math.abs(json.level).toLocaleString(strings.dateLocale), inline: true },
                            { name: strings.ap, value: json.achievement_points.toLocaleString(strings.dateLocale), inline: true },
                            { name: strings.first_login, value: firstLogin, inline: true },
                            { name: strings.language, value: strings[json.language], inline: true },
                            { name: online, value: last_seen, inline: true },
                            { name: strings[lastLoginSelector], value: lastLogin, inline: true }

                        )
                        .setFooter(`${executedBy} | ${credits}`, message.author.displayAvatarURL())
                    message.channel.stopTyping()
                    message.channel.send(embed)
                } else if (args[1] === "social") {
                    const socialMedia = json.links

                    let twitter
                    if (socialMedia.TWITTER) twitter = `[${strings.link}](${socialMedia.TWITTER})`
                    else twitter = strings.notConnected
                    let youtube
                    if (socialMedia.YOUTUBE) youtube = `[${strings.link}](${socialMedia.YOUTUBE})`
                    else youtube = strings.notConnected
                    let instagram
                    if (socialMedia.INSTAGRAM) instagram = `[${strings.link}](${socialMedia.INSTAGRAM}})`
                    else instagram = strings.notConnected
                    let twitch
                    if (socialMedia.TWITCH) twitch = `[${strings.link}](${socialMedia.TWITCH}})`
                    else twitch = strings.notConnected

                    const allowedLinks = ["https://discord.gg/rcT948A", "https://discord.gg/hypixeltranslators", "https://discord.gg/hypixel", "https://discord.gg/biscuit", "https://discord.gg/373EGB4"] //Our server, Hypixel, Biscuit's Bakery and Quickplay Discord
                    let discord
                    if (socialMedia.DISCORD) {
                        if (!socialMedia.DISCORD.includes("discord.gg")) discord = socialMedia.DISCORD.split("_").join("\\_")
                        else if (allowedLinks.includes(socialMedia.DISCORD)) discord = `[${strings.link}](${socialMedia.DISCORD}})`
                        else {
                            discord = strings.blocked
                            console.log(`Blocked the following Discord link in ${json.username}\'s Hypixel profile: ${socialMedia.DISCORD}`)
                        }
                    } else discord = strings.notConnected

                    let forums
                    if (socialMedia.HYPIXEL) forums = `[${strings.link}](${socialMedia.HYPIXEL})`
                    else forums = strings.notConnected
                    const socialEmbed = new Discord.MessageEmbed()
                        .setColor(color)
                        .setAuthor(strings.moduleName)
                        .setTitle(`${rank} ${username}`)
                        .setThumbnail(`https://mc-heads.net/body/${json.uuid}/left`)
                        .setDescription(`${strings.socialMedia.replace("%%username%%", username).replace("%%link%%", `(https://api.slothpixel.me/api/players/${username})`)}\n${strings.updateNotice}`)
                        .addFields(
                            { name: "Twitter", value: twitter, inline: true },
                            { name: "YouTube", value: youtube, inline: true },
                            { name: "Instagram", value: instagram, inline: true },
                            { name: "Twitch", value: twitch, inline: true },
                            { name: "Discord", value: discord || strings.notConnected, inline: true },
                            { name: "Forums", value: forums, inline: true }
                        )
                        .setFooter(`${executedBy} | ${credits}`, message.author.displayAvatarURL())
                    message.channel.stopTyping()
                    message.channel.send(socialEmbed)
                } else throw "noSubCommand"
            })
            .catch(error => {
                const embed = new Discord.MessageEmbed()
                    .setColor(errorColor)
                    .setAuthor(globalStrings.error)
                    .setTitle(globalStrings.errors[error] || error)
                    .setFooter(executedBy, message.author.displayAvatarURL())
                message.channel.stopTyping()
                message.channel.send(embed)
            })
    }
}
