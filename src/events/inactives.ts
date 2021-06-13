import { db, DbUser, HTBClient } from "../lib/dbclient"
import Discord from "discord.js"

async function execute(client: HTBClient, manual: boolean) {
    const d = new Date()
    const h = d.getUTCHours()
    const m = d.getUTCMinutes()
    if ((h == 2 && m == 0) || manual) {
        await check(client)
    }
}

async function check(client: HTBClient) {
    const alert = new Date().getTime() - (7 * 24 * 60 * 60 * 1000)
    //Get date 7 days ago                 d    h    m    s     ms
    const verify = new Date().getTime() - (14 * 24 * 60 * 60 * 1000)
    //Get date 14 days ago                  d    h    m    s     ms

    client.guilds.cache.get("549503328472530974")!.roles.cache.get("549503328472530974")!.members.forEach(async member => { //Get all members from the cache
        if (member.roles.cache.has("569194996964786178") || member.user.bot) return //Verified
        await client.guilds.cache.get("549503328472530974")!.members.fetch(member.id) //fetch the member
        const verifyLogs = client.channels.cache.get("662660931838410754") as Discord.TextChannel,
            userDb: DbUser = await db.collection("users").findOne({ id: member.id })
        if (member.roles.cache.has("756199836470214848")) { //Alerted
            if (Number(userDb.unverifiedTimestamp) <= verify || member.joinedTimestamp! <= verify) {
                //await member.send("You stood in the verify channel for too long and, because of that, you were kicked for inactivity. If you wish to join back, feel free to do so at https://discord.gg/rcT948A")
                member.send("You stood in the verify channel for too long and, because of that, you have been automatically verified as a player. If you're a translator and wish to receive your roles, please execute `+reverify <profileURL>` replacing <profileURL> with the URL to your Crowdin profile.")
                    .then(async () => {
                        //await verifyLogs.send(`**${member.user.tag}** has been kicked for inactivity.`)
                        //console.log(`Kicked ${member.user.tag} for inactivity`)
                        await verifyLogs.send(`${member} has been automatically verified after staying on the server for 2 weeks.`)
                        console.log(`Automatically verified ${member.user.tag} after 2 weeks`)
                    })
                    .catch(async () => {
                        await verifyLogs.send(`Automatically verified ${member} after 2 weeks but couldn't send them a DM with the reason.`)
                        console.error(`Automatically verified ${member.user.tag} after 2 weeks but couldn't DM them`)
                    })
                //member.kick("Stood on the server for 14 days without verifying")
                await member.roles.add("569194996964786178", "Automatically verified after 2 weeks") //Add Verified
                await member.roles.remove("756199836470214848", "Automatically verified after 2 weeks") //Remove Alerted
                await db.collection("users").updateOne({ id: member.id }, { $unset: { unverifiedTimestamp: true } });
            }
        } else if (Number(userDb.unverifiedTimestamp) <= alert || member.joinedTimestamp! <= alert) {
            member.send("Hey there!\nWe noticed you haven't verified yourself on our server. Are you having any trouble? Please message an administrator or just ask any questions in the <#569178590697095168> channel! Otherwise, please send your profile link like shown in the channel.\n\nThis message was sent to you because you have been on our server for too long, and you're in risk of getting kicked for inactivity soon.\nAny messages you send here will be sent to staff upon confirmation.") //verify
                .then(async () => {
                    await verifyLogs.send(`Sent an alert to ${member} as they've been in the server for 7 days without verifying.`)
                    console.log(`Alerted ${member.user.tag} for inactivity`)
                })
                .catch(async () => {
                    await verifyLogs.send(`Tried to send an alert to ${member} as they've been stood in the server for 7 days without verifying, but they had private messages disabled from this server.`)
                    console.error(`Tried to alert ${member.user.tag} but they had DMs disabled.`)
                })
            await member.roles.add("756199836470214848", "Stood on the server for 7 days without verifying")
        }
    })
}

export default execute
