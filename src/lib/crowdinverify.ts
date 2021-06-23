import puppeteer from "puppeteer"
import Discord from "discord.js"
import { errorColor, blurple } from "../config.json"
import { v4 } from "uuid"
import { db, DbUser } from "../lib/dbclient"

type ValidProjects = "Hypixel" | "Quickplay" | "Bot" | "SkyblockAddons"

const projectIDs: {
    [id: string]: {
        name: ValidProjects
        langRoles: boolean
    }
} = {
    "128098": { name: "Hypixel", langRoles: true },
    "369653": { name: "Quickplay", langRoles: false },
    "436418": { name: "Bot", langRoles: false },
    "369493": { name: "SkyblockAddons", langRoles: false }
},
    UsefulIDs: {
        [key: string]: Discord.Snowflake
    } = {
        Alerted: "756199836470214848",
        Verified: "569194996964786178",
        logChannel: "662660931838410754",
        verifyChannel: "569178590697095168"
    }

/**
 * Verifies a guild member with their crowdin profile and gives them the appropriate project and veteran roles, if applicable.
 * @param member The guild member to verify
 * @param url The member's Crowdin profile URL
 * @param sendDms Whether to send DMs to the member or not. Also bypasses the Discord tag check
 * @param sendLogs Whether to send logs to the log channel or not
 */
