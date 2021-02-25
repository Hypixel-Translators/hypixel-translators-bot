const { getDb } = require("../../lib/mongodb")
const { prefix } = require("../../config.json")

module.exports = {
    name: "verify",
    description: "Verifies the user.",
    usage: "+verify <user> <project> <language> <role> <profileURL> | +unverify <user>",
    aliases: ["unverify"],
    allowTip: false,
    roleBlacklist: ["569194996964786178"], //Verified
    channelWhitelist: ["569178590697095168"], // verify
    async execute(message, args) {
        await message.delete()
        if (!message.member.roles.cache.has("764442984119795732")) {
            if (!args[0]) {
                message.channel.messages.fetch()
                    .then(messages => {
                        const fiMessages = messages.filter(msgs => msgs.author === message.author)
                        message.channel.bulkDelete(fiMessages)
                    })
                await message.member.roles.add("569194996964786178", "Manually verified through the command").then(async () => await message.member.roles.remove("756199836470214848", "Manually verified through the command")) //Add Verified and remove Alerted
                message.guild.channels.cache.get("662660931838410754").send(`${message.author} manually verified themselves through the command`) //verify-logs
            } else {
                message.channel.send(`${message.author} please run \`+verify\` with no aditional arguments in order to be verified. If you wish to be verified as a translator, please paste the link to your Crowdin profile on this channel.`)
                    .then(msg => {
                        setTimeout(() => {
                            if (!msg.deleted) msg.delete()
                        }, 10000)
                    })
            }
        } else {
            const userId = args[0].replace(/[\\<>@#&!]/g, "")
            const member = message.guild.members.cache.find(m => m.id === userId || m.user.tag === args[0])
            if (!member) throw "falseUser"
            const command = message.content.slice(prefix.length).split(" ")[0].toLowerCase()
            if (command === "unverify") {
                const userDb = await getDb().collection("users").findOne({ id: member.id })
                member.roles.remove("569194996964786178", "Unverified")
                if (userDb.profile) message.client.channels.cache.get("551693960913879071").send(`${message.author}, ${member}'s profile is ${userDb.profile}`)
                return message.channel.send(`${member} has been unverified!`)
                    .then(msg => {
                        setTimeout(() => {
                            if (!msg.deleted) msg.delete()
                        }, 5000)
                    })
            }
            if (!args[3]) throw "noRole"
            const langdb = await getDb().collection("langdb").find().toArray()
            const collection = getDb().collection("users")
            const project = args[1].toLowerCase()
            if (project === "hp" || project === "hypixel") await hypixel(message, member, args, langdb, collection)
            else if (project === "qp" || project === "quickplay") await quickplay(message, member, args, langdb, collection)
            else if (project === "sba" || project === "skyblockaddons") await sba(message, member, args, collection)
            else if (project === "bot") await bot(message, member, args, collection)
            else throw "noRole"
            message.channel.messages.fetch()
                .then(messages => {
                    const authorMessages = messages.filter(msgs => msgs.author === message.author)
                    message.channel.bulkDelete(authorMessages)
                    const userMessages = messages.filter(msgs => msgs.author.id === userId)
                    message.channel.bulkDelete(userMessages)
                })
        }
    }
}

async function hypixel(message, member, args, langdb, collection) {
    if (!args[4] || !/(https:\/\/)?(www\.)?crowdin\.com\/profile\/\S{1,}/gi.test(args[4])) throw "wrongLink"
    const lang = langdb.find(l => l.name.toLowerCase() === args[2].toLowerCase() || l.code === args[2])
    if (!lang) throw "falseLang"
    let role
    if (args[3].toLowerCase() === "tr" || args[3].toLowerCase() === "translator") role = "Translator"
    else if (args[3].toLowerCase() === "pf" || args[3].toLowerCase() === "pr" || args[3].toLowerCase() === "proofreader") role = "Proofreader"
    else throw "falseRole"
    const langRole = await message.guild.roles.cache.find(r => r.name === `${lang.name} ${role}`)
    const projectRole = await message.guild.roles.cache.find(r => r.name === `Hypixel ${role}`)
    await member.roles.remove("756199836470214848", "Verified") //Alerted
    await member.roles.add(["569194996964786178", langRole.id, projectRole.id], "Verified") //Verified
    await collection.updateOne({ id: member.user.id }, { $set: { profile: args[4] } })
    message.client.channels.cache.get("662660931838410754").send(`${member} was verified as a ${lang.name} ${projectRole.name} by ${message.author.tag}! Here's their Crowdin profile: ${args[4]}`)
}

async function quickplay(message, member, args, langdb, collection) {
    if (!args[4] || !/(https:\/\/)?(www\.)?crowdin\.com\/profile\/\S{1,}/gi.test(args[4])) throw "wrongLink"
    const lang = langdb.find(l => l.name.toLowerCase() === args[2].toLowerCase() || l.code === args[2])
    if (!lang) throw "falseLang"
    let role
    if (args[3].toLowerCase() === "tr" || args[3].toLowerCase() === "translator") role = "Translator"
    else if (args[3].toLowerCase() === "pf" || args[3].toLowerCase() === "pr" || args[3].toLowerCase() === "proofreader") role = "Proofreader"
    else throw "falseRole"
    const langRole = await message.guild.roles.cache.find(r => r.name === `${lang.name} ${role}`)
    const projectRole = await message.guild.roles.cache.find(r => r.name === `Quickplay ${role}`)
    await member.roles.remove("756199836470214848", "Verified") //Alerted
    await member.roles.add(["569194996964786178", langRole.id, projectRole.id], "Verified") //Verified
    await collection.updateOne({ id: member.user.id }, { $set: { profile: args[4] } })
    message.client.channels.cache.get("662660931838410754").send(`${member} was verified as a ${lang.name} ${projectRole.name} by ${message.author.tag}! Here's their Crowdin profile: ${args[4]}`)
}

async function sba(message, member, args, collection) {
    if (!args[3] || !/(https:\/\/)?(www\.)?crowdin\.com\/profile\/\S{1,}/gi.test(args[3])) throw "wrongLink"
    let role
    if (args[2].toLowerCase() === "tr" || args[2].toLowerCase() === "translator") role = "Translator"
    else if (args[2].toLowerCase() === "pf" || args[2].toLowerCase() === "pr" || args[2].toLowerCase() === "proofreader") role = "Proofreader"
    else throw "falseRole"
    const projectRole = await message.guild.roles.cache.find(r => r.name === `SkyblockAddons ${role}`)
    await member.roles.remove("756199836470214848", "Verified") //Alerted
    await member.roles.add(["569194996964786178", projectRole.id], "Verified") //Verified
    await collection.updateOne({ id: member.user.id }, { $set: { profile: args[3] } })
    message.client.channels.cache.get("662660931838410754").send(`${member} was verified as a ${projectRole.name} by ${message.author.tag}! Here's their Crowdin profile: ${args[3]}`)
}

async function bot(message, member, args, collection) {
    if (!args[3] || !/(https:\/\/)?(www\.)?crowdin\.com\/profile\/\S{1,}/gi.test(args[3])) throw "wrongLink"
    let role
    if (args[2].toLowerCase() === "tr" || args[2].toLowerCase() === "translator") role = "Translator"
    else if (args[2].toLowerCase() === "pf" || args[2].toLowerCase() === "pr" || args[2].toLowerCase() === "proofreader") role = "Proofreader"
    else throw "falseRole"
    const projectRole = await message.guild.roles.cache.find(r => r.name === `Bot ${role}`)
    await member.roles.remove("756199836470214848", "Verified") //Alerted
    await member.roles.add(["569194996964786178", projectRole.id], "Verified") //Verified
    await collection.updateOne({ id: member.user.id }, { $set: { profile: args[3] } })
    message.client.channels.cache.get("662660931838410754").send(`${member} was verified as a ${projectRole.name} by ${message.author.tag}! Here's their Crowdin profile: ${args[3]}`)
}
