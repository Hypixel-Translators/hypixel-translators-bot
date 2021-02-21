const Discord = require("discord.js")
const fetch = require("node-fetch")
const { getUser, getDb } = require("../../lib/mongodb")
const { updateRoles } = require("./hypixelverify")

//Credits to marzeq_
module.exports = {
    name: "hypixelstats",
    description: "Shows you basic Hypixel stats for the provided user.",
    usage: "+hypixelstats [username] [social]",
    aliases: ["hstats"],
    cooldown: 45,
    channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058"], //bots staff-bots bot-dev bot-translators
    allowDM: true,
    async execute(message, args, getString) {
        function parseColorCode(rank) {
            const colorCode = rank.substring(1, 2)
            const colorsJson = { "0": "#000000", "1": "#0000AA", "2": "#00AA00", "3": "#00AAAA", "4": "#AA0000", "5": "#AA00AA", "6": "#FFAA00", "7": "#AAAAAA", "8": "#555555", "9": "#5555FF", "a": "#55FF55", "b": "#55FFFF", "c": "#FF5555", "d": "#FF55FF", "e": "#FFFF55", "f": "#FFFFFF" }
            return colorsJson[colorCode]
        }

        const executedBy = getString("executedBy").replace("%%user%%", message.author.tag)
        const credits = getString("madeBy").replace("%%developer%%", message.guild.members.cache.get("500669086947344384").user.tag)
        const authorDb = await getUser(message.author.id)
        let username = authorDb.uuid
        if (args[0]) username = args[0].replace(/[\\<>@#&!]/g, "")
        if (message.guild.members.cache.get(username)) {
            const userDb = await getUser(username)
            if (userDb.uuid) username = userDb.uuid
            else throw "notVerified"
        }
        if (!username) throw "noUser"

        message.channel.startTyping()
        // make a response to the slothpixel api (hypixel api but we dont need an api key)
        await fetch(`https://api.slothpixel.me/api/players/${username}`, { method: "Get" })
            .then(res => (res.json())) // get the response json
            .then(async json => { // here we do stuff with the json

                //Handle errors
                if (json.error === "Player does not exist" || json.error === "Invalid username or UUID!") throw "falseUser"
                else if (json.error || !json.username) { // if other error we didn't plan for appeared
                    let error
                    if (!json.error && !json.username) throw "noPlayer"
                    else if (json.error) error = json.error
                    console.log("Welp, we didn't plan for this to happen. While you have a mental breakdown, enjoy this little error I have for you\n" + error)
                    throw "apiError"
                }

                //Update user's roles if they're verified
                if (json.uuid === authorDb.uuid) updateRoles(message.member, json)
                else {
                    const userDb = await getDb().collection("users").findOne({ uuid: json.uuid })
                    if (userDb) updateRoles(message.guild.members.cache.get(userDb.id), json)
                }

                //Define values used in both subcommands
                let rank // some ranks are just prefixes so this code accounts for that
                let color
                if (json.prefix) {
                    color = parseColorCode(json.prefix)
                    rank = json.prefix.replace(/&([0-9]|[a-z])/g, "")
                }
                else {
                    color = parseColorCode(json.rank_formatted)
                    rank = json.rank_formatted.replace(/&([0-9]|[a-z])/g, "")
                }
                username = json.username.split("_").join("\\_") // change the nickname in a way that doesn't accidentally mess up the formatting in the embed

                if (!args[1] || args[1] === "stats") {

                    //Define each value
                    let online
                    if (json.online) online = getString("online")
                    else online = getString("offline")

                    let last_seen
                    if (!json.last_game) last_seen = getString("lastGameHidden")
                    else last_seen = getString("lastSeen").replace("%%game%%", json.last_game.replace(/([A-Z]+)/g, ' $1').trim())

                    let lastLoginSelector
                    if (json.online) lastLoginSelector = "last_login"
                    else lastLoginSelector = "last_logout"

                    let timeZone = getString("timeZone")
                    if (timeZone.startsWith("crwdns")) timeZone = getString("timeZone", this.name, "en")
                    let dateLocale = getString("dateLocale")
                    if (dateLocale.startsWith("crwdns")) dateLocale = getString("dateLocale", this.name, "en")
                    let lastLogin
                    if (json[lastLoginSelector]) lastLogin = new Date(json[lastLoginSelector]).toLocaleString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric', hour: "2-digit", minute: "2-digit", timeZone: timeZone, timeZoneName: "short" })
                    else lastLogin = getString("lastLoginHidden")

                    let firstLogin
                    if (json.first_login) firstLogin = new Date(json.first_login).toLocaleString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric', hour: "2-digit", minute: "2-digit", timeZone: timeZone, timeZoneName: "short" })
                    else firstLogin = getString("firstLoginHidden")

                    for (const [key, value] of Object.entries(json)) {
                        if (!value) json[key] = getString("unknown")
                    }

                    //Get user's current name to suggest for the other command
                    const currentName = await getCurrentName(json.uuid)

                    const embed = new Discord.MessageEmbed()
                        .setColor(color)
                        .setAuthor(getString("moduleName"))
                        .setTitle(`${rank} ${username}`)
                        .setThumbnail(`https://mc-heads.net/body/${json.uuid}/left`)
                        .setDescription(`${getString("description").replace("%%username%%", username).replace("%%link%%", `(https://api.slothpixel.me/api/players/${json.username})`)}\n${getString("updateNotice")}\n${getString("mediaTip").replace("%%command%%", `\`+hypixelstats ${currentName} social\``)}`)
                        .addFields(
                            { name: getString("networkLevel"), value: Math.abs(json.level).toLocaleString(dateLocale), inline: true },
                            { name: getString("ap"), value: json.achievement_points.toLocaleString(dateLocale), inline: true },
                            { name: getString("first_login"), value: firstLogin, inline: true },
                            { name: getString("language"), value: getString(json.language), inline: true },
                            { name: online, value: last_seen, inline: true },
                            { name: getString(lastLoginSelector), value: lastLogin, inline: true }

                        )
                        .setFooter(`${executedBy} | ${credits}`, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                    message.channel.stopTyping()
                    message.channel.send(embed)
                } else if (args[1] === "social") {
                    const socialMedia = json.links

                    let twitter
                    if (socialMedia.TWITTER) {
                        if (!socialMedia.TWITTER.startsWith("https://")) twitter = `[${getString("link")}](https://${socialMedia.TWITTER})`
                        else twitter = `[${getString("link")}](${socialMedia.TWITTER})`
                    } else twitter = getString("notConnected")
                    let youtube
                    if (socialMedia.YOUTUBE) {
                        if (!socialMedia.YOUTUBE.startsWith("https://")) youtube = `[${getString("link")}](https://${socialMedia.YOUTUBE})`
                        else youtube = `[${getString("link")}](${socialMedia.YOUTUBE})`
                    } else youtube = getString("notConnected")
                    let instagram
                    if (socialMedia.INSTAGRAM) {
                        if (!socialMedia.INSTAGRAM.startsWith("https://")) instagram = `[${getString("link")}](https://${socialMedia.INSTAGRAM})`
                        else instagram = `[${getString("link")}](${socialMedia.INSTAGRAM})`
                    } else instagram = getString("notConnected")
                    let twitch
                    if (socialMedia.TWITCH) {
                        if (!socialMedia.TWITCH.startsWith("https://")) twitch = `[${getString("link")}](https://${socialMedia.TWITCH})`
                        else twitch = `[${getString("link")}](${socialMedia.TWITCH})`
                    } else twitch = getString("notConnected")

                    const allowedGuildIDs = ["489529070913060867", "549503328472530974", "418938033325211649", "450878205294018560"] //Hypixel, our server, Quickplay Discord and Biscuit's Bakery
                    let discord = null
                    if (socialMedia.DISCORD) {
                        if (!socialMedia.DISCORD.includes("discord.gg")) discord = socialMedia.DISCORD.split("_").join("\\_")
                        else {
                            await message.client.fetchInvite(socialMedia.DISCORD)
                                .then(invite => {
                                    if (allowedGuildIDs.includes(invite.channel.guild?.id)) discord = `[${getString("link")}](${invite.url})` //invite.channel.guild is used here because invite.guild is not guaranteed according to the docs
                                    else {
                                        discord = getString("blocked")
                                        console.log(`Blocked the following Discord invite link in ${json.username}\'s Hypixel profile: ${socialMedia.DISCORD} (led to ${invite.channel.guild.name})`)
                                    }
                                })
                                .catch(() => {
                                    discord = getString("notConnected")
                                    console.log(`The following Discord invite link in ${json.username}\` profile was invalid: ${socialMedia.DISCORD}`)
                                })
                        }
                    } else discord = getString("notConnected")

                    let forums
                    if (socialMedia.HYPIXEL) {
                        if (!socialMedia.HYPIXEL.startsWith("https://")) forums = `[${getString("link")}](https://${socialMedia.HYPIXEL})`
                        else forums = `[${getString("link")}](${socialMedia.HYPIXEL})`
                    } else forums = getString("notConnected")
                    const socialEmbed = new Discord.MessageEmbed()
                        .setColor(color)
                        .setAuthor(getString("moduleName"))
                        .setTitle(`${rank} ${username}`)
                        .setThumbnail(`https://mc-heads.net/body/${json.uuid}/left`)
                        .setDescription(`${getString("socialMedia").replace("%%username%%", username).replace("%%link%%", `(https://api.slothpixel.me/api/players/${username})`)}\n${getString("updateNotice")}`)
                        .addFields(
                            { name: "Twitter", value: twitter, inline: true },
                            { name: "YouTube", value: youtube, inline: true },
                            { name: "Instagram", value: instagram, inline: true },
                            { name: "Twitch", value: twitch, inline: true },
                            { name: "Discord", value: discord, inline: true },
                            { name: "Forums", value: forums, inline: true }
                        )
                        .setFooter(`${executedBy} | ${credits}`, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                    message.channel.stopTyping()
                    message.channel.send(socialEmbed)
                } else throw "noSubCommand"
            })
            .catch(e => {
                if (e instanceof fetch.FetchError) {
                    console.error("slothpixel is down, sending error.")
                    throw "apiError"
                } else throw e
            })
    }
}

async function getCurrentName(uuid) {
    let name
    await fetch(`https://api.mojang.com/user/profiles/${uuid}/names`)
        .then(res => (res.json()))
        .then(async json => {
            name = json.pop().name
        })
    return name
}