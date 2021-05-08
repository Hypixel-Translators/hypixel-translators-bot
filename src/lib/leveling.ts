import { db, DbUser } from "./dbclient"
import Discord from "discord.js"
const talkedRecently: Discord.Collection<string, number> = new Discord.Collection()

export default async function leveling(interaction: Discord.CommandInteraction) {
    const collection = db.collection("users")
    const now = Date.now()
    const lastMsg = talkedRecently.get(interaction.user.id)

    if (!lastMsg || lastMsg + 60000 < now) { //If the user talked more than a minute ago or if they haven't talked since the bot started
        const randomXp = Math.floor(Math.random() * 11) + 15 //Random number between 25 and 15. 11 comes from 25-15+1
        const userDb: DbUser = await collection.findOne({ id: interaction.user.id })
        const xpNeeded = getXpNeeded(userDb.levels?.level, userDb.levels?.levelXp + randomXp)

        //If at least one of the values is undefined
        if (isNaN(xpNeeded)) collection.updateOne({ id: interaction.user.id }, { $inc: { "levels.level": 0, "levels.levelXp": 0, "levels.totalXp": 0, "levels.messageCount": 0 } })
        //if user levels up
        if (xpNeeded <= 0) collection.findOneAndUpdate({ id: interaction.user.id }, { $inc: { "levels.level": 1, "levels.totalXp": randomXp, "levels.messageCount": 1 }, $set: { "levels.levelXp": (-xpNeeded || 0) } }).then(r => interaction.reply(`GG ${interaction.user}, you just advanced to level ${r.value.levels.level + 1}! :tada:`))
        else collection.updateOne({ id: interaction.user.id }, { $inc: { "levels.totalXp": randomXp, "levels.levelXp": randomXp, "levels.messageCount": 1 } })
        talkedRecently.set(interaction.user.id, now)
    } else collection.updateOne({ id: interaction.user.id }, { $inc: { "levels.messageCount": 1 } })
}

export function getXpNeeded(lvl: number, xp: number = 0) { return 5 * (lvl ** 2) + (50 * lvl) + 100 - xp }
// source: https://github.com/Mee6/Mee6-documentation/blob/master/docs/levels_xp.md
