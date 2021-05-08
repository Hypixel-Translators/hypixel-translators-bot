import Discord from "discord.js"
import { prefix, successColor, errorColor } from "../../config.json"
import fetch, { FetchError } from "node-fetch"
import { db } from "../../lib/dbclient"
import { getPlayer } from "./hypixelstats"
import { Command, client } from "../../index"

const command: Command = {
    name: "hypixelverify",
    description: "Links your Discord account with your Hypixel player",
    usage: "+hypixelverify <username>",
    aliases: ["hverify", "hypixellink", "hlink", "hypixelunverify", "hunverify"],
    cooldown: 60,
    channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058"], // bots staff-bots bot-dev 
    async execute(interaction: Discord.CommandInteraction, args: string[], getString: (path: string, variables?: { [key: string]: string | number } | string, cmd?: string, lang?: string) => any) {
        const executedBy = getString("executedBy", { user: interaction.user.tag }, "global")

        const command = interaction.content.slice(prefix.length).split(" ")[0].toLowerCase()
        if (command === "hypixelunverify" || command === "hunverify") {
            await updateRoles(interaction.member!)
            await db.collection("users").updateOne({ id: interaction.user.id }, { $unset: { uuid: true } }).then(async r => {
                if (r.result.nModified) {
                    const embed = new Discord.MessageEmbed()
                        .setColor(successColor)
                        .setAuthor(getString("moduleName"))
                        .setTitle(getString("unverified"))
                        .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                    return interaction.reply(embed)
                } else {
                    const embed = new Discord.MessageEmbed()
                        .setColor(errorColor)
                        .setAuthor(getString("moduleName"))
                        .setTitle(getString("notUnverified"))
                        .setDescription(getString("whyNotUnverified"))
                        .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                    return interaction.reply(embed)
                }
            })
            client.cooldowns.get(this.name)!.delete(interaction.user.id)
            return
        }
        const uuid = await getPlayer(args[0])
        if (!uuid) throw "noUser"

        // make a response to the slothpixel api (hypixel api but we dont need an api key)
        await fetch(`https://api.slothpixel.me/api/players/${uuid}`, { headers: { "User-Agent": "Hypixel Translators Bot" }, method: "Get", timeout: 50000 })
            .then(res => (res.json())) // get the response json
            .then(async json => { // here we do stuff with the json

                // Handle errors
                if (json.error === "Player does not exist" || json.error === "Invalid username or UUID!") throw "falseUser"
                else if (json.error !== undefined || json.username === null) { // if other error we didn't plan for appeared
                    let error
                    if (json.error === undefined && json.username === null) throw "noPlayer"
                    else if (json.error !== undefined) error = json.error
                    console.log("Welp, we didn't plan for this to happen. While you have a mental breakdown, enjoy this little error I have for you\n" + error)
                    throw "apiError"
                }
                if (json.links?.DISCORD === interaction.user.tag) {
                    await db.collection("users").updateOne({ id: interaction.user.id }, { $set: { uuid: json.uuid } }).then(async r => {
                        const role = await updateRoles(interaction.member!, json) as Discord.Role
                        if (r.result.nModified) {
                            const successEmbed = new Discord.MessageEmbed()
                                .setColor(successColor)
                                .setAuthor(getString("moduleName"))
                                .setTitle(getString("success", { player: json.username }))
                                .setDescription(getString("role", { role: String(role) }))
                                .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                            return interaction.reply(successEmbed)
                        } else {
                            const notChanged = new Discord.MessageEmbed()
                                .setColor(errorColor)
                                .setAuthor(getString("moduleName"))
                                .setTitle(getString("alreadyVerified"))
                                .setDescription(getString("nameChangeDisclaimer"))
                                .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                            return interaction.reply(notChanged)
                        }
                    })
                } else {
                    const errorEmbed = new Discord.MessageEmbed()
                        .setColor(errorColor)
                        .setAuthor(getString("moduleName"))
                        .setTitle(getString("error"))
                        .setDescription(getString("tutorial", { tag: interaction.user.tag }))
                        .setImage("https://i.imgur.com/JSeAHdG.gif")
                        .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                    interaction.reply(errorEmbed)
                }
            })
            .catch(e => {
                if (e instanceof FetchError) {
                    console.error("slothpixel is down, sending error.")
                    throw "apiError"
                } else throw e
            })
    },
}

