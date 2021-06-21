import Discord from "discord.js"
import { successColor, errorColor } from "../../config.json"
import fetch, { FetchError } from "node-fetch"
import { db, DbUser } from "../../lib/dbclient"
import { getPlayer } from "./hypixelstats"
import { client, Command, GetStringFunction } from "../../index"

const command: Command = {
    name: "minecraft",
    description: "Looks up info about a specific Minecraft player",
    options: [{
        type: "SUB_COMMAND",
        name: "names",
        description: "Shows the user's name history",
        options: [{
            type: "STRING",
            name: "username",
            description: "The IGN of the user to get the name history for. ",
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
            description: "The IGN of the user to get the skin for",
            required: false
        },
        {
            type: "USER",
            name: "user",
            description: "The server member to get statistics for. Only works if the user has verified themselves",
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
            userInput = interaction.options.first()!.options?.get("user")?.user as Discord.User | undefined,
            usernameInput = interaction.options.first()!.options?.get("username")?.value as string | undefined,
            subCommand = interaction.options.first()!.name as string
        
        let uuid = authorDb.uuid
        if (userInput) {
            const userDb: DbUser = await client.getUser(userInput.id)
            if (userDb.uuid) uuid = userDb.uuid
            else throw "notVerified"
        } else if (usernameInput && usernameInput?.length < 32) uuid = await getPlayer(usernameInput)
        else uuid = usernameInput ?? authorDb.uuid
        if (!uuid) throw "noUser"

        await interaction.defer()
        
        const names = async () => {
            const res = await fetch(`https://api.mojang.com/user/profiles/${uuid}/names`, { headers: { "User-Agent": "Hypixel   Translators Bot" }, method: "Get", timeout: 30000 })

            if (!await res.text())
                throw "invalidUUID"
            const json: NameHistoryResponse = await res.json()

            const username = json[json.length - 1].name.split("_").join("\\_")
            
            const nameHistoryEmbed = new Discord.MessageEmbed()
                .setColor(successColor)
                .setAuthor(getString("moduleName"))
                .setTitle(username)
        }

        
    }
}

type NameHistoryResponse = {name: string, changedToAt?: number}[]

export default command