async function crowdinVerify(member: Discord.GuildMember, url?: string | null, sendDms: boolean = false, sendLogs: boolean = true) {
    const verifyLogs = member.client.channels.cache.get(UsefulIDs.logChannel) as Discord.TextChannel
    const verify = member.client.channels.cache.get(UsefulIDs.verifyChannel) as Discord.TextChannel
    const errorEmbed = new Discord.MessageEmbed()
        .setColor(errorColor)
        .setAuthor("Received message from staff")
        .setFooter("Any messages you send here will be sent to staff upon confirmation.")
    if (!url) {
        const userDb: DbUser = await db.collection("users").findOne({ id: member.id })
        url = userDb.profile
        if (userDb.profile = null) removeAllRoles(member)
        else if (!url) { //if user runs /verify and the profile is not stored on our DB or if the user sends the generic profile URL
            //#region return message
            member.roles.remove("569194996964786178", "Tried to verify but profile wasn't stored") // Verified
            await db.collection("users").updateOne({ id: member.id }, { $set: { unverifiedTimestamp: Date.now() } })
            errorEmbed
                .setDescription("Hey there! We noticed you tried to send us your Crowdin profile but the link you sent was invalid. This may have happened because you either typed the wrong name in the link or you sent us the generic Crowdin profile link. If you don't know how to obtain the profile URL, make sure it follows the format `https://crowdin.com/profile/<username>` and replace <username> with your username like shown below.\n\nIf you have any questions, be sure to send them to us!")
                .setImage("https://i.imgur.com/7FVOSfT.png")
            if (sendDms) member.send({ embeds: [errorEmbed] })
                .then(async () => await verifyLogs.send(`${member} sent the wrong profile link. Let’s hope they work their way around with the message I just sent them.`))
                .catch(async () => {
                    errorEmbed.setFooter("This message will be deleted in a minute")
                    await verify.send({ content: `${member} you had DMs disabled, so here's our message,`, embeds: [errorEmbed] })
                        .then(msg => {
                            setTimeout(() => {
                                if (!msg.deleted) msg.delete()
                            }, 60000)
                        })
                    await verifyLogs.send(`${member} sent the wrong profile link. Let’s hope they work their way around with the message I just sent in <#${UsefulIDs.verifyChannel}> since they had DMs off.`)
                })
            else await verifyLogs.send(`The profile stored/provided for ${member} was invalid. Please fix this or ask them to fix this.`)
            return
            //#endregion
        }
    }
    url = url!.toLowerCase().replace(/([a-z]{1,4}[.])?(crowdin[.]com)/gi, "$2")
    const browser = await getBrowser(),
        page = await browser.pupBrowser.newPage()
    try {
        await page.goto(url, { timeout: 10000 })
        await page.waitForSelector(".project-name", { timeout: 10000 })
    } catch { //if no projects are available
        const isPrivate = await page.$(".private-profile") !== null,
            isValid = await page.$(".project-list-container") !== null
        /*
        Possible scenarios:
        private profile: isPrivate = true && isValid = false
        public profile with no projects: isPrivate = false && isValid = true
        404 page: isPrivate = false && isValid = false 
        */
        await page.close()
        closeConnection(browser.uuid)
        if (!isPrivate && !isValid) { //if profile leads to a 404 page
            //#region return message
            member.roles.remove("569194996964786178", "Tried to verify with an invalid URL") // Verified
            await db.collection("users").updateOne({ id: member.id }, { $set: { unverifiedTimestamp: Date.now() } })
            errorEmbed
                .setDescription("Hey there! We noticed you tried to send us your Crowdin profile but the link you sent was invalid. This may have happened because you either typed the wrong name in the link or you sent us the generic Crowdin profile link. If you don't know how to obtain the profile URL, make sure it follows the format `https://crowdin.com/profile/<username>` and replace <username> with your username like shown below.\n\nIf you have any questions, be sure to send them to us!")
                .setImage("https://i.imgur.com/7FVOSfT.png")
            if (sendDms) member.send({ embeds: [errorEmbed] })
                .then(async () => await verifyLogs.send(`${member} sent the wrong profile link. Let’s hope they work their way around with the message I just sent them.`))
                .catch(async () => {
                    errorEmbed.setFooter("This message will be deleted in a minute")
                    await verify.send({ content: `${member} you had DMs disabled, so here's our message,`, embeds: [errorEmbed] })
                        .then(msg => {
                            setTimeout(() => {
                                if (!msg.deleted) msg.delete()
                            }, 60000)
                        })
                    await verifyLogs.send(`${member} sent the wrong profile link. Let’s hope they work their way around with the message I just sent in <#${UsefulIDs.verifyChannel}> since they had DMs off.`)
                })
            else if (sendLogs) await verifyLogs.send(`The profile stored/provided for ${member} was invalid. Please fix this or ask them to fix this.`)
            else {
                await verifyLogs.send(`${member}'s profile seems to be invalid: <${url}>\nIf it is, please remove it from the database, otherwise ignore this message or maybe even delete it.`)
            }
            //#endregion
        } else if (sendLogs && isPrivate) { //if the profile is private
            //#region return message
            member.roles.remove("569194996964786178", "Tried to verify with a private profile") // Verified
            await db.collection("users").updateOne({ id: member.id }, { $set: { unverifiedTimestamp: Date.now() } })
            errorEmbed
                .setDescription(`Hey there! We noticed you sent us your Crowdin profile, however, it was private so we couldn't check it. Please make it public, at least until you get verified, and send us your profile again on the channel. If you don't know how to, then go to your Crowdin profile settings (found [here](https://crowdin.com/settings#account)) and make sure the "Private Profile" setting is turned off (see the image below)\n\nIf you have any questions, be sure to send them to us!`)
                .setImage("https://i.imgur.com/YX8VLeu.png")
            if (sendDms) member.send({ embeds: [errorEmbed] })
                .then(async () => await verifyLogs.send(`${member}'s profile was private, I let them know about that.`))
                .catch(async () => {
                    errorEmbed.setFooter("This message will be deleted in a minute")
                    await verify.send({ content: `${member} you had DMs disabled, so here's our message,`, embeds: [errorEmbed] })
                        .then(msg => {
                            setTimeout(() => {
                                if (!msg.deleted) msg.delete()
                            }, 60000)
                        })
                    await verifyLogs.send(`${member}'s profile was private, I let them know about that in <#${UsefulIDs.verifyChannel}> since they had DMs off.`)
                })
            else await verifyLogs.send(`${member}'s profile is private. Please ask them to change this.`)
            //#endregion
        } else {
            const dmEmbed = new Discord.MessageEmbed()
                .setColor(blurple)
                .setAuthor("Received message from staff")
                .setDescription(`Hey there!\nYou have successfully verified your Crowdin account!\nSadly you didn't receive any roles because you don't translate for any of the projects we currently support.\nWhen you have started translating you can refresh your roles by running \`/verify\`\nIf you wanna know more about all the projects we currently support, run \`/projects\` here.`)
                .setFooter("Any messages you send here will be sent to staff upon confirmation."),
                logEmbed = new Discord.MessageEmbed()
                    .setColor(blurple)
                    .setTitle(`${member.user.tag} is now verified!`)
                    .setDescription(`${member} has not received any roles. They do not translate for any of the projects.`)
                    .addField("Profile", url)
            if (sendDms) member.send({ embeds: [dmEmbed] })
                .then(async () => await verifyLogs.send({ embeds: [logEmbed] }))
                .catch(async () => {
                    logEmbed.setFooter("Message not sent because user had DMs off")
                    await verifyLogs.send({ embeds: [logEmbed] })
                })
            else if (sendLogs) await verifyLogs.send({ embeds: [logEmbed] })
        }
        return
    }
    const userAboutSelector = await page.$(".user-about"),
        aboutContent = await page.evaluate(element => element?.textContent, userAboutSelector) ?? "" as string
    let projects: CrowdinProject[] | null = null
    page.on("console", msg => console.log(msg.text()))
    if (aboutContent.includes(member.user.tag) || !sendDms) projects = await page.evaluate((tag: string) => {
        const now = Date.now()
        let returnProjects = window.eval("crowdin.profile_projects.view.state.projects") as CrowdinProject[] | null
        if (returnProjects) return returnProjects
        console.log(`Projects were null for ${tag}, attempting to re-evaluate.`)
        window.eval("crowdin.profile_projects.getProjectsInfo()")
        let i = 0
        while (returnProjects === null && i < 100) {
            returnProjects = window.eval("crowdin.profile_projects.view.state.projects")
            i++
        }
        console.log(`✅ Successfully fetched ${tag}'s profile after ${i} tries! Took ${Date.now() - now}ms`)
        return returnProjects
    }, member.user.tag)
    await page.close()
    await closeConnection(browser.uuid)

    if (!projects) {
        //#region return message
        await member.roles.remove("569194996964786178", "Tried to verify with no Discord tag") // Verified
        await db.collection("users").updateOne({ id: member.id }, { $set: { unverifiedTimestamp: Date.now() } })
        errorEmbed
            .setDescription(`Hey there!\nWe noticed you sent us your Crowdin profile, however, you forgot to add your Discord tag to it! Just add ${member.user.tag} to your about section like shown in the image below. Once you've done so, send us the profile link again.\n\nIf you have any questions, be sure to send them to us!`)
            .setImage("https://i.imgur.com/BM2bJ4W.png")
        if (sendDms) await member.send({ embeds: [errorEmbed] })
            .then(async () => await verifyLogs.send(`${member} forgot to add their Discord to their profile. Let's hope they fix that with the message I just sent them.`))
            .catch(async () => {
                errorEmbed.setFooter("This message will be deleted in a minute")
                await verify.send({ content: `${member} you had DMs disabled, so here's our message,`, embeds: [errorEmbed] })
                    .then(msg => {
                        setTimeout(async () => {
                            if (!msg.deleted) await msg.delete()
                        }, 60000)
                    })
                await verifyLogs.send(`${member} forgot to add their Discord to their profile. Let's hope they fix that with the message I just sent them.`)
            })
        return
        //#endregion
    }

    var highestLangRoles: {
        [name: string]: {
            type: string
            projects: ValidProjects[]
        }
    } = {},
        highestProjectRoles: {
            [name: string]: string
        } = {},
        veteranRole: Discord.Role | undefined //yes we have to use var here
    const joinedProjects: string[] = []

    projects
        .filter(project => Object.keys(projectIDs).includes(project.id) && project.user_role !== "pending")
        .forEach(async project => {
            joinedProjects.push(projectIDs[project.id].name)

            const role = project.contributed_languages?.length
                ? project.contributed_languages.map(lang => {
                    return {
                        lang: lang.code,
                        role: lang.user_role.name
                    }
                })
                : [{ role: project.user_role }]
            let highestRole = "Translator"
            role.forEach(role => {
                if (role.role !== "Translator") {
                    if (role.role !== "Manager") highestRole = role.role
                    if (highestRole === "manager" || highestRole === "owner") highestRole = "Manager"
                }
            })
            highestProjectRoles[projectIDs[project.id].name] = highestRole

            updateProjectRoles(projectIDs[project.id].name, member, project)
            if (projectIDs[project.id].langRoles)
                project.contributed_languages?.forEach(lang => {
                    if (highestLangRoles[lang.code] && highestLangRoles[lang.code].type !== "Proofreader" && lang.user_role?.name === "Proofreader") {
                        highestLangRoles[lang.code].type = "Proofreader"
                        highestLangRoles[lang.code].projects.push(projectIDs[project.id].name)
                    } else if (!highestLangRoles[lang.code] && lang.user_role)
                        highestLangRoles[lang.code] = {
                            type: lang.user_role.name,
                            projects: [projectIDs[project.id].name]
                        }
                })
            if (project.id == "128098") veteranRole = await veteranMedals(member, project) // Hypixel project
        })

    updateLanguageRoles(highestLangRoles, member)
    Object.values(projectIDs)
        .map(i => i.name)
        .filter(pj => !joinedProjects.includes(pj))
        .forEach(project => checkProjectRoles(project, member))

    await member.roles.remove(UsefulIDs.Alerted, "User is now Verified")
    await member.roles.add(UsefulIDs.Verified, "User is now Verified")
    await db.collection("users").updateOne({ id: member.id }, { $set: { profile: url } })

    const endingMessageProjects: {
        [name: string]: Discord.Role[]
    } = {}
    for (const [key, value] of Object.entries(highestProjectRoles)) {
        const role = member.guild!.roles.cache.find(r => r.name === `${key} ${value}`)!
        endingMessageProjects[key] = [role]
    }

    const coll = db.collection("langdb")
    for (const [key, value] of Object.entries(highestLangRoles)) {
        const lang = (await coll.findOne({ id: key })).name
        value.projects.forEach(p => {
            const role = member.guild!.roles.cache.find(r => r.name === `${lang} ${value.type}`)!
            endingMessageProjects[p].push(role)
        })
    }
    const logEmbed = new Discord.MessageEmbed()
        .setColor(blurple)
        .setTitle(`${member.user.tag} is now verified!`)
        .setDescription(Object.keys(endingMessageProjects).length
            ? `${member} has received the following roles:`
            : `${member} has not received any roles. They do not translate for any of the projects.`)

    if (Object.keys(endingMessageProjects).length) {
        for (const [k, v] of Object.entries(endingMessageProjects)) {
            logEmbed.addField(k, v.join(",\n"))
        }
    }

    if (veteranRole) logEmbed.addField("Veteran role", `${veteranRole}`)
    logEmbed.addField("Profile", url)

    //#region return message
    const dmEmbed = new Discord.MessageEmbed()
        .setColor(blurple)
        .setAuthor("Received message from staff")
        .setDescription(`Hey there!\nYou have successfully verified your Crowdin account${Object.keys(endingMessageProjects).length
            ? " and you also received the corresponding roles on our Discord server! Make sure to check out <#699275092026458122> if you want to learn more about Crowdin." //getting-started
            : "!\nSadly you didn't receive any roles because you don't translate for any of the projects we currently support.\nWhen you have started translating you can refresh your roles by running `/verify`"
            }\nIf you wanna know more about all the projects we currently support, run \`/projects\` here.`)
        .setFooter("Any messages you send here will be sent to staff upon confirmation.")

    if (sendDms) member.send({ embeds: [dmEmbed] })
        .then(async () => await verifyLogs.send({ embeds: [logEmbed] }))
        .catch(async () => {
            logEmbed.setFooter("Message not sent because user had DMs off")
            await verifyLogs.send({ embeds: [logEmbed] })
        })
    else if (sendLogs) await verifyLogs.send({ embeds: [logEmbed] })
    //#endregion
}

