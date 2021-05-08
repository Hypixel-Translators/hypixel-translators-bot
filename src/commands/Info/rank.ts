import Discord from "discord.js"
import { neutralColor, errorColor } from "../../config.json"
import { Command } from "../../index"
import { db, DbUser } from "../../lib/dbclient"
import { getXpNeeded } from "../../lib/leveling"

const command: Command = {
    name: "rank",
    description: "Gives you the current xp for yourself or any given user.",
    aliases: ["level"],
    usage: "+rank [user]",
    cooldown: 30,
    channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058"], //bots staff-bots bot-dev 
    allowDM: true,
    async execute(interaction: Discord.CommandInteraction, args: string[], getString: (path: string, variables?: { [key: string]: string | number } | string, cmd?: string, lang?: string) => any) {
        const executedBy = getString("executedBy", { user: interaction.user.tag }, "global")
        const collection = db.collection("users")
        let member: Discord.GuildMember | undefined
        let memberRaw = args[0]?.replace(/[\\<>@#&!]/g, "").toLowerCase()
        if (!args[0]) member = interaction.member!
        else member = interaction.guild!.members.cache.find(u => u.id === memberRaw || u.user.tag.toLowerCase() === memberRaw || u.user.username.toLowerCase() === memberRaw || u.displayName.toLowerCase() === memberRaw || u.displayName.toLowerCase().includes(memberRaw))
        if (!member) throw "falseUser"

        const userDb: DbUser = await collection.findOne({ id: member.id })
        if (!userDb.levels) {
            const errorEmbed = new Discord.MessageEmbed()
                .setColor(errorColor)
                .setAuthor(getString("moduleName"))
                .setTitle(member === interaction.member ? getString("youNotRanked") : getString("userNotRanked"))
                .setDescription(getString("howRank"))
                .setFooter(executedBy, interaction.user.displayAvatarURL())
            return interaction.reply(errorEmbed)
        }
        const totalXp = getXpNeeded(userDb.levels.level)
        const progressBar = generateProgressBar(userDb.levels?.levelXp, totalXp)
        const ranking = (await collection.find({}, { sort: { "levels.totalXp": -1, "id": 1 } }).toArray()).map(u => u.id).indexOf(member.id) + 1
        const currentXp = userDb.levels.levelXp
        const messageCount = userDb.levels.messageCount

        const embed = new Discord.MessageEmbed()
            .setColor(neutralColor)
            .setAuthor(getString("moduleName"))
            .setTitle(member === interaction.member ? getString("yourRank") : getString("userRank", { user: member.user.tag }))
            .setDescription(member === interaction.member ? getString("youLevel", { level: userDb.levels.level, rank: ranking }) : getString("userLevel", { user: String(member), level: userDb.levels.level, rank: ranking }))
            .addField(getString("textProgress", { currentXp: currentXp > 1000 ? `${(currentXp / 1000).toFixed(2)}${getString("thousand")}` : currentXp, xpNeeded: totalXp > 1000 ? `${(totalXp / 1000).toFixed(2)}${getString("thousand")}` : totalXp, messages: messageCount > 1000 ? `${(messageCount / 1000).toFixed(2)}${getString("thousand")}` : messageCount }), progressBar)
            .setFooter(executedBy, interaction.user.displayAvatarURL())
        interaction.reply(embed)
    }
}

function generateProgressBar(current: number, goal: number, places: number = 10): string {
    const progressEmoji = "<:progress_done:820405383935688764>"
    const leftEmoji = "<:progress_left:820405406906974289>"
    if (isNaN(current) || isNaN(goal)) return leftEmoji.repeat(places) + "\u200b"

    const progressFixed = Math.round((current / goal) * places)
    const leftFixed = places - progressFixed

    return progressEmoji.repeat(progressFixed) + leftEmoji.repeat(leftFixed) + "\u200b" //add a blank char at the end to prevent huge emojis on android
}

export default command