export async function updateRoles(member: Discord.GuildMember, json?: JsonResponse) {
    const roles = ["816435344689987585", "808032608456802337", "808032624215457823", "808032640631832637", "808032657505255424", "808032672160153641", "808032689709514852", "551758392339857418", "551758392021090304", "822787676482699297", "624880339722174464", "715674953697198141"] // Unranked, VIP, VIP+, MVP, MVP+, MVP++, YouTuber, Hypixel Helper, Hypixel Mod, Hypixel Game Master, Hypixel Admin and Hypixel Staff
    if (!json) return await member.roles.remove(roles, "Unverified") // Unranked, VIP, VIP+, MVP, MVP+, MVP++, YouTuber, Hypixel Helper, Hypixel Mod, Hypixel Game Master, Hypixel Admin and Hypixel Staff
    let role: Discord.Role
    switch (json.rank) {
        case "ADMIN":
            roles.splice(roles.indexOf("624880339722174464"), 1) // Hypixel Admin
            roles.splice(roles.indexOf("715674953697198141"), 1) // Hypixel Staff
            await member.roles.remove(roles, "Updated roles") // Unranked, VIP, VIP+, MVP, MVP+, MVP++, YouTuber, Hypixel Helper, Hypixel Mod and Hypixel Game Master
            await member.roles.add(["624880339722174464", "715674953697198141"], `Successfully verified as ${json.username}`) // Hypixel Admin and Hypixel Staff
            role = member.guild.roles.cache.get("624880339722174464")!
            break
        case "GAME_MASTER":
            roles.splice(roles.indexOf("822787676482699297"), 1) // Hypixel Game Master
            roles.splice(roles.indexOf("715674953697198141"), 1) // Hypixel Staff
            await member.roles.remove(roles, "Updated roles") // Unranked, VIP, VIP+, MVP, MVP+, MVP++, YouTuber, Hypixel Helper, Hypixel Mod and Hypixel Admin
            await member.roles.add(["822787676482699297", "715674953697198141"], `Successfully verified as ${json.username}`) // Hypixel Game Master and Hypixel Staff
        case "MODERATOR":
            roles.splice(roles.indexOf("551758392021090304"), 1) // Hypixel Moderator
            roles.splice(roles.indexOf("715674953697198141"), 1) // Hypixel Staff
            await member.roles.remove(roles, "Updated roles") // Unranked, VIP, VIP+, MVP, MVP+, MVP++, YouTuber, Hypixel Helper, Hypixel Game Master and Hypixel Admin
            await member.roles.add(["551758392021090304", "715674953697198141"], `Successfully verified as ${json.username}`) // Hypixel Mod and Hypixel Staff
            role = member.guild.roles.cache.get("551758392021090304")!
            break
        case "HELPER":
            roles.splice(roles.indexOf("551758392339857418"), 1) // Hypixel Helper
            roles.splice(roles.indexOf("715674953697198141"), 1) // Hypixel Staff
            await member.roles.remove(roles, "Updated roles") // Unranked, VIP, VIP+, MVP, MVP+, MVP++, YouTuber, Hypixel Mod, Hypixel Game Master and Hypixel Admin
            await member.roles.add(["551758392339857418", "715674953697198141"], `Successfully verified as ${json.username}`) // Hypixel Helper and Hypixel Staff
            role = member.guild.roles.cache.get("551758392339857418")!
            break
        case "YOUTUBER":
            roles.splice(roles.indexOf("808032689709514852"), 1) // YouTuber
            await member.roles.remove(roles, "Updated roles") // Unranked, VIP, VIP+, MVP, MVP+, MVP++, Hypixel Helper, Hypixel Mod, Hypixel Game Master, Hypixel Admin and Hypixel Staff
            await member.roles.add("808032689709514852", `Successfully verified as ${json.username}`) // YouTuber
            role = member.guild.roles.cache.get("808032689709514852")!
            break
        case "MVP_PLUS_PLUS":
            roles.splice(roles.indexOf("808032672160153641"), 1) // MVP++
            await member.roles.remove(roles, "Updated roles") // Unranked, VIP, VIP+, MVP, MVP+, YouTuber, Hypixel Helper, Hypixel Mod, Hypixel Game Master, Hypixel Admin and Hypixel Staff
            await member.roles.add("808032672160153641", `Successfully verified as ${json.username}`) // MVP++
            role = member.guild.roles.cache.get("808032672160153641")!
            break
        case "MVP_PLUS":
            roles.splice(roles.indexOf("808032657505255424"), 1) // MVP+
            await member.roles.remove(roles, "Updated roles") // Unranked, VIP, VIP+, MVP, MVP++, YouTuber, Hypixel Helper, Hypixel Mod, Hypixel Game Master, Hypixel Admin and Hypixel Staff
            await member.roles.add("808032657505255424", `Successfully verified as ${json.username}`) // MVP+
            role = member.guild.roles.cache.get("808032657505255424")!
            break
        case "MVP":
            roles.splice(roles.indexOf("808032640631832637"), 1) // MVP
            await member.roles.remove(roles, "Updated roles") // Unranked, VIP, VIP+, MVP+, MVP++, YouTuber, Hypixel Helper, Hypixel Mod, Hypixel Game Master, Hypixel Admin and Hypixel Staff
            await member.roles.add("808032640631832637", `Successfully verified as ${json.username}`) // MVP
            role = member.guild.roles.cache.get("808032640631832637")!
            break
        case "VIP_PLUS":
            roles.splice(roles.indexOf("808032624215457823"), 1) // VIP+
            await member.roles.remove(roles, "Updated roles") // Unranked, VIP, MVP, MVP+, MVP++, YouTuber, Hypixel Helper, Hypixel Mod, Hypixel Game Master, Hypixel Admin and Hypixel Staff
            await member.roles.add("808032624215457823", `Successfully verified as ${json.username}`) // VIP+
            role = member.guild.roles.cache.get("808032624215457823")!
            break
        case "VIP":
            roles.splice(roles.indexOf("808032608456802337"), 1) // VIP
            await member.roles.remove(roles, "Updated roles") // Unranked, VIP+, MVP, MVP+, MVP++, YouTuber, Hypixel Helper, Hypixel Mod, Hypixel Game Master, Hypixel Admin and Hypixel Staff
            await member.roles.add("808032608456802337", `Successfully verified as ${json.username}`) // VIP
            role = member.guild.roles.cache.get("808032608456802337")!
            break
        default:
            roles.splice(roles.indexOf("816435344689987585"), 1) // Unranked
            await member.roles.remove(roles, "Updated roles") // VIP, VIP+, MVP, MVP+, MVP++, YouTuber, Hypixel Helper, Hypixel Mod, Hypixel Game Master, Hypixel Admin and Hypixel Staff
            await member.roles.add("816435344689987585", `Successfully verified as ${json.username}`) // Unranked
            role = member.guild.roles.cache.get("816435344689987585")!
            break
    }
    return role
}

export default command

interface JsonResponse { // Just declaring the variables we need
    username: string,
    rank: string
}