export { crowdinVerify }

async function updateProjectRoles(projectName: ValidProjects, member: Discord.GuildMember, project: CrowdinProject) {
    const languages = project.contributed_languages?.length
        ? project.contributed_languages.map(lang => {
            return {
                lang: lang.code,
                role: lang.user_role.name
            }
        })
        : [{ role: project.user_role }],
        addedProjectRoles = []

    member.roles.cache.forEach(role => {
        if (role.name.includes("Translator") || role.name.includes("Proofreader")) addedProjectRoles.push(role.name)
    })

    let highestRole = "Translator"
    languages.forEach(language => {
        if (language.role !== "Translator") {
            if (language.role !== "Manager") highestRole = language.role
            if (highestRole === "manager" || highestRole === "owner") highestRole = "Manager"
        }
    })

    const projectTransRole = member.guild.roles.cache.find(r => r.name === `${projectName} Translator`)!.id,
        projectProofRole = member.guild.roles.cache.find(r => r.name === `${projectName} Proofreader`)!.id,
        projectManagerRole = member.guild.roles.cache.find(r => r.name === `${projectName} Manager`)!.id

    if (highestRole === "Translator") {
        await member.roles.remove(projectProofRole, "User no longer has this role on Crowdin")

        await member.roles.remove(projectManagerRole, "User no longer has this role on Crowdin")

        await member.roles.add(projectTransRole, "User has received this role on Crowdin")
    } else if (highestRole === "Proofreader") {
        await member.roles.remove(projectTransRole, "User no longer has this role on Crowdin")

        await member.roles.remove(projectManagerRole, "User no longer has this role on Crowdin")

        await member.roles.add(projectProofRole, "User has received this role on Crowdin")
    } else {
        await member.roles.remove(projectTransRole, "User no longer has this role on Crowdin")

        await member.roles.remove(projectProofRole, "User no longer has this role on Crowdin")

        await member.roles.add(projectManagerRole, "User has received this role on Crowdin")
    }
}

