import { errorColor, successColor, neutralColor } from "../../config.json"
import Discord from "discord.js"
import fs from "fs"
import { db, DbUser } from "../../lib/dbclient"
import { Command } from "../../index"

const command: Command = {
    name: "language",
    description: "Changes your language, shows your current one or a list of available languages.",
    options: [{
        type: "SUB_COMMAND",
        name: "set",
        description: "Sets your language to a new one. Leave empty to see your current language",
        options: [{
            type: "STRING",
            name: "language",
            description: "The new language you want to set",
            required: false
        }]
    },
    {
        type: "SUB_COMMAND",
        name: "list",
        description: "Gives you a list of all the available languages",
    },
    {
        type: "SUB_COMMAND",
        name: "stats",
        description: "Gives you usage statistics for a given language. Admin only",
        options: [{
            type: "STRING",
            name: "language",
            description: "The language to get usage statistics for",
            required: true
        }],
    }],
    channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058"], //bots staff-bots bot-dev 
    allowDM: true,
    cooldown: 5,
    async execute(interaction: Discord.CommandInteraction, getString: (path: string, variables?: { [key: string]: string | number } | string, cmd?: string, lang?: string) => any) {
        let executedBy = getString("executedBy", { user: interaction.user.tag }, "global")
        const collection = db.collection("users"),
            stringsFolder = "./strings/",
            member = interaction.member as Discord.GuildMember,
            subCommand = interaction.options.first()!.name as string | undefined
        let newLang = (interaction.options.first()!.options?.get("language")?.value as string | undefined)?.toLowerCase()

        if (subCommand === "list") {
            const files = fs.readdirSync(stringsFolder)
            let langList: string[] = []
            files.forEach(async (element, index, array) => {
                if (element === "empty" && !member.roles.cache.has("764442984119795732")) return //Discord Administrator
                let languageString: string
                if (element === "empty") languageString = "Empty"
                else languageString = getString(element)
                langList.push(getString("listElement", { code: element, language: languageString || "Unknown" }))
                if (index === array.length - 1) {
                    const embed = new Discord.MessageEmbed()
                        .setColor(neutralColor)
                        .setAuthor(getString("moduleName"))
                        .setTitle(getString("listTitle"))
                        .setDescription(langList.join("\n"))
                        .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                    await interaction.reply(embed)
                }
            })
        } else if (subCommand === "stats") {
            if (!member.roles.cache.has("764442984119795732")) return interaction.reply("You do not have permission to execute this command", { ephemeral: true })
            const files = fs.readdirSync(stringsFolder),
                langInput = interaction.options.first()!.options!.get("language")!.value as string
            if (!files.includes(langInput)) throw "falseLang"
            const langUsers: DbUser[] = await collection.find({ lang: langInput }).toArray(),
                users: string[] = []
            langUsers.forEach(u => users.push(`<@!${u.id}>`))
            const embed = new Discord.MessageEmbed()
                .setColor(neutralColor)
                .setAuthor("Language")
                .setTitle(`There ${langUsers.length === 1 ? `is ${langUsers.length} user` : `are ${langUsers.length} users`} using that language at the moment.`)
                .setFooter(`Executed By ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
            if (langInput !== "en") embed.setDescription(users.join(", "))
            await interaction.reply(embed)
        }
        else if (subCommand == "set" && newLang) {
            if (newLang === "se") newLang = "sv"
            const langdb = await db.collection("langdb").find().toArray(),
                langdbEntry = langdb.find(l => l.name.toLowerCase() === newLang)
            if (langdbEntry) newLang = langdbEntry.code
            if (newLang === "empty" && !member.roles.cache.has("764442984119795732")) newLang = "denied" //Discord Administrator
            fs.access(`./strings/${newLang}/language.json`, fs.constants.F_OK, async (err) => {
                if (!err) {
                    if (getString("changedToTitle", this.name, "en") !== getString("changedToTitle", this.name, newLang) || newLang === "en") {
                        collection.updateOne({ id: interaction.user.id }, { $set: { lang: newLang } }).then(r => {
                            if (r.result.nModified) {
                                executedBy = getString("executedBy", { user: interaction.user.tag }, "global", newLang)
                                const embed = new Discord.MessageEmbed()
                                    .setColor(successColor)
                                    .setAuthor(getString("moduleName", this.name, newLang))
                                    .setTitle(getString("changedToTitle", this.name, newLang))
                                    .setDescription(getString("credits", this.name, newLang))
                                    .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                                return interaction.reply(embed)
                            } else {
                                const embed = new Discord.MessageEmbed()
                                    .setColor(errorColor)
                                    .setAuthor(getString("moduleName", this.name, newLang))
                                    .setTitle(getString("didntChange", this.name, newLang))
                                    .setDescription(getString("alreadyThis", this.name, newLang))
                                    .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                                return interaction.reply(embed)
                            }
                        })
                    } else {
                        const embed = new Discord.MessageEmbed()
                            .setColor(errorColor)
                            .setAuthor(getString("moduleName"))
                            .setTitle(getString("didntChange"))
                            .setDescription(getString("notTranslated"))
                            .setFooter(executedBy, interaction.user.displayAvatarURL())
                        return interaction.reply(embed)
                    }
                } else {
                    await fs.readdir(stringsFolder, async (_err, files) => {
                        const emptyIndex = files.indexOf("empty")
                        if (emptyIndex > -1 && !member.roles.cache.has("764442984119795732")) files.splice(emptyIndex, 1) //Discord Administrator
                        const embed = new Discord.MessageEmbed()
                            .setColor(errorColor)
                            .setAuthor(getString("moduleName"))
                            .setTitle(getString("errorTitle"))
                            .setDescription(`${getString("errorDescription")}\n\`${files.join("`, `")}\`\n${getString("suggestAdd")}`)
                            .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                        await interaction.reply(embed)
                    })
                }
            })
        } else {
            const files = fs.readdirSync(stringsFolder),
                emptyIndex = files.indexOf("empty")
            if (emptyIndex > -1 && !member.roles.cache.has("764442984119795732")) files.splice(emptyIndex, 1) //Discord Administrator
            const embed = new Discord.MessageEmbed()
                .setColor(neutralColor)
                .setAuthor(getString("moduleName"))
                .setTitle(getString("current"))
                .setDescription(`${getString("errorDescription")}\n\`${files.join("`, `")}\`\n\n${getString("credits")}`)
                .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
            await interaction.reply(embed)
        }
    }
}

export default command
