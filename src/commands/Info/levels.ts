import Discord from "discord.js"
import { neutralColor, errorColor } from "../../config.json"
import { Command } from "../../index"
import { db, DbUser } from "../../lib/dbclient"

const command: Command = {
    name: "levels",
    description: "Shows you the XP leaderboard",
    options: [{
        type: "INTEGER",
        name: "page",
        description: "The leaderboard page to get",
        required: false
    }],
    cooldown: 60,
    channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058"], //bots staff-bots bot-dev 
    allowDM: true,
    async execute(interaction: Discord.CommandInteraction, getString: (path: string, variables?: { [key: string]: string | number } | string, cmd?: string, lang?: string) => any) {
        const executedBy = getString("executedBy", { user: interaction.user.tag }, "global"),
            collection = db.collection("users"),
            allUsers: DbUser[] = await collection.find({}, { sort: { "levels.totalXp": -1, "id": 1 } }).toArray()

        const pages: DbUser[][] = [] // inner arrays are of length 24
        let p = 0
        while (p < allUsers.length) pages.push(allUsers.slice(p, p += 24)) //Max number of fields divisible by 3

        let page: number = 0
        const inputPage = Math.abs(interaction.options.get("page")?.value as number) - 1
        if (inputPage) page = inputPage

        if (page >= pages.length || page < 0) {
            const embed = new Discord.MessageEmbed()
                .setColor(errorColor)
                .setAuthor(getString("moduleName"))
                .setTitle(getString("pageTitle"))
                .setDescription(getString("pageNotExist"))
                .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
            return interaction.reply(embed)
        } else {
            const controlButtons = new Discord.MessageActionRow()
                .addComponents(
                    new Discord.MessageButton()
                        .setStyle("DANGER")
                        .setCustomID("first")
                        .setLabel(getString("pagination.first", "global")),
                    new Discord.MessageButton()
                        .setStyle("PRIMARY")
                        .setCustomID("previous")
                        .setLabel(getString("pagination.previous", "global")),
                    new Discord.MessageButton()
                        .setStyle("PRIMARY")
                        .setCustomID("next")
                        .setLabel(getString("pagination.next", "global")),
                    new Discord.MessageButton()
                        .setStyle("DANGER")
                        .setCustomID("last")
                        .setLabel(getString("pagination.last", "global"))
                )
            await interaction.reply({ embeds: [fetchPage(page, pages, getString, executedBy, interaction)], components: [controlButtons] })
            const msg = await interaction.fetchReply() as Discord.Message

            const collector = msg.createMessageComponentInteractionCollector((button: Discord.MessageComponentInteraction) => (button.customID === "first" || button.customID === "previous" || button.customID === "next" || button.customID === "last") && interaction.user.id === button.user.id, { time: this.cooldown! * 1000 }) //2 minutes

            collector.on("collect", buttonInteraction => {
                if (buttonInteraction.customID === "first") page = 0
                if (buttonInteraction.customID === "last") page = pages.length - 1
                if (buttonInteraction.customID === "previous") {
                    page--
                    if (page < 0) page = 0
                }
                if (buttonInteraction.customID === "next") {
                    page++
                    if (page > pages.length - 1) page = pages.length - 1
                }
                buttonInteraction.update(fetchPage(page, pages, getString, executedBy, interaction))
            })

            collector.on("end", () => {
                interaction.editReply(getString("timeOut", { command: "`+levels`" }), { components: [] })
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
