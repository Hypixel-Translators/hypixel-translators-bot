import { db, DbUser } from "../../lib/dbclient"
import { crowdinVerify } from "../../lib/crowdinverify"
import { errorColor } from "../../config.json"
import Discord from "discord.js"
import { Command, client } from "../../index"

const command: Command = {
    name: "verify",
    description: "Unverifies the user.",
    usage: "+verify [profileURL]",
    aliases: ["unverify", "reverify"],
    cooldown: 3600,
    allowTip: false,
    async execute(interaction: Discord.CommandInteraction, args: string[]) {
        const verifyLogs = interaction.client.channels.cache.get("662660931838410754") as Discord.TextChannel
        const verify = interaction.client.channels.cache.get("569178590697095168") as Discord.TextChannel
        if (!interaction.member!.roles.cache.has("569194996964786178")) { //Verified
            await interaction.delete()
            interaction.channel.messages.fetch()
                .then(messages => {
                    const fiMessages = messages.filter(msgs => msgs.author === interaction.user);
                    (interaction.channel as Discord.TextChannel).bulkDelete(fiMessages)
                })
            await interaction.member!.roles.add("569194996964786178", "Manually verified through the command")
            await interaction.member!.roles.remove("756199836470214848", "Manually verified through the command"); //Add Verified and remove Alerted
            (interaction.guild!.channels.cache.get("662660931838410754") as Discord.TextChannel)!.send(`${interaction.user} manually verified themselves through the command`) //verify-logs
            client.cooldowns.get(this.name)!.delete(interaction.user.id)
        } else if (!interaction.member!.roles.cache.has("764442984119795732") || /(https:\/\/)([a-z]{2,}\.)?crowdin\.com\/profile?\/?\S{1,}/gi.test(args[0]) || !args[0]) { //Discord Administrator
            const userDb: DbUser = await db.collection("users").findOne({ id: interaction.user.id })
            if (userDb.profile || /(https:\/\/)([a-z]{2,}\.)?crowdin\.com\/profile?\/?\S{1,}/gi.test(args[0])) {
                interaction.react("798339571531382874"); //icon_working
                (interaction.client.channels.cache.get("662660931838410754") as Discord.TextChannel).send(`${interaction.user} was unverified.`) //verify-logs
                await crowdinVerify(interaction.member!, interaction.content.match(/(https:\/\/)([a-z]{2,}\.)?crowdin\.com\/profile\/\S{1,}/gi)?.[0], true)
                interaction.delete()
            } else {
                await interaction.member!.roles.remove("569194996964786178", "Unverified") // Verified
                if (!interaction.deleted) interaction.delete()
                const embed = new Discord.MessageEmbed()
                    .setColor(errorColor)
                    .setAuthor("Manual verification")
                    .setTitle("You were successfully unverified!")
                    .setDescription(`Since we didn't have your profile registered on our database, we'd like to ask you to kindly send it to us on the <#569178590697095168> channel. Please make sure your profile is public and that you have your Discord tag (${interaction.user.tag}) in your "About me" section.`)
                    .setFooter("Any messages you send here will be sent to staff.")
                interaction.user.send(embed)
                    .then(() => verifyLogs.send(`${interaction.user} tried to verify with an invalid profile URL or there was no profile stored for them.`)) //verify-logs
                    .catch(() => {
                        embed
                            .setDescription(`Since we didn't have your profile registered on our database, we'd like to ask you to kindly send it to us here. Please make sure your profile is public and that you have your Discord tag (${interaction.user.tag}) in your "About me" section.`)
                            .setFooter("")
                        verify.send(`${interaction.user} you had DMs disabled, so here's our message,`, embed) //verify
                            .then(msg => {
                                setTimeout(() => {
                                    if (!msg.deleted) msg.delete()
                                }, 30000)
                            })
                        verifyLogs.send(`${interaction.user} was unverified and had DMs off.`) //verify-logs
                    })
            }
        } else {
            if (!args[0]) throw "noUser"
            const user = args[0].replace(/[\\<>@&!]/g, "").toLowerCase()
            const member = interaction.guild!.members.cache.find(m => m.id === user || m.user.username.toLowerCase() === user || m.user.tag.toLowerCase() === user)
            if (!member) throw "falseUser"
            interaction.react("798339571531382874") //icon_working
            await crowdinVerify(member, interaction.content.match(/(https:\/\/)([a-z]{2,}\.)?crowdin\.com\/profile\/\S{1,}/gi)?.[0], false)
            interaction.delete()
        }
    }
}

export default command
