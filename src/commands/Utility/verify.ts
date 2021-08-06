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
    cooldown: 300,
    allowTip: false,
    async execute(interaction) {
        const verifyLogs = interaction.client.channels.cache.get("662660931838410754") as Discord.TextChannel,
            verify = interaction.client.channels.cache.get("569178590697095168") as Discord.TextChannel,
            member = interaction.member as Discord.GuildMember,
            profileUrl = interaction.options.getString("url", false),
            memberInput = interaction.options.getMember("user", false) as Discord.GuildMember | null,
            url = profileUrl?.match(/(https:\/\/)([a-z]{2,}\.)?crowdin\.com\/profile\/\S{1,}/gi)?.[0]
        await interaction.deferReply({ ephemeral: true });
        if (!member.roles.cache.has("569194996964786178") && interaction.channelId == "569178590697095168" && !url) { //Verified and #verify
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
            await interaction.editReply({
                content:
                    "You successfully verified yourself as a regular user! If you're a translator and didn't mean to do this, feel free to run the /verify command and make sure to include your profile URL in the `url` parameter, e.g. `/verify url:https://crowdin.com/profile/atotallyvaliduser`"
            })
        } else if (member.roles.cache.has("764442984119795732") && memberInput) { //Discord Administrator
            await verifyLogs.send({ content: `${memberInput} is being reverified (requested by ${interaction.user})`, allowedMentions: { users: [memberInput.id] } })
            await crowdinVerify(memberInput, url, false)
            await interaction.editReply("Your request has been processed. Check the logs")
        } else {
            const userDb: DbUser = await client.getUser(interaction.user.id)
            if (userDb.profile || profileUrl && /(https:\/\/)([a-z]{2,}\.)?crowdin\.com\/profile?\/?\S{1,}/gi.test(profileUrl)) {
                await db.collection("users").updateOne({ id: member.id }, { $unset: { unverifiedTimestamp: true } })
                if ((interaction.member as Discord.GuildMember).roles.cache.has("569194996964786178")) await verifyLogs.send(`${interaction.user} is being reverified.`) //Verified
                await crowdinVerify(member, url, true)
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
                        await verifyLogs.send(`${interaction.user} tried to verify with an invalid profile URL ${url ? `(<${url}>) ` : ""}or there was no profile stored for them.`)
                        await interaction.editReply({ content: "Your request has been processed, check your DMs for more info!" })
                    })
                    .catch(async () => {
                        embed
                            .setDescription(`Since we didn't have your profile registered on our database, we'd like to ask you to kindly send it to us here. Please make sure your profile is public and that you have your Discord tag (${interaction.user.tag}) in your "About me" section.`)
                            .setFooter("")
                        await verifyLogs.send(`${interaction.user} tried to verify with an invalid profile URL ${url ? `(<${url}>) ` : ""}or there was no profile stored for them but they had DMs off so I couldn't tell them.`)
                        await verify.send({ content: `${interaction.user} you had DMs disabled, so here's our message:`, embeds: [embed] })
                            .then(msg => {
                                setTimeout(async () => {
                                    if (!msg.deleted) await msg.delete()
                                }, 30_000)
                            })
                        await interaction.editReply({ content: `Your request has been processed, check ${verify} for more info!` })
                    })
                client.cooldowns.get(this.name)!.delete(interaction.user.id)
            }
        }
    }
}

export default command
