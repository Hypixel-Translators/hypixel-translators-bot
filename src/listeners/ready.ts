import { client, Command } from "../index.js"
import stats from "../events/stats"
import inactives from "../events/inactives"
import crowdin from "../events/crowdinverify"
import { listeningStatuses, watchingStatuses, playingStatuses } from "../config.json"
import Discord from "discord.js"
import { isEqual } from "lodash"

client.once("ready", async () => {
    console.log(`Logged in as ${client.user!.tag}!`)

    const publishCommand = async (command: Command) => {
        if (command.allowDM) {
            //Create a global command
            await client.application?.commands.create(convertToDiscordCommand(command))
        } else {
            //Create a guild wide command
            const cmd = await client.guilds.cache.get("549503328472530974")!.commands.create(convertToDiscordCommand(command))
            const permissions: Discord.ApplicationCommandPermissionData[] = []
            command.roleWhitelist?.forEach(id => {
                //Add whitelisted roles
                permissions.push({
                    type: "ROLE",
                    id,
                    permission: true
                })
            })
            command.roleBlacklist?.forEach(id => {
                //Add blacklisted roles
                permissions.push({
                    type: "ROLE",
                    id,
                    permission: false
                })
            })
            if (permissions.length) await cmd.setPermissions(permissions)
        }
        console.log(`Published command ${command.name}!`)
    }

    //Only update global commands in production
    //TODO add check to delete commands that have been removed
    if (process.env.NODE_ENV === "production") {
        const globalCommands = await client.application!.commands.fetch()
        if (!globalCommands)
            client.commands.filter(c => !!c.allowDM).forEach(async command => await publishCommand(command))
        else
            client.commands.forEach(async (command: Command) => {
                const discordCommand = globalCommands.find(c => c.name == command.name)!
                //Chech if the command is published
                if (!globalCommands.some(cmd => cmd.name === command.name)) await publishCommand(command)
                else if (!commandEquals(discordCommand, command)) {
                    discordCommand.edit(convertToDiscordCommand(command))
                    console.log(`Edited command ${command.name} since changes were found`)
                }
            })
        const guildCommands = await client.guilds.cache.get("549503328472530974")!.commands.fetch()
        if (!guildCommands) client.commands.filter(c => !c.allowDM).forEach(async command => await publishCommand(command))
        else client.guilds.cache.get("549503328472530974")!.commands.set(constructDiscordCommands())
    } else {
        client.guilds.cache.get("549503328472530974")!.commands.set(constructDiscordCommands())
            .then(commands =>
                commands.forEach(async cmd => {
                    const permissions: Discord.ApplicationCommandPermissionData[] = [],
                        command = client.commands.get(cmd.name)!
                    command.roleWhitelist?.forEach(id => {
                        //Add whitelisted roles
                        permissions.push({
                            type: "ROLE",
                            id,
                            permission: true
                        })
                    })
                    command.roleBlacklist?.forEach(id => {
                        //Add blacklisted roles
                        permissions.push({
                            type: "ROLE",
                            id,
                            permission: false
                        })
                    })
                    if (permissions.length) await cmd.setPermissions(permissions)
                })
            )
    }

    //Get server boosters and staff for the status
    let boostersStaff: string[] = []
    client.guilds.cache
        .get("549503328472530974")
        ?.roles.cache.get("644450674796396576")!
        .members.forEach(member => boostersStaff.push(member.user.username)) //Server Booster
    client.guilds.cache
        .get("549503328472530974")
        ?.roles.cache.get("768435276191891456")!
        .members.forEach(member => boostersStaff.push(member.user.username)) //Discord Staff

    //Set status
    client.user!.setPresence({
        status: process.env.NODE_ENV === "dev" ? "dnd" : "online",
        activities: [{ name: "+help", type: "LISTENING" }]
    })

    //Change status and run events every minute
    setInterval(() => {
        const pickedUser = boostersStaff[Math.floor(Math.random() * boostersStaff.length)]
        const toPick = Math.ceil(Math.random() * 100) //get percentage
        // const statusType = client.user!.presence.activities[0].type

        if (toPick > 66) {
            //Higher than 66%
            let playingStatus = playingStatuses[Math.floor(Math.random() * playingStatuses.length)]
            playingStatus = playingStatus.replace("RANDOM_USER", pickedUser)
            client.user!.setActivity(playingStatus, { type: "PLAYING" })
        } else if (toPick <= 66 && toPick > 33) {
            //Between 33% and 66% (inclusive)
            let watchStatus = watchingStatuses[Math.floor(Math.random() * watchingStatuses.length)]
            watchStatus = watchStatus.replace("RANDOM_USER", pickedUser)
            client.user!.setActivity(watchStatus, { type: "WATCHING" })
        } else if (toPick <= 33 && toPick > 0) {
            //Between 0% and 33% (inclusive)
            let listenStatus = listeningStatuses[Math.floor(Math.random() * listeningStatuses.length)]
            listenStatus = listenStatus.replace("RANDOM_USER", pickedUser)
            client.user!.setActivity(listenStatus, { type: "LISTENING" })
        } else console.error("Couldn't set the status because the percentage is a weird number: " + toPick)

        stats(client, false)
        inactives(client, false)
        crowdin(client, false)
    }, 60000)
})

const constructDiscordCommands = () => {
    const returnCommands: Discord.ApplicationCommandData[] = []
    let clientCommands = client.commands
    if (process.env.NODE_ENV !== "dev") clientCommands = clientCommands.filter(cmd => !cmd.allowDM)
    clientCommands.forEach(c => returnCommands.push(convertToDiscordCommand(c)))

    return returnCommands
}

const convertToDiscordCommand = (command: Command): Discord.ApplicationCommandData => {
    return {
        name: command.name,
        description: command.description,
        defaultPermission: command.roleWhitelist ? false : true,
        options: command.options
    }
}

const commandEquals = (discordCommand: Discord.ApplicationCommand, localCommand: Command) =>
    discordCommand.name === localCommand.name &&
    discordCommand.description === localCommand.description &&
    isEqual(discordCommand.options, localCommand.options)
