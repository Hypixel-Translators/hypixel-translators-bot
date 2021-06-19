import { client, Command } from "../index"
import stats from "../events/stats"
import inactives from "../events/inactives"
import crowdin from "../events/crowdinverify"
import { listeningStatuses, watchingStatuses, playingStatuses } from "../config.json"
import Discord from "discord.js"
import { isEqual } from "lodash";

client.once("ready", async () => {
    console.log(`Logged in as ${client.user!.tag}!`)

    const publishCommand = async (command: Command) => {
        if (command.allowDM) {
            //Create a global command
            const cmd = await client.application!.commands.create(convertToDiscordCommand(command))!
            await setPermissions(cmd)
        } else {
            //Create a guild wide command
            const cmd = await client.guilds.cache.get("549503328472530974")!.commands.create(convertToDiscordCommand(command))
            await setPermissions(cmd)
        }
        console.log(`Published command ${command.name}!`)
    }

    //Only update global commands in production
    if (process.env.NODE_ENV === "production") {
        const globalCommands = await client.application!.commands.fetch()
        client.commands.filter(c => !!c.allowDM).forEach(async command => {
            if (!globalCommands) await publishCommand(command)
            else {
                const discordCommand = globalCommands.find(c => c.name === command.name)!
                //Chech if the command is published
                if (!globalCommands.some(cmd => cmd.name === command.name)) await publishCommand(command)
                else if (!commandEquals(discordCommand, command)) {
                    await discordCommand.edit(convertToDiscordCommand(command))
                    console.log(`Edited command ${command.name} since changes were found`, discordCommand, command)
                }
            }
        })
        //Delete commands that have been removed locally
        globalCommands.forEach(async command => {
            if (!client.commands.get(command.name)) await command.delete()
        })
    }
    //Set guild commands - these don't need checks since they update instantly
    client.guilds.cache.get("549503328472530974")!.commands.set(constructDiscordCommands())
        .then(commands => commands.forEach(async command => await setPermissions(command)))

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

    //Change status and run events every minute
    setInterval(async () => {
        const pickedUser = boostersStaff[Math.floor(Math.random() * boostersStaff.length)]
        const toPick = Math.ceil(Math.random() * 100) //get percentage
        // const statusType = client.user!.presence.activities[0].type

        if (toPick > 66) {
            //Higher than 66%
            const playingStatus = playingStatuses[Math.floor(Math.random() * playingStatuses.length)].replace("RANDOM_USER", pickedUser)
            client.user!.setActivity(playingStatus, { type: "PLAYING" })
        } else if (toPick <= 66 && toPick > 33) {
            //Between 33% and 66% (inclusive)
            const watchStatus = watchingStatuses[Math.floor(Math.random() * watchingStatuses.length)].replace("RANDOM_USER", pickedUser)
            client.user!.setActivity(watchStatus, { type: "WATCHING" })
        } else if (toPick <= 33 && toPick > 0) {
            //Between 0% and 33% (inclusive)
            const listenStatus = listeningStatuses[Math.floor(Math.random() * listeningStatuses.length)].replace("RANDOM_USER", pickedUser)
            client.user!.setActivity(listenStatus, { type: "LISTENING" })
        } else console.error("Couldn't set the status because the percentage is a weird number: " + toPick)

        await stats(client, false)
        await inactives(client, false)
        await crowdin(client, false)
    }, 60000)
})

async function setPermissions(command: Discord.ApplicationCommand) {
    const permissions: Discord.ApplicationCommandPermissionData[] = [],
        clientCmd = client.commands.get(command.name)!
    clientCmd.roleWhitelist?.forEach(id => {
        //Add whitelisted roles
        permissions.push({
            type: "ROLE",
            id,
            permission: true
        })
    })
    clientCmd.roleBlacklist?.forEach(id => {
        //Add blacklisted roles
        permissions.push({
            type: "ROLE",
            id,
            permission: false
        })
    })
    if (permissions.length) await command.setPermissions(permissions, "549503328472530974")
}
function constructDiscordCommands() {
    const returnCommands: Discord.ApplicationCommandData[] = []
    let clientCommands = client.commands
    if (process.env.NODE_ENV === "production") clientCommands = clientCommands.filter(cmd => !cmd.allowDM)
    clientCommands.forEach(c => returnCommands.push(convertToDiscordCommand(c)))

    return returnCommands
}

function convertToDiscordCommand(command: Command): Discord.ApplicationCommandData {
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
    isEqual(discordCommand.options, localCommand.options?.map(o => transformOption(o)) ?? [])

function transformOption(option: Discord.ApplicationCommandOptionData): Discord.ApplicationCommandOptionData {
    return {
        type: option.type,
        name: option.name,
        description: option.description,
        required: option.required,
        choices: option.choices,
        options: option.options?.map(o => transformOption(o)),
    }
}