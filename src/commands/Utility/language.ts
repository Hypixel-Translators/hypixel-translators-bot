import { errorColor, successColor, neutralColor } from "../../config.json"
import Discord from "discord.js"
import fs from "fs"
import { db, DbUser } from "../../lib/dbclient"
import { Command, GetStringFunction } from "../../index"

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
    async execute(interaction, getString: GetStringFunction) {
        let executedBy: string = getString("executedBy", { user: interaction.user.tag }, "global")
        const collection = db.collection("users"),
            stringsFolder = "./strings/",
            member = interaction.member as Discord.GuildMember,
            subCommand = interaction.options.getSubCommand()
        let language = interaction.options.getString("language", subCommand === "stats")?.toLowerCase()

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
                        .setColor(neutralColor as Discord.HexColorString)
                        .setAuthor(getString("moduleName"))
                        .setTitle(getString("listTitle"))
                        .setDescription(langList.join("\n"))
                        .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                    await interaction.reply({ embeds: [embed] })
                }
            })
        } else if (subCommand === "stats") {
            if (!member.roles.cache.has("764442984119795732")) return await interaction.reply({ content: getString("errors.noAccess", "global"), ephemeral: true })
            const files = fs.readdirSync(stringsFolder)
            if (!files.includes(language!)) throw "falseLang"
            const langUsers: DbUser[] = await collection.find({ lang: language }).toArray(),
                users: string[] = []
            langUsers.forEach(u => users.push(`<@!${u.id}>`))
            const embed = new Discord.MessageEmbed()
                .setColor(neutralColor as Discord.HexColorString)
                .setAuthor("Language")
                .setTitle(`There ${langUsers.length === 1 ? `is ${langUsers.length} user` : `are ${langUsers.length} users`} using that language at the moment.`)
                .setFooter(`Executed By ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
            if (language !== "en") embed.setDescription(users.join(", "))
            await interaction.reply({ embeds: [embed] })
        }
        else if (subCommand === "set" && language) {
            if (language === "se") language = "sv"
            const langdb = await db.collection("langdb").find().toArray(),
                langdbEntry = langdb.find(l => l.name.toLowerCase() === language)
            if (langdbEntry) language = langdbEntry.code
            if (language === "empty" && !member.roles.cache.has("764442984119795732")) language = "denied" //Discord Administrator
            fs.access(`./strings/${language}/language.json`, fs.constants.F_OK, async (err) => {
                if (!err) {
                    if (getString("changedToTitle", this.name, "en") !== getString("changedToTitle", this.name, language) || language === "en") {
                        collection.updateOne({ id: interaction.user.id }, { $set: { lang: language } }).then(async r => {
                            if (r.modifiedCount) {
                                executedBy = getString("executedBy", { user: interaction.user.tag }, "global", language)
                                const embed = new Discord.MessageEmbed()
                                    .setColor(successColor as Discord.HexColorString)
                                    .setAuthor(getString("moduleName", this.name, language))
                                    .setTitle(getString("changedToTitle", this.name, language))
                                    .setDescription(getString("credits", this.name, language))
                                    .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                                return await interaction.reply({ embeds: [embed] })
                            } else {
                                const embed = new Discord.MessageEmbed()
                                    .setColor(errorColor as Discord.HexColorString)
                                    .setAuthor(getString("moduleName", this.name, language))
                                    .setTitle(getString("didntChange", this.name, language))
                                    .setDescription(getString("alreadyThis", this.name, language))
                                    .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                                return await interaction.reply({ embeds: [embed] })
                            }
                        })
                    } else {
                        const embed = new Discord.MessageEmbed()
                            .setColor(errorColor as Discord.HexColorString)
                            .setAuthor(getString("moduleName"))
                            .setTitle(getString("didntChange"))
                            .setDescription(getString("notTranslated"))
                            .setFooter(executedBy, interaction.user.displayAvatarURL())
                        return await interaction.reply({ embeds: [embed] })
                    }
                } else {
                    await fs.readdir(stringsFolder, async (_err, files) => {
                        const emptyIndex = files.indexOf("empty")
                        if (emptyIndex > -1 && !member.roles.cache.has("764442984119795732")) files.splice(emptyIndex, 1) //Discord Administrator
                        const embed = new Discord.MessageEmbed()
                            .setColor(errorColor as Discord.HexColorString)
                            .setAuthor(getString("moduleName"))
                            .setTitle(getString("errorTitle"))
                            .setDescription(`${getString("errorDescription")}\n\`${files.join("`, `")}\`\n${getString("suggestAdd")}`)
                            .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                        await interaction.reply({ embeds: [embed] })
                    })
                }
            })
        } else {
            const files = fs.readdirSync(stringsFolder),
                emptyIndex = files.indexOf("empty")
            if (emptyIndex > -1 && !member.roles.cache.has("764442984119795732")) files.splice(emptyIndex, 1) //Discord Administrator
            const embed = new Discord.MessageEmbed()
                .setColor(neutralColor as Discord.HexColorString)
                .setAuthor(getString("moduleName"))
                .setTitle(getString("current"))
                .setDescription(`${getString("errorDescription")}\n\`${files.join("`, `")}\`\n\n${getString("credits")}`)
                .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
            await interaction.reply({ embeds: [embed] })
        }
    }
}

export default command
