import Discord from "discord.js"
import fetch, { FetchError } from "node-fetch"
import { db, DbUser } from "../../lib/dbclient"
import { updateRoles } from "./hypixelverify"
import { Command, client, GetStringFunction } from "../../index"
import { getUUID } from "./minecraft"

//Credits to marzeq
const command: Command = {
    name: "hypixelstats",
    description: "Shows you basic Hypixel stats for the provided user.",
    options: [{
        type: "SUB_COMMAND",
        name: "stats",
        description: "Shows general statistics for the given user",
        options: [{
            type: "STRING",
            name: "username",
            description: "The IGN of the user to get statistics for. Can also be a UUID",
            required: false
        },
        {
            type: "USER",
            name: "user",
            description: "The server member to get statistics for. Only works if the user has verified themselves",
            required: false
        }]
    },
    {
        type: "SUB_COMMAND",
        name: "social",
        description: "Shows the user's linked social media",
        options: [{
            type: "STRING",
            name: "username",
            description: "The IGN of the user to get statistics for. Can also be a UUID",
            required: false
        },
        {
            type: "USER",
            name: "user",
            description: "The server member to get statistics for. Only works if the user has verified themselves",
            required: false
        }]
    }],
    cooldown: 120,
    channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058"], // bots staff-bots bot-dev 
    allowDM: true,
    async execute(interaction: Discord.CommandInteraction, getString: GetStringFunction) {
        const executedBy = getString("executedBy", { user: interaction.user.tag }, "global"),
            credits = getString("madeBy", { developer: interaction.client.users.cache.get("500669086947344384")!.tag }),
            authorDb: DbUser = await client.getUser(interaction.user.id),
            userInput = interaction.options.first()!.options?.get("user")?.user as Discord.User | undefined,
            usernameInput = interaction.options.first()!.options?.get("username")?.value as string | undefined,
            subCommand = interaction.options.first()!.name as string
        let uuid = authorDb.uuid
        if (userInput) {
            const userDb: DbUser = await client.getUser(userInput.id)
            if (userDb.uuid) uuid = userDb.uuid
            else throw "notVerified"
        } else if (usernameInput && usernameInput?.length < 32) uuid = await getUUID(usernameInput)
        else uuid = usernameInput ?? authorDb.uuid
        if (!uuid) throw "noUser"

        await interaction.defer()
        // make a request to the slothpixel api (hypixel api but we dont need an api key)
        await fetch(`https://api.slothpixel.me/api/players/${uuid}`, { headers: { "User-Agent": "Hypixel Translators Bot" }, method: "Get", timeout: 30000 })
            .then(res => (res.json())) // get the response json
            .then(async json => { // here we do stuff with the json

                //Handle errors
                if (json.error === "Player does not exist" || json.error === "Invalid username or UUID!") throw "falseUser"
                else if (json.error === "Player has no Hypixel stats!") throw "noPlayer"
                else if (json.error || !json.username) { // if other error we didn't plan for appeared
                    console.log(`Welp, we didn't plan for this to happen. Something went wrong when trying to get stats for ${uuid}, here's the error\n` + json.error)
                    throw "apiError"
                }

                //Define values used in both subcommands
                let rank: string, // some ranks are just prefixes so this code accounts for that
                    color: string
                if (json.prefix) {
                    color = parseColorCode(json.prefix)
                    rank = json.prefix.replace(/&([0-9]|[a-z])/g, "")
                }
                else {
                    color = parseColorCode(json.rank_formatted)
                    rank = json.rank_formatted.replace(/&([0-9]|[a-z])/g, "")
                }
                const username = json.username.split("_").join("\\_") // change the nickname in a way that doesn't accidentally mess up the formatting in the embed

                //Update user's roles if they're verified
                const uuidDb = await db.collection("users").findOne({ uuid: json.uuid })
                if (uuidDb) updateRoles(interaction.guild!.members.cache.get(uuidDb.id)!, json)

                const stats = async () => {
                    //Define each value
                    let online
                    if (json.online) online = getString("online")
                    else online = getString("offline")

                    let last_seen
                    if (!json.last_game) last_seen = getString("lastGameHidden")
                    else last_seen = getString("lastSeen", { game: json.last_game.replace(/([A-Z]+)/g, ' $1').trim() })

                    let lastLoginSelector: string
                    if (json.online) lastLoginSelector = "last_login"
                    else lastLoginSelector = "last_logout"

                    let timeZone = getString("region.timeZone", "global")
                    if (timeZone.startsWith("crwdns")) timeZone = getString("region.timeZone", "global", "en")
                    let dateLocale = getString("region.dateLocale", "global")
                    if (dateLocale.startsWith("crwdns")) dateLocale = getString("region.dateLocale", "global", "en")
                    let lastLogin
                    if (json[lastLoginSelector]) lastLogin = new Date(json[lastLoginSelector]).toLocaleString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric', hour: "2-digit", minute: "2-digit", timeZone: timeZone, timeZoneName: "short" })
                    else lastLogin = getString("lastLoginHidden")

                    let firstLogin
                    if (json.first_login) firstLogin = new Date(json.first_login).toLocaleString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric', hour: "2-digit", minute: "2-digit", timeZone: timeZone, timeZoneName: "short" })
                    else firstLogin = getString("firstLoginHidden")

                    const statsEmbed = new Discord.MessageEmbed()
                        .setColor(color)
                        .setAuthor(getString("moduleName"))
                        .setTitle(`${rank} ${username}`)
                        .setThumbnail(`https://mc-heads.net/body/${json.uuid}/left`)
                        .setDescription(`${getString("description", { username: username, link: `(https://api.slothpixel.me/api/players/${uuid})` })}\n${uuidDb ? `${getString("userVerified", { user: `<@${uuidDb.id}>` })}\n` : ""}${getString("updateNotice")}\n${getString("otherStats")}`)
                        .addFields(
                            { name: getString("networkLevel"), value: Math.abs(json.level).toLocaleString(dateLocale), inline: true },
                            { name: getString("ap"), value: json.achievement_points.toLocaleString(dateLocale), inline: true },
                            { name: getString("first_login"), value: firstLogin, inline: true },
                            { name: getString("language"), value: getString(json.language), inline: true },
                            { name: online, value: last_seen, inline: true },
                            { name: getString(lastLoginSelector), value: lastLogin, inline: true }

                        )
                        .setFooter(`${executedBy} | ${credits}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                    return statsEmbed
                }

                const social = async () => {
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
                            await interaction.client.fetchInvite(socialMedia.DISCORD)
                                .then(invite => {
                                    if (allowedGuildIDs.includes((invite.channel as Discord.GuildChannel).guild?.id)) discord = `[${getString("link")}](${invite.url})` //invite.channel.guild is used here because invite.guild is not guaranteed according to the docs
                                    else {
                                        discord = getString("blocked")
                                        console.log(`Blocked the following Discord invite link in ${json.username}\'s Hypixel profile: ${socialMedia.DISCORD} (led to ${(invite.channel as Discord.GuildChannel).guild?.name || invite.channel.name})`)
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
                        .setDescription(`${getString("socialMedia", { username: username, link: `(https://api.slothpixel.me/api/players/${uuid})` })}\n${uuidDb ? `${getString("userVerified", { user: `<@${uuidDb.id}>` })}\n` : ""}${getString("updateNotice")}\n${getString("otherStats")}`)
                        .addFields(
                            { name: "Twitter", value: twitter, inline: true },
                            { name: "YouTube", value: youtube, inline: true },
                            { name: "Instagram", value: instagram, inline: true },
                            { name: "Twitch", value: twitch, inline: true },
                            { name: "Discord", value: discord, inline: true },
                            { name: "Hypixel Forums", value: forums, inline: true }
                        )
                        .setFooter(`${executedBy} | ${credits}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                    return socialEmbed
                }

                let embed: Discord.MessageEmbed = new Discord.MessageEmbed()
                if (!subCommand || subCommand === "stats") embed = await stats()
                else if (subCommand === "social") embed = await social()

                let controlButtons = new Discord.MessageActionRow()
                    .addComponents(
                        new Discord.MessageButton()
                            .setCustomID("stats")
                            .setStyle(subCommand === "stats" ? "SECONDARY" : "SUCCESS")
                            .setEmoji("📊")
                            .setLabel(getString("stats")),
                        new Discord.MessageButton()
                            .setCustomID("social")
                            .setStyle(subCommand === "social" ? "SECONDARY" : "SUCCESS")
                            .setEmoji("twitter:821752918352068677")
                            .setLabel(getString("social"))
                    )
                await interaction.editReply({ embeds: [embed], components: [controlButtons] })
                const msg = await interaction.fetchReply() as Discord.Message

                const collector = msg.createMessageComponentInteractionCollector((button: Discord.MessageComponentInteraction) => button.customID === "stats" || button.customID === "social", { time: this.cooldown! * 1000 })

                collector.on("collect", async buttonInteraction => {
                    const userDb: DbUser = await db.collection("users").findOne({ id: buttonInteraction.user.id })
                    if (interaction.user.id !== buttonInteraction.user.id) return await buttonInteraction.reply({ content: getString("pagination.notYours", { command: `/${this.name}` }, "global", userDb.lang), ephemeral: true })
                    else if (buttonInteraction.customID === "stats") embed = await stats()
                    else if (buttonInteraction.customID === "social") embed = await social()
                    controlButtons.components.forEach(button => {
                        if (button.customID === buttonInteraction.customID) button.setStyle("SECONDARY")
                        else button.setStyle("SUCCESS")
                    })
                    await buttonInteraction.update({ embeds: [embed], components: [controlButtons] })
                })

                collector.on("end", async () => {
                    await interaction.editReply({ content: getString("pagination.timeOut", { command: `\`/${this.name}\`` }, "global"), components: [], embeds: [embed] })
                })
            })
            .catch(e => {
                if (e instanceof FetchError) {
                    console.error("Slothpixel is down, sending error.")
                    throw "apiError"
                } else throw e
            })
    }
}

function parseColorCode(rank: string): string {
    const colorCode: string = rank.substring(1, 2)
    const colorsJson: {
        [key: string]: string
    } = { "0": "#000000", "1": "#0000AA", "2": "#00AA00", "3": "#00AAAA", "4": "#AA0000", "5": "#AA00AA", "6": "#FFAA00", "7": "#AAAAAA", "8": "#555555", "9": "#5555FF", "a": "#55FF55", "b": "#55FFFF", "c": "#FF5555", "d": "#FF55FF", "e": "#FFFF55", "f": "#FFFFFF" }
    return colorsJson[colorCode]
}

export default command