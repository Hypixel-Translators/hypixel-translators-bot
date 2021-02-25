const { client } = require("..")
const stats = require("../events/stats.js")
const inactives = require("../events/inactives.js")
const unzalgo = require("../events/unzalgo.js")
const { listeningStatuses, watchingStatuses, playingStatuses } = require("../config.json")

client.once("ready", async () => {
    console.log("Ready!")

    //Fetch channels
    client.guilds.cache.get("549503328472530974").members.fetch() //Guild members
    client.channels.cache.get("762341271611506708").messages.fetch("800415711864029204") //server-info roles message
    client.channels.cache.get("569178590697095168").messages.fetch("787366444970541056") //verify message
    const reviewStringsChannels = await client.channels.cache.filter(c => c.name.endsWith("review-strings"))
    reviewStringsChannels.forEach(c => { c.messages.fetch() })

    //Get server boosters and staff for the status
    let boostersStaff = []
    client.guilds.cache.get("549503328472530974").roles.cache.get("644450674796396576").members.forEach(member => boostersStaff.push(member.user.username)) //Server Booster
    client.guilds.cache.get("549503328472530974").roles.cache.get("768435276191891456").members.forEach(member => boostersStaff.push(member.user.username)) //Discord Staff

    //Set status
    client.user.setStatus("online").catch(console.error)
    client.user.setActivity("+help", { type: "LISTENING" })

    //Change status and run events every minute
    setInterval(() => {
        const pickedUser = boostersStaff[Math.floor(Math.random() * boostersStaff.length)]
        const toPick = Math.ceil(Math.random() * 100) //get percentage
        const statusType = client.user.presence.activities[0].type

        if (toPick > 66) { //Higher than 66%
            let playingStatus = playingStatuses[Math.floor(Math.random() * playingStatuses.length)]
            playingStatus = playingStatus.replace("RANDOM_USER", pickedUser)
            client.user.setActivity(playingStatus, { type: "PLAYING" })
        } else if (toPick <= 66 && toPick > 33) { //Between 33% and 66% (inclusive)
            let watchStatus = watchingStatuses[Math.floor(Math.random() * watchingStatuses.length)]
            watchStatus = watchStatus.replace("RANDOM_USER", pickedUser)
            client.user.setActivity(watchStatus, { type: "WATCHING" })
        } else if (toPick <= 33 && toPick > 0) { //Between 0% and 33% (inclusive)
            let listenStatus = listeningStatuses[Math.floor(Math.random() * listeningStatuses.length)]
            listenStatus = listenStatus.replace("RANDOM_USER", pickedUser)
            client.user.setActivity(listenStatus, { type: "LISTENING" })
        } else console.error("Couldn't set the status because the percentage is a weird number: " + toPick)

        stats.execute(client, false)
        inactives.execute(client, false)
        unzalgo.execute(client, false)
    }, 60000)
})
