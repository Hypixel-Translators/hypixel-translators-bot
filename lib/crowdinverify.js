const puppeteer = require("puppeteer"),
    Discord = require("discord.js"),
    { v4 } = require("uuid"),
    { getDb } = require("./mongodb"),
    { neutralColor, errorColor } = require("./../config.json")

const projectIDs = {
    128098: { name: "Hypixel", langRoles: true },
    369653: { name: "Quickplay", langRoles: true },
    436418: { name: "Bot", langRoles: false },
    369493: { name: "SkyblockAddons", langRoles: false }
},
    UsefulIDs = {
        Alerted: "756199836470214848",
        Verified: "569194996964786178",
        logChannel: "662660931838410754",
        verifyChannel: "569178590697095168"
    }

async function crowdinVerify(member, url, sendDms) {
    const errorEmbed = new Discord.MessageEmbed()
        .setColor(errorColor)
        .setAuthor("Received message from staff")
        .setFooter("Any messages you send here will be sent to staff.")
    if (!url) {
        const userDb = await getDb().collection("users").findOne({ id: member.id })
        url = userDb.profile
        if (!url) { //if user runs +reverify and the profile is not stored on our DB
            errorEmbed
                .setDescription("Hey there! We noticed you tried to send us your Crowdin profile but the link you sent was invalid. This may have happened because you either typed the wrong name in the link or you sent us the generic Crowdin profile link. If you don't know how to obtain the profile URL, make sure it follows the format `https://crowdin.com/profile/<username>` and replace <username> with your username like shown below.\n\nIf you have any questions, be sure to send them to us!")
                .setImage("https://i.imgur.com/7FVOSfT.png")
            if (sendDms) member.send(errorEmbed)
                .then(() => member.client.channels.cache.get(UsefulIDs.logChannel).send(`${member} sent the wrong profile link. Let’s hope they work their way around with the message I just sent them.`))
                .catch(() => {
                    errorEmbed.setFooter("")
                    member.client.channels.cache.get(UsefulIDs.verifyChannel).send(`${member} you had DMs disabled, so here's our message,`, errorEmbed)
                        .then(msg => {
                            setTimeout(() => {
                                if (!msg.deleted) msg.delete()
                            }, 30000)
                        })
                    member.client.channels.cache.get(UsefulIDs.logChannel).send(`${member} sent the wrong profile link. Let’s hope they work their way around with the message I just sent in <#${UsefulIDs.verifyChannel}> since they had DMs off.`)
                })
            else member.client.channels.cache.get(UsefulIDs.logChannel).send(`The profile stored/provided for ${member} was invalid. Please fix this or ask them to fix this.`)
            return
        }
    }
    const browser = await getBrowser(),
        page = await browser.pupBrowser.newPage()
    try {
        await page.goto(url, { timeout: 10000 })
        await page.waitForSelector(".project-name", { timeout: 10000 })
    } catch { //If no projects are available
        const eval = await page.evaluate(() => {
            return document.querySelector(".private-profile") !== null //check if the profile is private
        })
        await page.close()
        closeConnection(browser.uuid)
        if (!eval) { //if profile leads to a 404 page
            errorEmbed
                .setDescription("Hey there! We noticed you tried to send us your Crowdin profile but the link you sent was invalid. This may have happened because you either typed the wrong name in the link or you sent us the generic Crowdin profile link. If you don't know how to obtain the profile URL, make sure it follows the format `https://crowdin.com/profile/<username>` and replace <username> with your username like shown below.\n\nIf you have any questions, be sure to send them to us!")
                .setImage("https://i.imgur.com/7FVOSfT.png")
            if (sendDms) member.send(errorEmbed)
                .then(() => member.client.channels.cache.get(UsefulIDs.logChannel).send(`${member} sent the wrong profile link. Let’s hope they work their way around with the message I just sent them.`))
                .catch(() => {
                    errorEmbed.setFooter("")
                    member.client.channels.cache.get(UsefulIDs.verifyChannel).send(`${member} you had DMs disabled, so here's our message,`, errorEmbed)
                        .then(msg => {
                            setTimeout(() => {
                                if (!msg.deleted) msg.delete()
                            }, 30000)
                        })
                    member.client.channels.cache.get(UsefulIDs.logChannel).send(`${member} sent the wrong profile link. Let’s hope they work their way around with the message I just sent in <#${UsefulIDs.verifyChannel}> since they had DMs off.`)
                })
            else member.client.channels.cache.get(UsefulIDs.logChannel).send(`The profile stored/provided for ${member} was invalid. Please fix this or ask them to fix this.`)
        } else { //if the profile is private
            errorEmbed
                .setDescription(`Hey there! We noticed you sent us your Crowdin profile, however, it was private so we couldn't check it. Please make it public, at least until you get verified, and send us your profile again on the channel. If you don't know how to, then go to your Crowdin profile settings (found [here](https://crowdin.com/settings#account)) and make sure the "Private Profile" setting is turned off (see the image below)\n\nIf you have any questions, be sure to send them to us!`)
                .setImage("https://i.imgur.com/YX8VLeu.png")
            if (sendDms) member.send(errorEmbed)
                .then(() => member.client.channels.cache.get(UsefulIDs.logChannel).send(`${member}'s profile was private, I let them know about that.`))
                .catch(() => {
                    errorEmbed.setFooter("")
                    member.client.channels.cache.get(UsefulIDs.verifyChannel).send(`${member} you had DMs disabled, so here's our message,`, errorEmbed)
                        .then(msg => {
                            setTimeout(() => {
                                if (!msg.deleted) msg.delete()
                            }, 30000)
                        })
                    member.client.channels.cache.get(UsefulIDs.logChannel).send(`${member}'s profile was private, I let them know about that in <#${UsefulIDs.verifyChannel}> since they had DMs off.`)
                })
            else member.client.channels.cache.get(UsefulIDs.logChannel).send(`${member}'s profile is private. Please ask them to change this.`)
        }
        return
    }
    const evalReturn = await page.evaluate((tag, sendDms) => {
        console.log(tag)
        if (document.querySelector(".user-about")?.textContent.includes(tag) || !sendDms) return window.eval(crowdin.profile_projects.view.state.projects)
        else return
    }, member.user.tag, sendDms)
    await page.close()
    closeConnection(browser.uuid)

    if (!evalReturn) {
        const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setAuthor("Received message from staff")
            .setDescription(`Hey there!\nWe noticed you sent us your Crowdin profile, however, you forgot to add your Discord tag to it! Just add ${member.user.tag} to your about section like shown in the image below. Once you've done so, send us the profile link again.\n\nIf you have any questions, be sure to send them to us!`)
            .setImage("https://i.imgur.com/BM2bJ4W.png")
            .setFooter("Any messages you send here will be sent to staff.")
        if (sendDms) member.send(embed)
            .then(() => member.client.channels.cache.get(UsefulIDs.logChannel).send(`${member} forgot to add their Discord to their profile. Let's hope they fix that with the message I just sent them.`))
            .catch(() => {
                embed.setFooter("This message will be deleted in 30 seconds")
                member.client.channels.cache.get(UsefulIDs.verifyChannel).send(`${member} you had DMs disabled, so here's our message,`, embed)
                    .then(msg => {
                        setTimeout(() => {
                            if (!msg.deleted) msg.delete()
                        }, 30000)
                    })
                member.client.channels.cache.get(UsefulIDs.logChannel).send(`${member} forgot to add their Discord to their profile. Let's hope they fix that with the message I just sent them.`)
            })
        return
    }

    let highestLangRoles = {},
        highestProjectRoles = {},
        joinedProjects = []

    evalReturn
        .filter(project => Object.keys(projectIDs).includes(project.id) && project.user_role !== "pending")
        .forEach(project => {
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
                    if (highestRole == "manager" || highestRole == "owner")
                        highestRole = "Manager"
                }
            })
            highestProjectRoles[projectIDs[project.id].name] = highestRole

            updateProjectRoles(projectIDs[project.id].name, member, project)
            if (projectIDs[project.id].langRoles)
                project.contributed_languages?.forEach(lang => {
                    if (highestLangRoles[lang.code] && highestLangRoles[lang.code] !== "Proofreader" && lang.user_role?.name === "Proofreader") {
                        highestLangRoles[lang.code] = "Proofreader"
                        highestLangRoles[lang.code].projects.push(projectIDs[project.id].name)
                    } else if (!highestLangRoles[lang.code] && lang.user_role)
                        highestLangRoles[lang.code] = {
                            type: lang.user_role.name,
                            projects: [projectIDs[project.id].name]
                        }
                })
        })

    updateLanguageRoles(highestLangRoles, member)
    Object.values(projectIDs)
        .map(i => i.name)
        .filter(pj => !joinedProjects.includes(pj))
        .forEach(project => checkProjectRoles(project, member))

    await member.roles.remove(UsefulIDs.Alerted, "User is now Verified")
    await member.roles.add(UsefulIDs.Verified, "User is now Verified")
    await getDb().collection("users").updateOne({ id: member.id }, { $set: { profile: url } })

    const endingMessageProjects = {}
    for (const [k, v] of Object.entries(highestProjectRoles)) { //k => key; v => value
        const role = member.guild.roles.cache.find(r => r.name === `${k} ${v}`)
        endingMessageProjects[k] = [role]
    }

    const coll = await getDb().collection("langdb")
    for (const [k, v] of Object.entries(highestLangRoles)) { //k => key; v => value
        const lang = (await coll.findOne({ id: k })).name
        v.projects.forEach(p => {
            const role = member.guild.roles.cache.find(r => r.name === `${lang} ${v.type}`)
            endingMessageProjects[p].push(role)
        })
    }
    const logEmbed = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setTitle(`${member.user.tag} is now verified!`)
        .setDescription(
            Object.keys(endingMessageProjects).length
                ? `${member} has received the following roles:`
                : `${member} has not received any roles. They do not translate for any of the projects.`
        )

    if (Object.keys(endingMessageProjects).length) {
        for (const [k, v] of Object.entries(endingMessageProjects)) {
            logEmbed.addField(k, v.join(",\n"))
        }
    }

    const dmEmbed = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setAuthor("Received message from staff")
        .setDescription(
            `Hey there!\nYou have successfully verified your Crowdin account${Object.keys(endingMessageProjects).length
                ? " and you also received the corresponding roles on our Discord server!"
                : "!\nSadly you didn't receive any roles because you don't translate for any of the projects we currently support.\nWhen you have started translating you can refresh your roles by running `+reverify`"
            }\nIf you wanna know more about all the projects we currently support, run \`+projects\` here.`
        )
        .setFooter("Any messages you send here will be sent to staff.")

    if (sendDms) member.send(dmEmbed)
        .then(() => member.client.channels.cache.get(UsefulIDs.logChannel).send(logEmbed))
        .catch(() => {
            logEmbed.setFooter("Message not sent because user had DMs off")
            member.client.channels.cache.get(UsefulIDs.logChannel).send(logEmbed)
        })
    else member.client.channels.cache.get(UsefulIDs.logChannel).send(logEmbed)
}

