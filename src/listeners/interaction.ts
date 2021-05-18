import { client } from "../index.js"
import { DbUser } from "../lib/dbclient.js"
import Discord from "discord.js"
import { loadingColor, errorColor, successColor, neutralColor, blurple } from "../config.json"
import fs from "fs"

client.on("interaction", async interaction => {
    if (!interaction.isCommand() || interaction.user.bot) return

    const author: DbUser = await client.getUser(interaction.user.id),
        command = client.commands.get(interaction.commandName)!,
        member = await interaction.client.guilds.cache.get("440838503560118273")?.members.fetch(interaction.user.id)!,
        executedBy = getString("executedBy", { user: interaction.user.tag })

    //Log if command is ran in DMs
    if (interaction.channel?.type === "dm") console.log(`${interaction.user.tag} used command ${interaction.commandName} in DMs`)

    //Return if user is not verified
    if (!member?.roles.cache.has("569194996964786178") && command.name !== "verify") return //Verified

    let allowed = true
    //Prevent users from running commands in development
    if (command.dev && !member?.roles.cache.has("768435276191891456")) allowed = false //Discord Staff

    //Give perm to admins and return if not allowed
    if (!allowed) {
        return setTimeout(() => {
            if (!interaction.replied) interaction.reply(getString("errors.noPerm"), { ephemeral: true })
        }, 5000)
    }

    //Stop and error if command is not allowed in DMs and command is sent in DMs
    if (!command.allowDM && interaction.channel?.type === "dm" && !member?.permissions.has("ADMINISTRATOR")) {
        const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setAuthor(getString("error"))
            .setTitle(getString("errors.dmError"))
            .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
        return interaction.reply(embed)
    }
    //Cooldown system
    if (!client.cooldowns.has(command.name)) client.cooldowns.set(command.name, new Discord.Collection())
    const now = Date.now(),
        timestamps: Discord.Collection<string, number> = client.cooldowns.get(command.name)!,
        cooldownAmount = (command.cooldown || 3) * 1000
    if (timestamps.has(interaction.user.id)) {
        const expirationTime = timestamps.get(interaction.user.id)! + cooldownAmount
        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000
            let timeLeftS
            if (Math.ceil(timeLeft) >= 120) timeLeftS = getString("minsLeftT", { time: Math.ceil(timeLeft / 60), command: interaction.commandName })
            else if (Math.ceil(timeLeft) === 1) timeLeftS = getString("secondLeft", { command: interaction.commandName })
            else timeLeftS = getString("timeLeftT", { time: Math.ceil(timeLeft), command: interaction.commandName })

            const embed = new Discord.MessageEmbed()
                .setColor(errorColor)
                .setAuthor(getString("cooldown"))
                .setTitle(timeLeftS)
                .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
            return interaction.reply({ embeds: [embed], ephemeral: true })
        }
    }

    //Remove cooldown if administrator
    if (!member?.permissions.has("MANAGE_ROLES")) {
        timestamps.set(interaction.user.id, now)
        setTimeout(() => {
            timestamps.delete(interaction.user.id)
        }, cooldownAmount)
    }

    /**
     * Gets a string or an object of strings for the correct language and replaces all variables if any
     *
     * @param {string} path Path to the string. Use dots to access strings inside objects
     * @param {Object} [variables] Object containing all the variables and their corresponding text to be replaced in the string.
     * @param {string} [cmd] The name of the file to get strings from. Defaults to the command being ran
     * @param {string} [lang] The language to get the string from. Defaults to the author's language preference.
     * @returns A clean string with all the variables replaced or an object of strings. Will return `strings.{path}` if the path cannot be found.
     */
    function getString(path: string, variables?: { [key: string]: string | number } | string, cmd: string = command?.name ?? "global", lang: string = author.lang ?? "en"): any {
        const languages = fs.readdirSync("./strings")
        if (typeof variables === "string") {
            lang = languages.includes(cmd) ? cmd : author.lang ?? "en"
            cmd = variables
        }
        let enStrings = require(`../../strings/en/${cmd}.json`)
        let strings: any
        try {
            strings = require(`../../strings/${lang}/${cmd}.json`)
        } catch {
            strings = require(`../../strings/en/${cmd}.json`)
        }
        const pathSplit = path.split(".")
        let string
        pathSplit.forEach(pathPart => {
            if (pathPart) {
                let jsonElement
                if (strings[pathPart]) jsonElement = strings[pathPart]
                else jsonElement = enStrings[pathPart]

                if (typeof jsonElement === "object" && pathSplit.indexOf(pathPart) !== pathSplit.length - 1) {
                    //check if the string isn't an object nor the end of the path
                    if (strings[pathPart]) strings = strings[pathPart]
                    enStrings = enStrings[pathPart]
                    return
                } else {
                    string = strings[pathPart]
                    if (!string || typeof string === "string" && !arrayEqual(string.match(/%%\w+%%/g), enStrings[pathPart].match(/%%\w+%%/g))) {
                        string = enStrings[pathPart] //if the string hasn't been added yet or if the variables changed
                        if (!string) {
                            string = null //in case of fire
                            if (command!.category != "Admin" && command!.category != "Staff") console.error(`Couldn't get string ${path} in English for ${cmd}, please fix this`)
                        }
                    }
                    if (typeof string === "string" && variables) {
                        for (const [variable, text] of Object.entries(variables)) {
                            string = string.replace(`%%${variable}%%`, String(text))
                        }
                    }
                }
            } else if (strings) string = strings
            else string = enStrings
        })
        return string
    }

    //Run command and handle errors
    try {
        // Run the command
        await command.execute(interaction, getString)

        // Try sending a tip
        // This will only execute if the command is successful
        const d = Math.random() * 100 // Get percentage
        if (command.allowTip !== false && d <= 5) {
            // Less than or equal to 5%
            const keys = Object.keys(getString("tips"))
            const tip = getString(`tips.${keys[(keys.length * Math.random()) << 0]}`, { botUpdates: "<#732587569744838777>", gettingStarted: "<#699275092026458122>", twitter: "<https://twitter.com/HTranslators>", rules: "<#796159719617986610>", serverInfo: "<#762341271611506708>", bots: "<#549894938712866816>" }, "global")
            interaction.webhook.send(`**${getString("tip").toUpperCase()}:** ${tip}`)
        }
    } catch (error) {
        if (!error.stack) error = getString(`errors.${error}`)

        // Send error to bot-dev channel
        if (error.stack) {
            if (process.env.NODE_ENV === "production") {
                const embed = new Discord.MessageEmbed()
                    .setColor(errorColor)
                    .setAuthor("Unexpected error!")
                    .setTitle(error.toString().substring(0, 255))
                    .setDescription(`\`\`\`${error.stack.substring(0, 2047)}\`\`\``)
                    .setFooter("Check the console for more details");
                (interaction.client.channels.cache.get("730042612647723058") as Discord.TextChannel).send("<:aaaAAAAAAAAAAARGHGFGGHHHHHHHHHHH:831565459421659177> ERROR INCOMING, PLEASE FIX <@240875059953139714>", embed) //Rodry and bot-development
            }
            console.error(`Unexpected error with command ${interaction.commandName} on channel ${interaction.channel instanceof Discord.DMChannel ? interaction.channel.type : (interaction.channel as Discord.TextChannel).name} executed by ${interaction.user.tag}. Here's the error:\n${error.stack}`)
        }

        //Handle errors
        timestamps.delete(interaction.user.id)
        const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setAuthor(getString("error"))
            .setTitle(error.interaction?.substring(0, 255) || error.toString().substring(0, 255))
            .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
        if (command.category == "Admin" || command.category == "Staff") embed.addField(getString("usage"), `\`${command.usage}\``)
        else embed.addField(getString("usage"), `\`${getString(`${command.name}.usage`, "help")}\``)
        return interaction.reply({ embeds: [embed], ephemeral: true })
    }
})

export function arrayEqual(a: any, b: any) {
    if (a == b) return true

    if (!Array.isArray(a) || !Array.isArray(b)) return false

    // .concat() to not mutate arguments
    let arr1 = a.concat().sort(),
        arr2 = b.concat().sort()

    // Remove duplicated values
    arr1 = arr1.filter((item: string, index: number) => arr1.indexOf(item) == index)
    arr2 = arr2.filter((item: string, pos: number) => arr2.indexOf(item) == pos)

    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false
    }

    return true
}