async function updateLanguageRoles(
    highestLangRoles: {
        [name: string]: {
            type: string
            projects: ValidProjects[]
        }
    },
    member: Discord.GuildMember
) {
    const coll = db.collection("langdb"),
        activeRoles: string[] = [],
        addedRoles: string[] = []

    for (const [k, v] of Object.entries(highestLangRoles)) {
        activeRoles.push(`${(await coll.findOne({ id: k })).name} ${v.type}`)
    }

    member.roles.cache.forEach(role => {
        if (role.name.includes("Translator") || role.name.includes("Proofreader")) addedRoles.push(role.name)
    })

    activeRoles
        .filter(pj => !addedRoles.includes(pj))
        .forEach(async p => {
            await member.roles.add(member.guild.roles.cache.find(r => r.name === p)!.id, "User has received this role on Crowdin")
        })

    addedRoles
        .filter(r => !activeRoles.includes(r))
        .filter(pj => {
            const exclude = Object.values(projectIDs).map(i => i.name)
            let included = true
            for (let i = 0; i < exclude.length; i++) {
                if (pj.includes(exclude[i])) included = false
            }
            return included
        })
        .forEach(async role => {
            await member.roles.remove(member.guild.roles.cache.find(r => r.name === role)!.id, "User no longer has this role on Crowdin")
        })
}

