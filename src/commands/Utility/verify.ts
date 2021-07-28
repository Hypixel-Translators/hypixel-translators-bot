import { db, DbUser } from "../../lib/dbclient"
import { crowdinVerify } from "../../lib/crowdinverify"
import { errorColor } from "../../config.json"
import Discord from "discord.js"
import { Command, client } from "../../index"

const command: Command = {
    name: "verify",
    description: "Verifies and gives you your corresponding roles",
    options: [{
        type: "STRING",
        name: "url",
        description: "The URL to your Crowdin profile. Must have your Discord tag in your \"About me\" section.",
        required: false
    },
    {
        type: "USER",
        name: "user",
        description: "The user to manually verify. Admin only",
        required: false
    }],
    cooldown: 3600,
    allowTip: false,
    async execute(interaction) {
        const verifyLogs = interaction.client.channels.cache.get("662660931838410754") as Discord.TextChannel,
            verify = interaction.client.channels.cache.get("569178590697095168") as Discord.TextChannel,
            member = interaction.member as Discord.GuildMember,
            profileUrl = interaction.options.getString("url", false),
            memberInput = interaction.options.getMember("user", false) as Discord.GuildMember | null
        if (!member.roles.cache.has("569194996964786178") && interaction.channelId == "569178590697095168" && !profileUrl) { //Verified and #verify
            (interaction.channel as Discord.TextChannel).messages.fetch()
                .then(async messages => {
                    const fiMessages = messages.filter(msgs => msgs.author.id === interaction.user.id)
                    await (interaction.channel as Discord.TextChannel).bulkDelete(fiMessages)
                })
            await member.roles.add("569194996964786178", "Manually verified through the command")
            await member.roles.remove("756199836470214848", "Manually verified through the command"); //Add Verified and remove Alerted
            await db.collection("users").updateOne({ id: member.id }, { $unset: { unverifiedTimestamp: true } });
            await db.collection("users").updateOne({ id: member.id, profile: { $exists: false } }, { $set: { profile: null } })
            await verifyLogs.send(`${interaction.user} manually verified themselves through the command`)
            client.cooldowns.get(this.name)!.delete(interaction.user.id)
            await interaction.reply({ content: "You successfully verified yourself!", ephemeral: true })
        } else if (member.roles.cache.has("764442984119795732") && memberInput) { //Discord Administrator
            if (!memberInput) throw "noUser"
            await interaction.defer({ ephemeral: true })
            await crowdinVerify(memberInput, profileUrl?.match(/(https:\/\/)([a-z]{2,}\.)?crowdin\.com\/profile\/\S{1,}/gi)?.[0], false)
            await interaction.editReply("Your request has been processed. Check the logs")
        } else {
            const userDb: DbUser = await client.getUser(interaction.user.id)
            if (userDb.profile || profileUrl && /(https:\/\/)([a-z]{2,}\.)?crowdin\.com\/profile?\/?\S{1,}/gi.test(profileUrl)) {
                await interaction.defer({ ephemeral: true });
                await db.collection("users").updateOne({ id: member.id }, { $unset: { unverifiedTimestamp: true } })
                await verifyLogs.send(`${interaction.user} is being reverified.`)
                await crowdinVerify(member, profileUrl?.match(/(https:\/\/)([a-z]{2,}\.)?crowdin\.com\/profile\/\S{1,}/gi)?.[0], true)
                await interaction.editReply("Your profile has been processed. Check your DMs.")
            } else {
                await member.roles.remove("569194996964786178", "Unverified") // Verified
                await db.collection("users").updateOne({ id: member.id }, { $set: { unverifiedTimestamp: Date.now() } })
                const embed = new Discord.MessageEmbed()
                    .setColor(errorColor as Discord.HexColorString)
                    .setAuthor("Manual verification")
                    .setTitle("You were successfully unverified!")
                    .setDescription(`Since we didn't have your profile registered on our database, we'd like to ask you to kindly send it to us on the ${verify} channel. Please make sure your profile is public and that you have your Discord tag (${interaction.user.tag}) in your "About me" section.`)
                    .setFooter("Any messages you send here will be sent to staff upon confirmation.")
                await interaction.user.send({ embeds: [embed] })
                    .then(async () => {
                        await verifyLogs.send(`${interaction.user} tried to verify with an invalid profile URL or there was no profile stored for them.`)
                        await interaction.reply({ content: "Your request was processed, check your DMs for more info!", ephemeral: true })
                    })
                    .catch(async () => {
                        embed
                            .setDescription(`Since we didn't have your profile registered on our database, we'd like to ask you to kindly send it to us here. Please make sure your profile is public and that you have your Discord tag (${interaction.user.tag}) in your "About me" section.`)
                            .setFooter("")
                        await verifyLogs.send(`${interaction.user} tried to verify with an invalid profile URL or there was no profile stored for them but they had DMs off so I couldn't tell them.`)
                        await verify.send({ content: `${interaction.user} you had DMs disabled, so here's our message:`, embeds: [embed] })
                            .then(msg => {
                                setTimeout(() => {
                                    if (!msg.deleted) msg.delete()
                                }, 30_000)
                            })
                        await interaction.reply({ content: `Your request was processed, check ${verify} for more info!`, ephemeral: true })
                    })
                client.cooldowns.get(this.name)!.delete(interaction.user.id)
            }
        }
    }
}

export default command
