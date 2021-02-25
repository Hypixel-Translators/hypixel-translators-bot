const Discord = require("discord.js")
const { prefix, successColor, errorColor } = require("../../config.json")
const fetch = require("node-fetch")
const { getDb } = require("../../lib/mongodb")

module.exports = {
    name: "hypixelverify",
    description: "Links your Discord account with your Hypixel player",
    usage: "+hypixelverify <username>",
    aliases: ["hverify", "hypixellink", "hlink", "hypixelunverify", "hunverify"],
    cooldown: 60,
    channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058"], //bots staff-bots bot-dev bot-translators
    async execute(message, args, getString) {
        const executedBy = getString("executedBy").replace("%%user%%", message.author.tag)

        const command = message.content.slice(prefix.length).split(" ")[0].toLowerCase()
        if (command === "hypixelunverify" || command === "hunverify") {
            await this.updateRoles(message.member)
            await getDb().collection("users").updateOne({ id: message.author.id }, { $set: { uuid: "" } }).then(async r => {
                if (r.result.nModified) {
                    const embed = new Discord.MessageEmbed()
                        .setColor(successColor)
                        .setAuthor(getString("moduleName"))
                        .setTitle(getString("unverified"))
                        .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                    return message.channel.send(embed)
                } else {
                    const embed = new Discord.MessageEmbed()
                        .setColor(errorColor)
                        .setAuthor(getString("moduleName"))
                        .setTitle(getString("notUnverified"))
                        .setDescription(getString("whyNotUnverified"))
                        .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                    return message.channel.send(embed)
                }
            })
            return
        }
        if (!args[0]) throw "noUser"

        // make a response to the slothpixel api (hypixel api but we dont need an api key)
        await fetch(`https://api.slothpixel.me/api/players/${args[0]}`, { method: "Get" })
            .then(res => (res.json())) // get the response json
            .then(async json => { // here we do stuff with the json
                message.channel.startTyping()

                //Handle errors
                if (json.error === "Player does not exist" || json.error === "Invalid username or UUID!") throw "falseUser"
                else if (json.error !== undefined || json.username === null) { // if other error we didn't plan for appeared
                    let error
                    if (json.error === undefined && json.username === null) throw "noPlayer"
                    else if (json.error !== undefined) error = json.error
                    console.log("Welp, we didn't plan for this to happen. While you have a mental breakdown, enjoy this little error I have for you\n" + error)
                    throw "apiError"
                }
                if (json.links?.DISCORD === message.author.tag) {
                    await getDb().collection("users").updateOne({ id: message.author.id }, { $set: { uuid: json.uuid } }).then(async r => {
                        const role = await this.updateRoles(message.member, json)
                        if (r.result.nModified) {
                            const successEmbed = new Discord.MessageEmbed()
                                .setColor(successColor)
                                .setAuthor(getString("moduleName"))
                                .setTitle(getString("success").replace("%%player%%", json.username))
                                .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                            if (role) successEmbed.setDescription(getString("role").replace("%%role%%", role))
                            else successEmbed.setDescription(getString("noRoles"))
                            message.channel.stopTyping()
                            return message.channel.send(successEmbed)
                        } else {
                            const notChanged = new Discord.MessageEmbed()
                                .setColor(errorColor)
                                .setAuthor(getString("moduleName"))
                                .setTitle(getString("alreadyVerified"))
                                .setDescription(getString("nameChangeDisclaimer"))
                                .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                            message.channel.stopTyping()
                            return message.channel.send(notChanged)
                        }
                    })
                } else {
                    const errorEmbed = new Discord.MessageEmbed()
                        .setColor(errorColor)
                        .setAuthor(getString("moduleName"))
                        .setTitle(getString("error"))
                        .setDescription(getString("tutorial").replace("%%tag%%", message.author.tag))
                        .setImage("https://i.imgur.com/JSeAHdG.gif")
                        .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                    message.channel.stopTyping()
                    message.channel.send(errorEmbed)
                }
            })
            .catch(e => {
                if (e instanceof fetch.FetchError) {
                    console.error("slothpixel is down, sending error.")
                    throw "apiError"
                } else throw e
            })
    },
    async updateRoles(member, json) {
        let role = null
        await member.roles.remove(["808032608456802337", "808032624215457823", "808032640631832637", "808032657505255424", "808032672160153641", "808032689709514852", "551758392339857418", "551758392021090304", "624880339722174464", "715674953697198141"], "Unverified") //VIP, VIP+, MVP, MVP+, MVP++, YouTuber, Hypixel Helper, Hypixel Mod, Hypixel Admin and Hypixel Staff
        if (!json) return
        if (json.rank) {
            switch (json.rank) {
                case "ADMIN":
                    await member.roles.add(["624880339722174464", "715674953697198141"], `Successfully verified as ${json.username}`) //Hypixel Admin and Hypixel Staff
                    role = member.roles.cache.get("624880339722174464")
                    break
                case "MODERATOR":
                    await member.roles.add(["551758392021090304", "715674953697198141"], `Successfully verified as ${json.username}`) //Hypixel Moderator and Hypixel Staff
                    role = member.roles.cache.get("551758392021090304")
                    break
                case "HELPER":
                    await member.roles.add(["551758392339857418", "715674953697198141"], `Successfully verified as ${json.username}`) //Hypixel Helper and Hypixel Staff
                    role = member.roles.cache.get("551758392339857418")
                    break
                case "YOUTUBER":
                    await member.roles.add("808032689709514852", `Successfully verified as ${json.username}`) //YouTuber
                    role = member.roles.cache.get("808032689709514852")
                    break
                case "MVP_PLUS_PLUS":
                    await member.roles.add("808032672160153641", `Successfully verified as ${json.username}`) //MVP++
                    role = member.roles.cache.get("808032672160153641")
                    break
                case "MVP_PLUS":
                    await member.roles.add("808032657505255424", `Successfully verified as ${json.username}`) //MVP+
                    role = member.roles.cache.get("808032657505255424")
                    break
                case "MVP":
                    await member.roles.add("808032640631832637", `Successfully verified as ${json.username}`) //MVP
                    role = member.roles.cache.get("808032640631832637")
                    break
                case "VIP_PLUS":
                    await member.roles.add("808032624215457823", `Successfully verified as ${json.username}`) //VIP+
                    role = member.roles.cache.get("808032624215457823")
                    break
                case "VIP":
                    await member.roles.add("808032608456802337", `Successfully verified as ${json.username}`) //VIP
                    role = member.roles.cache.get("808032608456802337")
                    break
            }
        }
        return role
    }
}