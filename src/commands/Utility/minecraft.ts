import Discord from "discord.js"
import { successColor } from "../../config.json"
import fetch from "node-fetch"
import { DbUser } from "../../lib/dbclient"
import { client, Command, GetStringFunction } from "../../index"
import { updateButtonColors } from "./help"
const fetchSettings = { headers: { "User-Agent": "Hypixel Translators Bot" }, timeout: 10000 }

const command: Command = {
    name: "minecraft",
    description: "Looks up info about a specific Minecraft player",
    options: [{
        type: "SUB_COMMAND",
        name: "history",
        description: "Shows the user's name history",
        options: [{
            type: "STRING",
            name: "username",
            description: "The IGN/UUID of the user to get the name history for. ",
            required: false
        },
        {
            type: "USER",
            name: "user",
            description: "The server member to get the name history for. Only works if the user has verified themselves",
            required: false
        }]
    },
    {
        type: "SUB_COMMAND",
        name: "skin",
        description: "Shows the user's skin",
        options: [{
            type: "STRING",
            name: "username",
            description: "The IGN/UUID of the user to get the skin for. Defaults to your own skin if you're verified with /hypixelverify",
            required: false
        },
        {
            type: "USER",
            name: "user",
            description: "The server member to get the skin for. Only works if the user has verified themselves",
            required: false
        }]
    }],
    cooldown: 120,
    channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058"], // bots staff-bots bot-dev
    allowDM: true,
    async execute(interaction: Discord.CommandInteraction, getString: GetStringFunction) {
        const executedBy = getString("executedBy", { user: interaction.user.tag }, "global"),
            credits = getString("madeBy", { developer: interaction.client.users.cache.get("500669086947344384")!.tag }),
            authorDb: DbUser = await client.getUser(interaction.user.id),
            subCommand = interaction.options.first()!.name as string,
            userInput = interaction.options.first()!.options?.get("user")?.user as Discord.User | undefined,
            usernameInput = interaction.options.first()!.options?.get("username")?.value as string | undefined

        let uuid = authorDb.uuid
        const userDb: DbUser = await client.getUser(userInput?.id)
        if (userInput) {
            if (userDb.uuid) uuid = userDb.uuid
            else throw "notVerified"
        } else if (usernameInput && usernameInput.length < 32) uuid = await getUUID(usernameInput)
        else uuid = usernameInput ?? authorDb.uuid
        if (!uuid) throw "noUser"
        const isOwnUser = uuid === userDb?.uuid

        switch (subCommand) {
            case "history":
                await interaction.defer()

                const nameHistory = await getNameHistory(uuid),
                    username = nameHistory[0].name.split("_").join("\\_")

                let timeZone = getString("region.timeZone", "global"),
                    dateLocale = getString("region.dateLocale", "global")
                if (timeZone.startsWith("crwdns")) timeZone = getString("region.timeZone", "global", "en")
                if (dateLocale.startsWith("crwdns")) dateLocale = getString("region.dateLocale", "global", "en")

                let nameHistoryList = ""
                for (const nameChangedDate of nameHistory)
                    nameHistoryList += (nameChangedDate.changedToAt ? getString("history.changedAt", { date: new Date(nameChangedDate.changedToAt!).toLocaleString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric', hour: "2-digit", minute: "2-digit", timeZone: timeZone, timeZoneName: "short" }) }) : username) + "\n"

                let p = 0
                const pages: NameHistory[][] = []
                while (p < nameHistory.length) pages.push(nameHistory.slice(p, p += 24)) //Max number of fields divisible by 3

                if (pages.length == 1) {
                    const nameHistoryEmbed = new Discord.MessageEmbed()
                        .setColor(successColor)
                        .setAuthor(getString("moduleName"))
                        .setTitle(getString("history.nameHistoryFor", { username }))
                        .addFields(constructFields(pages[0]))
                        .setFooter(`${executedBy} | ${credits}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                    await interaction.editReply({ embeds: [nameHistoryEmbed] })
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
                        page = 0

                    controlButtons = updateButtonColors(controlButtons, page, pages)
                    await interaction.editReply({ embeds: [] })

                    function fetchPage(page: number, pages: NameHistory[][]) {
                        const embed = new Discord.MessageEmbed()
                            .setColor(successColor)
                            .setAuthor(getString("moduleName"))
                            .setTitle(getString("history.nameHistoryFor", { username }))
                            .addFields(constructFields(pages[0]))
                            .setFooter(`${executedBy} | ${credits}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                    }

                }

                break
            case "skin":
                const skinEmbed = new Discord.MessageEmbed()
                    .setColor(successColor)
                    .setAuthor(getString("moduleName"))
                    .setTitle(isOwnUser ? getString("skin.yourSkin") : getString("skin.userSkin", { user: (userInput?.toString() || usernameInput)! })) //There's always at least a user or username input if it's not the own user, otherwise the command throws an error above
                    .setThumbnail(`https://crafatar.com/renders/body/${uuid}?overlay`)
                    .setFooter(`${executedBy} | ${credits}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                await interaction.reply({ embeds: [skinEmbed] })
                break
        }


    }
}

export default command

export async function getUUID(username: string): Promise<string | undefined> {
    if (!username) return
    return await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`, fetchSettings)
        .then(res => res.json())
        .then(json => json.id)
        .catch(() => {
            return
        })
}

async function getNameHistory(uuid: string): Promise<NameHistory[]> {
    const res = await fetch(`https://api.mojang.com/user/profiles/${uuid}/names`, fetchSettings)
    return (await res.json()).reverse()
}

function constructFields(array: NameHistory[]) {
    const fields: Discord.EmbedFieldData[] = []
    array.forEach(name => fields.push({ name: name.name, value: name.changedToAt?.toString() || "First name", inline: true }))
    return fields
}

interface NameHistory {
    name: string
    changedToAt?: number
}