module.exports = { crowdinVerify }

/**
 *
 * @param {"Hypixel"|"Quickplay"|"SkyblockAddons"|"Bot"} projectName
 * @param {*} message
 * @param {boolean} langRoles
 * @param {{
    id: string;
    name: string;
    identifier: string;
    join_policy: string;
    last_activity: string;
    created_at_timestamp: number;
    last_activity_timestamp: number;
    joined_at_timestamp: number;
    last_seen_timestamp: number;
    user_role: string;
    contributed_languages?: {
        name: string;
        code: string;
        organization_id?: any;
        url: string;
        user_role: {
            alias: string,
            name: string
        };
    }[];
}} project
 */
async function updateProjectRoles(projectName, member, project) {
    const role = project.contributed_languages?.length
        ? project.contributed_languages.map(lang => {
            return {
                lang: lang.code,
                role: lang.user_role.name
            }
        })
        : [{ role: project.user_role }],
        addedProjectRoles = []

    member.roles.cache.forEach(role => {
        if (
            role.name.includes("Translator") ||
            role.name.includes("Proofreader")
        )
            addedProjectRoles.push(role.name)
    })

    let highestRole = "Translator"
    role.forEach(role => {
        if (role.role !== "Translator") {
            if (role.role !== "Manager") highestRole = role.role
            if (highestRole == "manager" || highestRole == "owner") highestRole = "Manager"
        }
    })

    const projectTransRole = member.guild.roles.cache.find(r => r.name === `${projectName} Translator`).id,
        projectProofRole = member.guild.roles.cache.find(r => r.name === `${projectName} Proofreader`).id,
        projectManagerRole = member.guild.roles.cache.find(r => r.name === `${projectName} Manager`).id

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

/**
 * @param {{[name: string]: "Translator" | "Proofreader"}} highestLangRoles
 */
async function updateLanguageRoles(highestLangRoles, member) {
    const coll = await getDb().collection("langdb"),
        activeRoles = [],
        addedRoles = []

    for (const [k, v] of Object.entries(highestLangRoles)) {
        activeRoles.push(`${(await coll.findOne({ id: k })).name} ${v.type}`)
    }

    member.roles.cache.forEach(role => {
        if (role.name.includes("Translator") || role.name.includes("Proofreader")) addedRoles.push(role.name)
    })

    activeRoles
        .filter(pj => !addedRoles.includes(pj))
        .forEach(async p => {
            await member.roles.add(member.guild.roles.cache.find((r) => r.name === p).id, "User has received this role on Crowdin")
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
            await member.roles.remove(member.guild.roles.cache.find(r => r.name === role).id, "User no longer has this role on Crowdin")
        })
}

async function checkProjectRoles(projectName, member) {
    const projectTransRole = member.guild.roles.cache.find(r => r.name === `${projectName} Translator`).id,
        projectProofRole = member.guild.roles.cache.find(r => r.name === `${projectName} Proofreader`).id,
        projectManagerRole = member.guild.roles.cache.find(r => r.name === `${projectName} Manager`).id

    await member.roles.remove(projectTransRole, "User is no longer in this Crowdin project")

    await member.roles.remove(projectProofRole, "User is no longer in this Crowdin project")

    await member.roles.remove(projectManagerRole, "User is no longer in this Crowdin project")
}

let browser = null,
    interval = null,
    lastRequest = 0,
    activeConnections = [],
    browserClosing = false

/**
 * Returns the browser and an connection ID.
 */
async function getBrowser() {
    //* If browser is currently closing wait for it to fully close.
    await new Promise(resolve => {
        let timer = setInterval(() => {
            if (!browserClosing) {
                clearInterval(timer)
                resolve()
            }
        }, 100)
    })

    lastRequest = Date.now()

    //* Open a browser if there isn't one already.
    if (!browser) {
        browser = await puppeteer.launch({
            args: ["--no-sandbox"],
            headless: process.env.NODE_ENV === "production"
        })
    }

    //* Add closing interval if there isn't one already.
    if (!interval) {
        interval = setInterval(async () => {
            if (lastRequest < Date.now() - 15 * 60 * 1000) {
                await browser.close()
                browser = null
                clearInterval(interval)
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
async function closeConnection(uuid) {
    //* Check if connection exists. If it does remove connection from connection list.
    const index = activeConnections.indexOf(uuid)
    if (index > -1) activeConnections.splice(index, 1)

    //* Close browser if connection list is empty.
    if (!activeConnections.length) {
        browserClosing = true
        await browser.close()
        browser = null
        clearInterval(interval)
        interval = null
        browserClosing = false
    }
}
