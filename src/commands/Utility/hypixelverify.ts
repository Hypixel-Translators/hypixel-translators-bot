import Discord from "discord.js"
import { successColor, errorColor } from "../../config.json"
import fetch, { FetchError } from "node-fetch"
import { db } from "../../lib/dbclient"
import { getUUID } from "./minecraft"
import { Command, GetStringFunction } from "../../index"

const command: Command = {
    name: "hypixelverify",
    description: "Links your Discord account with your Hypixel player",
    options: [{
        type: "STRING",
        name: "username",
        description: "Your Hypixel IGN. Must have your Discord linked in-game",
        required: true
    }],
    cooldown: 60,
    channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058"], // bots staff-bots bot-dev 
    async execute(interaction: Discord.CommandInteraction, getString: GetStringFunction) {
        const executedBy = getString("executedBy", { user: interaction.user.tag }, "global") as string,
            uuid = await getUUID(interaction.options.get("username")!.value as string)
        if (!uuid) throw "noUser"

        await interaction.defer()
        // make a response to the slothpixel api (hypixel api but we dont need an api key)
        await fetch(`https://api.slothpixel.me/api/players/${uuid}`, { headers: { "User-Agent": "Hypixel Translators Bot" }, method: "Get", timeout: 30_000 })
            .then(res => res.json()) // get the response json
            .then(async json => { // here we do stuff with the json

                // Handle errors
                if (json.error === "Player does not exist" || json.error === "Invalid username or UUID!") throw "falseUser"
                else if (json.error !== undefined || json.username === null) { // if other error we didn't plan for appeared
                    if (json.error === undefined && json.username === null) throw "noPlayer"
                    console.log("Welp, we didn't plan for this to happen. While you have a mental breakdown, enjoy this little error I have for you\n", json.error)
                    throw "apiError"
                }
                if (json.links?.DISCORD === interaction.user.tag) {
                    await db.collection("users").updateOne({ id: interaction.user.id }, { $set: { uuid: json.uuid } }).then(async r => {
                        const role = await updateRoles(interaction.member as Discord.GuildMember, json) as Discord.Role
                        if (r.result.nModified) {
                            const successEmbed = new Discord.MessageEmbed()
                                .setColor(successColor as Discord.HexColorString)
                                .setAuthor(getString("moduleName"))
                                .setTitle(getString("success", { player: json.username }))
                                .setDescription(getString("role", { role: role.toString() }))
                                .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                            return await interaction.editReply({ embeds: [successEmbed] })
                        } else {
                            const notChanged = new Discord.MessageEmbed()
                                .setColor(errorColor as Discord.HexColorString)
                                .setAuthor(getString("moduleName"))
                                .setTitle(getString("alreadyVerified"))
                                .setDescription(getString("nameChangeDisclaimer"))
                                .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                            return await interaction.editReply({ embeds: [notChanged] })
                        }
                    })
                } else {
                    const errorEmbed = new Discord.MessageEmbed()
                        .setColor(errorColor as Discord.HexColorString)
                        .setAuthor(getString("moduleName"))
                        .setTitle(getString("error"))
                        .setDescription(getString("tutorial", { tag: interaction.user.tag }))
                        .setImage("https://i.imgur.com/JSeAHdG.gif")
                        .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                    await interaction.editReply({ embeds: [errorEmbed] })
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
    const roles: Discord.Snowflake[] = [
        "816435344689987585", //Unranked
        "808032608456802337", //VIP
        "808032624215457823", //VIP+
        "808032640631832637", //MVP
        "808032657505255424", //MVP+
        "808032672160153641", //MVP++
        "808032689709514852", //YouTuber
        "551758392339857418", //Hypixel Helper
        "551758392021090304", //Hypixel Mod
        "822787676482699297", //Hypixel Game Master
        "624880339722174464", //Hypixel Admin
        "715674953697198141"  //Hypixel Staff
    ]
    if (!json) return await member.roles.remove(roles, "Unverified")
    let role: Discord.Role, rolesToGive: Discord.Snowflake[] = []
    switch (json.rank) {
        case "ADMIN":
            rolesToGive = ["624880339722174464", "715674953697198141"] // Hypixel Admin and Hypixel Staff
            member.roles.cache.forEach(r => { if (rolesToGive.includes(r.id)) rolesToGive.splice(rolesToGive.indexOf(r.id), 1) })
            roles.splice(roles.indexOf("624880339722174464"), 1) // Hypixel Admin
            roles.splice(roles.indexOf("715674953697198141"), 1) // Hypixel Staff
            await member.roles.remove(roles, "Updated roles")
            await member.roles.add(rolesToGive, `Successfully verified as ${json.username}`)
            role = member.guild.roles.cache.get("624880339722174464")!
            break
        case "GAME_MASTER":
            rolesToGive = ["822787676482699297", "715674953697198141"] // Hypixel Game Master and Hypixel Staff
            member.roles.cache.forEach(r => { if (rolesToGive.includes(r.id)) rolesToGive.splice(rolesToGive.indexOf(r.id), 1) })
            roles.splice(roles.indexOf("822787676482699297"), 1) // Hypixel Game Master
            roles.splice(roles.indexOf("715674953697198141"), 1) // Hypixel Staff
            await member.roles.remove(roles, "Updated roles")
            await member.roles.add(rolesToGive, `Successfully verified as ${json.username}`)
        case "MODERATOR":
            rolesToGive = ["551758392021090304", "715674953697198141"] // Hypixel Mod and Hypixel Staff
            member.roles.cache.forEach(r => { if (rolesToGive.includes(r.id)) rolesToGive.splice(rolesToGive.indexOf(r.id), 1) })
            roles.splice(roles.indexOf("551758392021090304"), 1) // Hypixel Moderator
            roles.splice(roles.indexOf("715674953697198141"), 1) // Hypixel Staff
            await member.roles.remove(roles, "Updated roles")
            await member.roles.add(rolesToGive, `Successfully verified as ${json.username}`)
            role = member.guild.roles.cache.get("551758392021090304")!
            break
        case "HELPER":
            rolesToGive = ["551758392339857418", "715674953697198141"] // Hypixel Helper and Hypixel Staff
            member.roles.cache.forEach(r => { if (rolesToGive.includes(r.id)) rolesToGive.splice(rolesToGive.indexOf(r.id), 1) })
            roles.splice(roles.indexOf("551758392339857418"), 1) // Hypixel Helper
            roles.splice(roles.indexOf("715674953697198141"), 1) // Hypixel Staff
            await member.roles.remove(roles, "Updated roles")
            await member.roles.add(rolesToGive, `Successfully verified as ${json.username}`)
            role = member.guild.roles.cache.get("551758392339857418")!
            break
        case "YOUTUBER":
            rolesToGive = ["808032689709514852"] // YouTuber
            member.roles.cache.forEach(r => { if (rolesToGive.includes(r.id)) rolesToGive.splice(rolesToGive.indexOf(r.id), 1) })
            roles.splice(roles.indexOf("808032689709514852"), 1) // YouTuber
            await member.roles.remove(roles, "Updated roles")
            await member.roles.add(rolesToGive, `Successfully verified as ${json.username}`)
            role = member.guild.roles.cache.get("808032689709514852")!
            break
        case "MVP_PLUS_PLUS":
            rolesToGive = ["808032672160153641"] // MVP++
            member.roles.cache.forEach(r => { if (rolesToGive.includes(r.id)) rolesToGive.splice(rolesToGive.indexOf(r.id), 1) })
            roles.splice(roles.indexOf("808032672160153641"), 1) // MVP++
            await member.roles.remove(roles, "Updated roles")
            await member.roles.add(rolesToGive, `Successfully verified as ${json.username}`)
            role = member.guild.roles.cache.get("808032672160153641")!
            break
        case "MVP_PLUS":
            rolesToGive = ["808032657505255424"] // MVP+
            member.roles.cache.forEach(r => { if (rolesToGive.includes(r.id)) rolesToGive.splice(rolesToGive.indexOf(r.id), 1) })
            roles.splice(roles.indexOf("808032657505255424"), 1) // MVP+
            await member.roles.remove(roles, "Updated roles")
            await member.roles.add(rolesToGive, `Successfully verified as ${json.username}`)
            role = member.guild.roles.cache.get("808032657505255424")!
            break
        case "MVP":
            rolesToGive = ["808032640631832637"] // MVP
            member.roles.cache.forEach(r => { if (rolesToGive.includes(r.id)) rolesToGive.splice(rolesToGive.indexOf(r.id), 1) })
            roles.splice(roles.indexOf("808032640631832637"), 1) // MVP
            await member.roles.remove(roles, "Updated roles")
            await member.roles.add(rolesToGive, `Successfully verified as ${json.username}`)
            role = member.guild.roles.cache.get("808032640631832637")!
            break
        case "VIP_PLUS":
            rolesToGive = ["808032624215457823"] // VIP+
            member.roles.cache.forEach(r => { if (rolesToGive.includes(r.id)) rolesToGive.splice(rolesToGive.indexOf(r.id), 1) })
            roles.splice(roles.indexOf("808032624215457823"), 1) // VIP+
            await member.roles.remove(roles, "Updated roles")
            await member.roles.add(rolesToGive, `Successfully verified as ${json.username}`)
            role = member.guild.roles.cache.get("808032624215457823")!
            break
        case "VIP":
            rolesToGive = ["808032608456802337"] // VIP
            member.roles.cache.forEach(r => { if (rolesToGive.includes(r.id)) rolesToGive.splice(rolesToGive.indexOf(r.id), 1) })
            roles.splice(roles.indexOf("808032608456802337"), 1) // VIP
            await member.roles.remove(roles, "Updated roles")
            await member.roles.add(rolesToGive, `Successfully verified as ${json.username}`)
            role = member.guild.roles.cache.get("808032608456802337")!
            break
        default:
            rolesToGive = ["816435344689987585"] // Unranked
            member.roles.cache.forEach(r => { if (rolesToGive.includes(r.id)) rolesToGive.splice(rolesToGive.indexOf(r.id), 1) })
            roles.splice(roles.indexOf("816435344689987585"), 1) // Unranked
            await member.roles.remove(roles, "Updated roles")
            await member.roles.add("816435344689987585", `Successfully verified as ${json.username}`)
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