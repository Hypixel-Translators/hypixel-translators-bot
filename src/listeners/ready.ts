import { client } from "../index.js"
import { execute } from "../events/stats.js"
import { execute as _execute } from "../events/inactives.js"
import { execute as __execute } from "../events/unzalgo.js"
import { listeningStatuses, watchingStatuses, playingStatuses } from "../config.json"
import Discord from "discord.js"

client.once("ready", async () => {
    console.log("Ready!")

    //Fetch channels
    client.guilds!.cache!.get("549503328472530974")!.members.fetch() //Guild members
    const serverinfo = client.channels!.cache!.get("762341271611506708")! as Discord.TextChannel
    serverinfo.messages.fetch("800415711864029204") //server-info roles message
    const verify = client.channels!.cache!.get("569178590697095168") as Discord.TextChannel
    verify.messages.fetch("787366444970541056") //verify message
    const reviewStringsChannels = client.channels.cache.filter(c => {
        const textc = c as Discord.TextChannel
        return textc.name.endsWith("review-strings")
    })
    reviewStringsChannels.forEach(c => {
        const textc = c as Discord.TextChannel; return textc.messages.fetch() 
    })

    //Get server boosters and staff for the status
    let boostersStaff: string[] = []
    client.guilds!.cache!.get("549503328472530974")!.roles!.cache!.get("644450674796396576")!.members.forEach(member => boostersStaff.push(member.user.username)) //Server Booster
    client.guilds!.cache!.get("549503328472530974")!.roles!.cache!.get("768435276191891456")!.members.forEach(member => boostersStaff.push(member.user.username)) //Discord Staff

    //Set status
    client.user!.setStatus("online").catch(console.error)
    client.user!.setActivity("+help", { type: "LISTENING" })

    //Change status and run events every minute
    setInterval(() => {
        const pickedUser = boostersStaff[Math.floor(Math.random() * boostersStaff.length)]
        const toPick = Math.ceil(Math.random() * 100) //get percentage
        // const statusType = client.user!.presence.activities[0].type

        if (toPick > 66) { //Higher than 66%
            let playingStatus = playingStatuses[Math.floor(Math.random() * playingStatuses.length)]
            playingStatus = playingStatus.replace("RANDOM_USER", pickedUser)
            client.user!.setActivity(playingStatus, { type: "PLAYING" })
        } else if (toPick <= 66 && toPick > 33) { //Between 33% and 66% (inclusive)
            let watchStatus = watchingStatuses[Math.floor(Math.random() * watchingStatuses.length)]
            watchStatus = watchStatus.replace("RANDOM_USER", pickedUser)
            client.user!.setActivity(watchStatus, { type: "WATCHING" })
        } else if (toPick <= 33 && toPick > 0) { //Between 0% and 33% (inclusive)
            let listenStatus = listeningStatuses[Math.floor(Math.random() * listeningStatuses.length)]
            listenStatus = listenStatus.replace("RANDOM_USER", pickedUser)
            client.user!.setActivity(listenStatus, { type: "LISTENING" })
        } else console.error("Couldn't set the status because the percentage is a weird number: " + toPick)

        execute(client, false)
        _execute(client, false)
        __execute(client, false)
    }, 60000)
})
