import Discord from "discord.js"
import { neutralColor, errorColor } from "../../config.json"
import { Command } from "../../index"
import { db, DbUser } from "../../lib/dbclient"
import { getXpNeeded } from "../../lib/leveling"

const command: Command = {
    name: "levels",
    description: "Shows you the XP leaderboard",
    aliases: ["leaderboard"],
    usage: "+levels",
    cooldown: 60,
    channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058"], //bots staff-bots bot-dev 
    allowDM: true,
    async execute(interaction: Discord.CommandInteraction, args: string[], getString: (path: string, variables?: { [key: string]: string | number } | string, cmd?: string, lang?: string) => any) {
        const executedBy = getString("executedBy", { user: interaction.user.tag }, "global")
        const collection = db.collection("users")
        const allUsers: DbUser[] = await collection.find({}, { sort: { "levels.totalXp": -1, "id": 1 } }).toArray()

        const pages: DbUser[][] = [] // inner arrays are of length 24
        let p = 0
        while (p < allUsers.length) pages.push(allUsers.slice(p, p += 24)) //Max number of fields divisible by 3

        let page: number = 0
        if (Number(args[0])) page = Math.round(Number(args[0]) - 1)

        if (page >= pages.length || page < 0) {
            const embed = new Discord.MessageEmbed()
                .setColor(errorColor)
                .setAuthor(getString("moduleName"))
                .setTitle(getString("pageTitle"))
                .setDescription(getString("pageNotExist"))
                .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
            return interaction.reply(embed)
        } else {
            interaction.reply(fetchPage(page, pages, getString, executedBy, message))
                .then(async msg => {
                    await msg.react("⏮"); await msg.react("◀"); await msg.react("▶"); await msg.react("⏭")

                    const collector = msg.createReactionCollector((reaction: Discord.MessageReaction, user: Discord.User) => (reaction.emoji.name === "⏮" || reaction.emoji.name === "◀" || reaction.emoji.name === "▶" || reaction.emoji.name === "⏭") && user.id === interaction.user.id, { time: 120000 }) //2 minutes

                    collector.on("collect", reaction => {
                        if (reaction.emoji.name === "⏮") page = 0 //First
                        if (reaction.emoji.name === "⏭") page = pages.length - 1 //Last
                        if (reaction.emoji.name === "◀") { //Previous
                            page--
                            if (page < 0) page = 0
                        }
                        if (reaction.emoji.name === "▶") { //Next
                            page++
                            if (page > pages.length - 1) page = pages.length - 1
                        }
                        reaction.users.remove(interaction.user.id)
                        msg.edit(fetchPage(page, pages, getString, executedBy, message))
                    })

                    collector.on("end", () => {
                        msg.edit(getString("timeOut", { command: "`+levels`" }))
                        msg.reactions.removeAll()
                    })
                })
        }

    }
}

function fetchPage(page: number, pages: DbUser[][], getString: (path: string, variables?: { [key: string]: string | number } | string, cmd?: string, lang?: string) => any, executedBy: string, interaction: Discord.CommandInteraction) {
    if (page > pages.length - 1) page = pages.length - 1
    if (page < 0) page = 0
    const pageEmbed = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setAuthor(getString("moduleName"))
        .setTitle(getString("pageTitle"))
        .setFooter(`${getString("page", { number: page + 1, total: pages.length })} | ${executedBy}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
    for (let i = 0; i <= pages[page].length - 1; i++) {
        // const user = interaction.client.users.cache.get(pages[page][i].id)! //Get the user if we ever decide to change that
        if (pages[page][i].levels) {
            const totalXp = pages[page][i].levels.totalXp
            pageEmbed.addField(getString("level", { rank: (i + 1) + (page * 24), level: pages[page][i].levels.level, xp: totalXp > 1000 ? `${(totalXp / 1000).toFixed(2)}${getString("thousand")}` : totalXp }), `<@!${pages[page][i].id}>`, true)
        } else pageEmbed.addField(getString("unranked", { rank: (i + 1) + (page * 24) }), `<@!${pages[page][i].id}>`, true)
    }
    return pageEmbed
}

export default command
