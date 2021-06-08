import { db, DbUser } from "../../lib/dbclient"
import { successColor, errorColor, neutralColor } from "../../config.json"
import Discord from "discord.js"
import { Command } from "../../index"

const command: Command = {
    name: "profile",
    description: "Gets the profile of a user",
    options: [{
        type: "USER",
        name: "user",
        description: "The user to find the profile for. Admin only.",
        required: false
    },
    {
        type: "STRING",
        name: "profile",
        description: "The new profile to set for the user. Admin only.",
        required: false
    }],
    allowTip: false,
    channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058", "551693960913879071"], // bots staff-bots bot-development admin-bots
    async execute(interaction: Discord.CommandInteraction, getString: (path: string, variables?: { [key: string]: string | number } | string, cmd?: string, lang?: string) => any) {
        const collection = db.collection("users"),
            user = interaction.options.get("user")?.user,
            profile = interaction.options.get("profile")?.value as string | undefined
        if ((interaction.member as Discord.GuildMember).roles.cache.has("764442984119795732") && user) { //Discord Administrator
            if (!profile) {
                const userDb: DbUser = await collection.findOne({ id: user?.id })
                if (userDb.profile) {
                    const embed = new Discord.MessageEmbed()
                        .setColor(neutralColor)
                        .setAuthor("Crowdin Profile")
                        .setTitle(`Here's ${user.tag}'s Crowdin profile`)
                        .setDescription(userDb.profile)
                        .setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                    return interaction.reply(embed)
                } else {
                    const embed = new Discord.MessageEmbed()
                        .setColor(errorColor)
                        .setAuthor("Crowdin Profile")
                        .setTitle(`Couldn't find ${user.tag}'s Crowdin profile on the database!`)
                        .setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                    return interaction.reply(embed)
                }
            } else {
                if (/(https:\/\/)?(www\.)?crowdin\.com\/profile\/\S{1,}/gi.test(profile)) {
                    await collection.findOneAndUpdate({ id: user.id }, { $set: { profile: profile } })
                        .then(r => {
                            if (r.value.profile !== profile) {
                                const embed = new Discord.MessageEmbed()
                                    .setColor(successColor)
                                    .setAuthor("User Profile")
                                    .setTitle(`Successfully updated ${user.tag}'s Crowdin profile!`)
                                    .addFields(
                                        { name: "Old profile", value: r.value.profile || "None" },
                                        { name: "New profile", value: profile }
                                    )
                                    .setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                                return interaction.reply(embed)
                            } else {
                                const embed = new Discord.MessageEmbed()
                                    .setColor(errorColor)
                                    .setAuthor("User Profile")
                                    .setTitle(`Couldn't update ${user.tag}'s Crowdin profile!`)
                                    .setDescription(`Their current profile is the same as the one you tried to add.`)
                                    .setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                                return interaction.reply(embed)
                            }
                        })
                } else throw "wrongLink"
            }
        } else {
            const executedBy = getString("executedBy", { user: interaction.user.tag }, "global"),
                userDb: DbUser = await collection.findOne({ id: interaction.user.id })
            if (userDb.profile) {
                const embed = new Discord.MessageEmbed()
                    .setColor(neutralColor)
                    .setAuthor(getString("moduleName"))
                    .setTitle(getString("profileSuccess"))
                    .setDescription(userDb.profile)
                    .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                return interaction.reply({ embeds: [embed], ephemeral: true })
            } else {
                const embed = new Discord.MessageEmbed()
                    .setColor(errorColor)
                    .setAuthor(getString("moduleName"))
                    .setTitle(getString("noProfile"))
                    .setDescription(getString("howStore"))
                    .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                return interaction.reply({ embeds: [embed], ephemeral: true })
            }
        }
    }
}

export default command