async function checkProjectRoles(projectName: ValidProjects, member: Discord.GuildMember) {
    const projectTransRole = member.guild.roles.cache.find(r => r.name === `${projectName} Translator`)!.id,
        projectProofRole = member.guild.roles.cache.find(r => r.name === `${projectName} Proofreader`)!.id,
        projectManagerRole = member.guild.roles.cache.find(r => r.name === `${projectName} Manager`)!.id

    await member.roles.remove(projectTransRole, "User is no longer in this Crowdin project")

    await member.roles.remove(projectProofRole, "User is no longer in this Crowdin project")

    await member.roles.remove(projectManagerRole, "User is no longer in this Crowdin project")
}

async function veteranMedals(member: Discord.GuildMember, project: CrowdinProject) {
    const medals = ["👻", "🥇", "🥈", "🥉", "🏅", "🎖️", "🏆", "💎", "💠", "⭐", "🌟", "👑"],
        years = Math.floor((Date.now() - project.joined_at_timestamp * 1000) / (1000 * 60 * 60 * 24 * 365))
    if (years == 0) return

    let role = member.guild.roles.cache.find(r => r.name.includes(`${years == 1 ? `${years} Year` : `${years} Years`} Veteran`))
    if (!medals[years]) throw "We've ran out of veteran medals!"
    if (!role) role = await member.guild.roles.create(
        {
            name: `${medals[years]} ${years == 1 ? `${years} Year` : `${years} Years`} Veteran`,
            position: member.guild.roles.cache.filter(r => r.name.includes(" Veteran")).sort((a, b) => b.position - a.position).first()!.position + 1,
            reason: "New veteran role!"
        }
    )
    if (role.name !== `${medals[years]} ${years == 1 ? `${years} Year` : `${years} Years`} Veteran`) role.setName(`${medals[years]} ${years == 1 ? `${years} Year` : `${years} Years`} Veteran`, "The name was wrong for some reason")
    member.roles.cache.filter(r => r.name.includes(`${years - 1 == 1 ? `${years - 1} Year` : `${years - 1} Years`} Veteran`))
        .forEach(async oldRole => {
            if (oldRole.id !== role!.id) await member.roles.remove(role!, "Giving a new Veteran role") //why tf does this throw an error without the !
        })

    member.roles.add(role, `Been in the Hypixel project for ${years == 1 ? `${years} year` : `${years} years`}`)
    return role
}

