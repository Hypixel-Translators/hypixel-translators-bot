const { getDb } = require("../../lib/mongodb")

module.exports = {
    name: "update",
    description: "Updates the user's roles to proofreader.",
    usage: "+update <user> <project> <language> <profileURL>",
    allowTip: false,
    roleWhitelist: ["764442984119795732"], //Discord Administrator
    channelWhitelist: ["569178590697095168"], // verify
    async execute(message, args) {
        await message.delete()
        if (!args[2]) return
        const userId = args[0].replace(/[\\<>@#&!]/g, "")
        const member = message.guild.members.cache.find(m => m.id === userId)
        const langdb = await getDb().collection("langdb").find().toArray()
        const project = args[1].toLowerCase()
        if (project === "hp" || project === "hypixel") await hypixel(message, member, args, langdb)
        else if (project === "qp" || project === "quickplay") await quickplay(message, member, args, langdb)
        else if (project === "sba" || project === "skyblockaddons") await sba(message, member, args)
        else if (project === "bot") await bot(message, member, args)
        else throw "falseRole"
        message.channel.messages.fetch()
            .then(messages => {
                const authorMessages = messages.filter(msgs => msgs.author === message.author)
                message.channel.bulkDelete(authorMessages)
                const userMessages = messages.filter(msgs => msgs.author.id === userId)
                message.channel.bulkDelete(userMessages)
            })
    }
}

async function hypixel(message, member, args, langdb) {
    if (!args[3]) return
    if (!/(https:\/\/)?(www\.)?crowdin\.com\/profile\/\S{1,}/gi.test(args[3])) return
    const lang = langdb.find(l => l.name.toLowerCase() === args[2].toLowerCase() || l.code === args[2])
    if (!lang) throw "falseLang"
    const oldLangRole = await message.guild.roles.cache.find(r => r.name === `${lang.name} Translator`)
    const newLangRole = await message.guild.roles.cache.find(r => r.name === `${lang.name} Proofreader`)
    const oldProjectRole = await message.guild.roles.cache.find(r => r.name === `Hypixel Translator`)
    const newProjectRole = await message.guild.roles.cache.find(r => r.name === `Hypixel Proofreader`)
    await member.roles.remove([oldLangRole.id, oldProjectRole.id], "Verified")
    await member.roles.add(["569194996964786178", newLangRole.id, newProjectRole.id], "Verified") //Verified
    await getDb().collection("users").updateOne({ id: member.user.id }, { $set: { profile: args[3] } })
    message.client.channels.cache.get("662660931838410754").send(`${member}'s role was updated to ${lang.name} ${newProjectRole.name} by ${message.author.tag}! Here's their Crowdin profile: ${args[3]}`)
}

async function quickplay(message, member, args, langdb) {
    if (!args[3]) return
    if (!/(https:\/\/)?(www\.)?crowdin\.com\/profile\/\S{1,}/gi.test(args[3])) return
    const lang = langdb.find(l => l.name.toLowerCase() === args[2].toLowerCase() || l.code === args[2])
    if (!lang) throw "falseLang"
    const oldLangRole = await message.guild.roles.cache.find(r => r.name === `${lang.name} Translator`)
    const newLangRole = await message.guild.roles.cache.find(r => r.name === `${lang.name} Proofreader`)
    const oldProjectRole = await message.guild.roles.cache.find(r => r.name === `Quickplay Translator`)
    const newProjectRole = await message.guild.roles.cache.find(r => r.name === `Quickplay Proofreader`)
    await member.roles.remove([oldLangRole.id, oldProjectRole.id], "Verified")
    await member.roles.add(["569194996964786178", newLangRole.id, newProjectRole.id], "Verified") //Verified
    await getDb().collection("users").updateOne({ id: member.user.id }, { $set: { profile: args[3] } })
    message.client.channels.cache.get("662660931838410754").send(`${member}'s role was updated to ${lang.name} ${newProjectRole.name} by ${message.author.tag}! Here's their Crowdin profile: ${args[3]}`)
}

async function sba(message, member, args) {
    if (!args[2]) return
    if (!/(https:\/\/)?(www\.)?crowdin\.com\/profile\/\S{1,}/gi.test(args[2])) return
    const oldProjectRole = await message.guild.roles.cache.find(r => r.name === `SkyblockAddons Translator`)
    const newProjectRole = await message.guild.roles.cache.find(r => r.name === `SkyblockAddons Proofreader`)
    await member.roles.remove(oldProjectRole.id, "Verified")
    await member.roles.add(["569194996964786178", newProjectRole.id], "Verified") //Verified
    await getDb().collection("users").updateOne({ id: member.user.id }, { $set: { profile: args[3] } })
    message.client.channels.cache.get("662660931838410754").send(`${member}'s role was updated to ${newProjectRole.name} by ${message.author.tag}! Here's their Crowdin profile: ${args[2]}`)
}

async function bot(message, member, args) {
    if (!args[2]) return
    if (!/(https:\/\/)?(www\.)?crowdin\.com\/profile\/\S{1,}/gi.test(args[2])) return
    const oldProjectRole = await message.guild.roles.cache.find(r => r.name === `Bot Translator`)
    const newProjectRole = await message.guild.roles.cache.find(r => r.name === `Bot Proofreader`)
    await member.roles.remove(oldProjectRole.id, "Verified")
    await member.roles.add(["569194996964786178", newProjectRole.id], "Verified") //Verified
    await getDb().collection("users").updateOne({ id: member.user.id }, { $set: { profile: args[3] } })
    message.client.channels.cache.get("662660931838410754").send(`${member}'s role was updated to ${newProjectRole.name} by ${message.author.tag}! Here's their Crowdin profile: ${args[2]}`)
}
