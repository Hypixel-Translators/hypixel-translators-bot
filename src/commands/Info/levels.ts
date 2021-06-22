import Discord from "discord.js"
import { neutralColor, errorColor } from "../../config.json"
import { Command, GetStringFunction } from "../../index"
import { db, DbUser } from "../../lib/dbclient"
import { updateButtonColors } from "../Utility/help"

const command: Command = {
    name: "levels",
    description: "Shows you the XP leaderboard",
    options: [{
        type: "BOOLEAN",
        name: "me",
        description: "Whether to start at the page you appear in. Has priority over the \"page\" argument.",
        required: false
    },
    {
        type: "INTEGER",
        name: "page",
        description: "The leaderboard page to get",
        required: false
    }],
    cooldown: 60,
    channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058"], //bots staff-bots bot-dev 
    allowDM: true,
    async execute(interaction: Discord.CommandInteraction, getString: GetStringFunction) {
        const executedBy = getString("executedBy", { user: interaction.user.tag }, "global"),
            collection = db.collection("users"),
            allUsers: DbUser[] = await collection.find({}, { sort: { "levels.totalXp": -1, "id": 1 } }).toArray(),
            inputMe = interaction.options.get("me")?.value as boolean | undefined,
            inputPage = interaction.options.get("page")?.value as number | undefined

        const pages: DbUser[][] = [] // inner arrays are of length 24
        let p = 0
        while (p < allUsers.length) pages.push(allUsers.slice(p, p += 24)) //Max number of fields divisible by 3

        let page: number = 0
        if (inputMe) page = pages.indexOf(pages.find(p => p.some(u => u.id === interaction.user.id))!)
        else if (inputPage) page = inputPage - 1

        if (page >= pages.length || page < 0) {
            const embed = new Discord.MessageEmbed()
                .setColor(errorColor)
                .setAuthor(getString("moduleName"))
                .setTitle(getString("pageTitle"))
                .setDescription(getString("pageNotExist"))
                .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
            return await interaction.reply({ embeds: [embed] })
        } else {
            let controlButtons = new Discord.MessageActionRow()
                .addComponents(
                    new Discord.MessageButton()
                        .setStyle("SUCCESS")
                        .setEmoji("⏮")
                        .setCustomID("first")
                        .setLabel(getString("pagination.first", "global")),
                    new Discord.MessageButton()
                        .setStyle("SUCCESS")
                        .setEmoji("◀️")
                        .setCustomID("previous")
                        .setLabel(getString("pagination.previous", "global")),
                    new Discord.MessageButton()
                        .setStyle("SUCCESS")
                        .setEmoji("▶️")
                        .setCustomID("next")
                        .setLabel(getString("pagination.next", "global")),
                    new Discord.MessageButton()
                        .setStyle("SUCCESS")
                        .setEmoji("⏭")
                        .setCustomID("last")
                        .setLabel(getString("pagination.last", "global"))
                ),
                pageEmbed: Discord.MessageEmbed = fetchPage(page, pages, getString, executedBy, interaction)

            controlButtons = updateButtonColors(controlButtons, page, pages)
            await interaction.reply({ embeds: [pageEmbed], components: [controlButtons] })
            const msg = await interaction.fetchReply() as Discord.Message

            const collector = msg.createMessageComponentInteractionCollector((button: Discord.MessageComponentInteraction) => button.customID === "first" || button.customID === "previous" || button.customID === "next" || button.customID === "last", { time: this.cooldown! * 1000 })

            collector.on("collect", async buttonInteraction => {
                const userDb: DbUser = await db.collection("users").findOne({ id: buttonInteraction.user.id })
                if (interaction.user.id !== buttonInteraction.user.id) return await buttonInteraction.reply({ content: getString("pagination.notYours", { command: `/${this.name}` }, "global", userDb.lang), ephemeral: true })
                else if (buttonInteraction.customID === "first") page = 0
                else if (buttonInteraction.customID === "last") page = pages.length - 1
                else if (buttonInteraction.customID === "previous") {
                    page--
                    if (page < 0) page = 0
                }
                else if (buttonInteraction.customID === "next") {
                    page++
                    if (page > pages.length - 1) page = pages.length - 1
                }
                pageEmbed = fetchPage(page, pages, getString, executedBy, interaction)
                controlButtons = updateButtonColors(controlButtons, page, pages)
                await buttonInteraction.update({ embeds: [pageEmbed], components: [controlButtons] })
            })

            collector.on("end", async () => {
                await interaction.editReply({ content: getString("pagination.timeOut", { command: `\`/${this.name}\`` }), components: [] })
            })
        }

    }
}

function fetchPage(page: number, pages: DbUser[][], getString: GetStringFunction, executedBy: string, interaction: Discord.CommandInteraction) {
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
            const totalXp = pages[page][i].levels!.totalXp
            pageEmbed.addField(getString("level", { rank: (i + 1) + (page * 24), level: pages[page][i].levels!.level, xp: totalXp > 1000 ? `${(totalXp / 1000).toFixed(2)}${getString("thousand")}` : totalXp }), `<@!${pages[page][i].id}>${pages[page][i].id === interaction.user.id ? ` - **${getString("youIndicator")}**` : ""}`, true)
        } else pageEmbed.addField(getString("unranked", { rank: (i + 1) + (page * 24) }), `<@!${pages[page][i].id}>${pages[page][i].id === interaction.user.id ? ` - **${getString("youIndicator")}**` : ""}`, true)
    }
    return pageEmbed
}

export default command