function removeAllRoles(member: Discord.GuildMember) {
    const roles = member.roles.cache.filter(r =>
        r.name.endsWith(" Translator") ||
        r.name.endsWith(" Proofreader") ||
        r.name.endsWith(" Manager") ||
        r.name.endsWith(" Veteran")
    )
    roles.forEach(async role => await member.roles.remove(role))
}

let browser: puppeteer.Browser | null = null,
    interval: NodeJS.Timeout | null = null,
    lastRequest = 0,
    activeConnections: string[] = [],
    browserClosing = false,
    browserOpening = false

/**
 * Returns the browser and a connection ID.
 */
async function getBrowser() {
    //* If browser is currently closing wait for it to fully close.
    await new Promise<void>((resolve) => {
        let timer = setInterval(() => {
            if (!browserClosing) {
                clearInterval(timer)
                resolve()
            }
        }, 100)
    })

    lastRequest = Date.now()

    //* Open a browser if there isn't one already.
    await new Promise<void>((resolve) => {
        let timer = setInterval(() => {
            if (!browserOpening) {
                clearInterval(timer)
                resolve()
            }
        }, 100)
    })
    if (!browser) {
        browserOpening = true
        browser = await puppeteer.launch({
            args: ["--no-sandbox"],
            headless: process.env.NODE_ENV === "production" || process.platform === "linux"
        })
        browserOpening = false
    }

    //* Add closing interval if there isn't one already.
    if (!interval) {
        interval = setInterval(async () => {
            if (lastRequest < Date.now() - 15 * 60 * 1000) {
                await browser!.close()
                browser = null
                clearInterval(interval!)
                interval = null
            }
        }, 5000)
    }

    //* Open new connection and return the browser with connection id.
    const browserUUID = v4()
    activeConnections.push(browserUUID)
    return { pupBrowser: browser, uuid: browserUUID }
}

/**
 * Close connection, and close browser if there are no more connections.
 * @param uuid The connection ID
 */
async function closeConnection(uuid: string) {
    //* Check if connection exists. If it does remove connection from connection list.
    const index = activeConnections.indexOf(uuid)
    if (index > -1) activeConnections.splice(index, 1)

    //* Close browser if connection list is empty.
    if (!activeConnections.length) {
        browserClosing = true
        await browser!.close()
        browser = null
        clearInterval(interval!)
        interval = null
        browserClosing = false
    }
}

interface CrowdinProject {
    id: string
    name: string
    identifier: string
    join_policy: string
    last_activity: string
    created_at_timestamp: number
    last_activity_timestamp: number
    joined_at_timestamp: number
    last_seen_timestamp: number
    user_role: string
    contributed_languages?: {
        name: string
        code: string
        organization_id?: any
        url: string
        user_role: {
            alias: string
            name: string
        }
    }[]
}
