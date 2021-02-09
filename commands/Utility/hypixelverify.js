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
    channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058", "749391414600925335"], //bots staff-bots bot-dev bot-translators
    async execute(message, strings, args) {
        const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)

        const command = message.content.slice(prefix.length).split(" ")[0].toLowerCase()
        if (command === "hypixelunverify" || command === "hunverify") {
            await this.updateRoles(message)
            await getDb().collection("users").updateOne({ id: message.author.id }, { $set: { uuid: "" } }).then(async r => {
                if (r.result.nModified) {
                    const embed = new Discord.MessageEmbed()
                        .setColor(successColor)
                        .setAuthor(strings.moduleName)
                        .setTitle(strings.unverified)
                        .setFooter(executedBy, message.author.displayAvatarURL())
                    message.channel.send(embed)
                } else {
                    const embed = new Discord.MessageEmbed()
                        .setColor(errorColor)
                        .setAuthor(strings.moduleName)
                        .setTitle(strings.notUnverified)
                        .setDescription(strings.whyNotUnverified)
                        .setFooter(executedBy, message.author.displayAvatarURL())
                    message.channel.send(embed)
                }
            })
            return
        }
        if (!args[0]) throw "noUser"

        message.channel.startTyping()
        // make a response to the slothpixel api (hypixel api but we dont need an api key)
        await fetch(`https://api.slothpixel.me/api/players/${args[0]}`, { method: "Get" })
            .then(res => (res.json())) // get the response json
            .then(async json => { // here we do stuff with the json

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
                        const role = await this.updateRoles(message, json)
                        if (r.result.nModified) {
                            const successEmbed = new Discord.MessageEmbed()
                                .setColor(successColor)
                                .setAuthor(strings.moduleName)
                                .setTitle(strings.success.replace("%%player%%", json.username))
                                .setFooter(executedBy, message.author.displayAvatarURL())
                            if (role) successEmbed.setDescription(strings.role.replace("%%role%%", role))
                            else successEmbed.setDescription(strings.noRoles)
                            message.channel.stopTyping()
                            return message.channel.send(successEmbed)
                        } else {
                            const notChanged = new Discord.MessageEmbed()
                                .setColor(errorColor)
                                .setAuthor(strings.moduleName)
                                .setTitle(strings.alreadyVerified)
                                .setDescription(strings.nameChangeDisclaimer)
                                .setFooter(executedBy, message.author.displayAvatarURL())
                            message.channel.stopTyping()
                            return message.channel.send(notChanged)
                        }
                    })
                } else {
                    const errorEmbed = new Discord.MessageEmbed()
                        .setColor(errorColor)
                        .setAuthor(strings.moduleName)
                        .setTitle(strings.error)
                        .setDescription(strings.tutorial.replace("%%tag%%", message.author.tag))
                        .setImage("https://i.imgur.com/JSeAHdG.gif")
                        .setFooter(executedBy, message.author.displayAvatarURL())
                    message.channel.stopTyping()
                    message.channel.send(errorEmbed)
                }
            })
    },
    async updateRoles(message, json) {
        let role = null
        await message.member.roles.remove(["808032608456802337", "808032624215457823", "808032640631832637", "808032657505255424", "808032672160153641", "808032689709514852", "551758392339857418", "551758392021090304", "624880339722174464", "715674953697198141"], "Unverified") //VIP, VIP+, MVP, MVP+, MVP++, YouTuber, Hypixel Helper, Hypixel Mod, Hypixel Admin and Hypixel Staff
        if (!json) return
        if (json.rank) {
            switch (json.rank) {
                case "ADMIN":
                    await message.member.roles.add(["624880339722174464", "715674953697198141"], `Successfully verified as ${json.username}`) //Hypixel Admin and Hypixel Staff
                    role = message.guild.roles.cache.get("624880339722174464")
                    break
                case "MODERATOR":
                    await message.member.roles.add(["551758392021090304", "715674953697198141"], `Successfully verified as ${json.username}`) //Hypixel Moderator and Hypixel Staff
                    role = message.guild.roles.cache.get("551758392021090304")
                    break
                case "HELPER":
                    await message.member.roles.add(["551758392339857418", "715674953697198141"], `Successfully verified as ${json.username}`) //Hypixel Helper and Hypixel Staff
                    role = message.guild.roles.cache.get("551758392339857418")
                    break
                case "YOUTUBER":
                    await message.member.roles.add("808032689709514852", `Successfully verified as ${json.username}`) //YouTuber
                    role = message.guild.roles.cache.get("808032689709514852")
                    break
                case "MVP_PLUS_PLUS":
                    await message.member.roles.add("808032672160153641", `Successfully verified as ${json.username}`) //MVP++
                    role = message.guild.roles.cache.get("808032672160153641")
                    break
                case "MVP_PLUS":
                    await message.member.roles.add("808032657505255424", `Successfully verified as ${json.username}`) //MVP+
                    role = message.guild.roles.cache.get("808032657505255424")
                    break
                case "MVP":
                    await message.member.roles.add("808032640631832637", `Successfully verified as ${json.username}`) //MVP
                    role = message.guild.roles.cache.get("808032640631832637")
                    break
                case "VIP_PLUS":
                    await message.member.roles.add("808032624215457823", `Successfully verified as ${json.username}`) //VIP+
                    role = message.guild.roles.cache.get("808032624215457823")
                    break
                case "VIP":
                    await message.member.roles.add("808032608456802337", `Successfully verified as ${json.username}`) //VIP
                    role = message.guild.roles.cache.get("808032608456802337")
                    break
            }
        }
        return role
    }
}