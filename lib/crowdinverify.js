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

async function crowdinVerify(message) {
    const errorEmbed = new Discord.MessageEmbed()
        .setColor(errorColor)
        .setAuthor("Received message from staff")
        .setFooter("Any messages you send here will be sent to staff.")
    let url = message.content.match(
        /(https:\/\/)([a-z]{2,}\.)?crowdin\.com\/profile\/\S{1,}/gi
    )[0]
    if (!url) {
        const userDb = await getDb()
            .collection("users")
            .findOne({ id: message.author.id })
        url = userDb.profile
        if (!url) {
            //if user runs +unverify and the profile is not stored on our DB
            errorEmbed
                .setDescription(
                    "Hey there! We noticed you tried to send us your Crowdin profile but the link you sent was invalid. This may have happened because you either typed the wrong name in the link or you sent us the generic Crowdin profile link. If you don't know how to obtain the profile URL, make sure it follows the format `https://crowdin.com/profile/<username>` and replace <username> with your username like shown below.\n\nIf you have any questions, be sure to send them to us!"
                )
                .setImage("https://i.imgur.com/7FVOSfT.png")
            return message.author
                .send(errorEmbed)
                .then(() => {
                    message.client.channels.cache
                        .get(UsefulIDs.logChannel)
                        .send(
                            `${message.author} sent the wrong profile link. Let’s hope they work their way around with the message I just sent them.`
                        )
                })
                .catch(() => {
                    errorEmbed.setFooter("")
                    message.client.channels.cache
                        .get(UsefulIDs.verifyChannel)
                        .send(message.author, errorEmbed)
                    message.client.channels.cache
                        .get(UsefulIDs.logChannel)
                        .send(
                            `${message.author} sent the wrong profile link. Let’s hope they work their way around with the message I just sent in <#${UsefulIDs.verifyChannel}> since they had DMs off.`
                        )
                })
        }
    }
    const browser = await getBrowser(),
        page = await browser.pupBrowser.newPage()
    await page.goto(url)
    try {
        await page.waitForSelector(".project-name", { timeout: 10000 })
    } catch (_) {
        await page.close()
        closeConnection(browser.uuid)
        //if profile leads to a 404 page
        errorEmbed
            .setDescription(
                "Hey there! We noticed you tried to send us your Crowdin profile but the link you sent was invalid. This may have happened because you either typed the wrong name in the link or you sent us the generic Crowdin profile link. If you don't know how to obtain the profile URL, make sure it follows the format `https://crowdin.com/profile/<username>` and replace <username> with your username like shown below.\n\nIf you have any questions, be sure to send them to us!"
            )
            .setImage("https://i.imgur.com/7FVOSfT.png")
        return message.author
            .send(errorEmbed)
            .then(() =>
                message.client.channels.cache
                    .get(UsefulIDs.logChannel)
                    .send(
                        `${message.author} sent the wrong profile link. Let’s hope they work their way around with the message I just sent them.`
                    )
            )
            .catch(() => {
                errorEmbed.setFooter("")
                message.client.channels.cache
                    .get(UsefulIDs.verifyChannel)
                    .send(message.author, errorEmbed)
                message.client.channels.cache
                    .get(UsefulIDs.logChannel)
                    .send(
                        `${message.author} sent the wrong profile link. Let’s hope they work their way around with the message I just sent in <#${UsefulIDs.verifyChannel}> since they had DMs off.`
                    )
            })
    }
    const evalReturn = await page.evaluate((message) => {
        if (
            document.querySelector(".user-about")?.textContent.includes(message)
        ) {
            const projects = window.eval(
                crowdin.profile_projects.view.state.projects
            )
            if (projects) return projects
            else return { error: true }
        } else return
    }, message.author.tag)
    await page.close()
    closeConnection(browser.uuid)

    if (!evalReturn) {
        const embed = new Discord.MessageEmbed()
            .setColor(neutralColor)
            .setAuthor("Received message from staff")
            .setDescription(
                `Hey there!\nWe noticed you sent us your Crowdin profile, however, you forgot to add your Discord tag to it! Just add ${message.author.tag} to your about section like shown in the image below. Once you've done so, send us the profile link again.\n\nIf you have any questions, be sure to send them to us!`
            )
            .setImage("https://i.imgur.com/BM2bJ4W.png")
            .setFooter("Any messages you send here will be sent to staff.")
        return message.author
            .send(embed)
            .then(() =>
                message.client.channels.cache
                    .get(UsefulIDs.logChannel)
                    .send(
                        `${message.author} forgot to add their Discord to their profile. Let's hope they fix that with the message I just sent them.`
                    )
            )
            .catch(() => {
                embed.setFooter("This message will be deleted in 30 seconds")
                message.channel
                    .send(
                        `${message.author} you had DMs disabled, so here's our message,`,
                        embed
                    )
                    .then((msg) => {
                        setTimeout(() => {
                            if (!msg.deleted) msg.delete()
                        }, 30000)
                    })
                message.client.channels.cache
                    .get(UsefulIDs.logChannel)
                    .send(
                        `${message.author} forgot to add their Discord to their profile. Let's hope they fix that with the message I just sent them.`
                    )
            })
    } else if (evalReturn.error) {
        errorEmbed
            .setDescription(
                `Hey there! We noticed you sent us your Crowdin profile, however, it was private so we couldn't check it. Please make it public, at least until you get verified, and send us your profile again on the channel. If you don't know how to, then go to your Crowdin profile settings (found [here](https://crowdin.com/settings#account)) and make sure the "Private Profile" setting is turned off (see the image below)\n\nIf you have any questions, be sure to send them to us!`
            )
            .setImage("https://i.imgur.com/YX8VLeu.png")
        return message.author
            .send(errorEmbed)
            .then(() =>
                message.client.channels.cache
                    .get(UsefulIDs.logChannel)
                    .send(
                        `${message.author}'s profile was private, I let them know about that.`
                    )
            )
            .catch(() => {
                errorEmbed.setFooter("")
                message.client.channels.cache
                    .get(UsefulIDs.verifyChannel)
                    .send(message.author, errorEmbed)
                message.client.channels.cache
                    .get(UsefulIDs.logChannel)
                    .send(
                        `${message.author}'s profile was private, I let them know about that in <#${UsefulIDs.verifyChannel}> since they had DMs off.`
                    )
            })
    }

    let highestLangRoles = {},
        highestProjectRoles = {},
        joinedProjects = []

    evalReturn
        .filter(
            (project) =>
                Object.keys(projectIDs).includes(project.id) &&
                project.user_role !== "pending"
        )
        .forEach((project) => {
            joinedProjects.push(projectIDs[project.id].name)

            const role = project.contributed_languages?.length
                ? project.contributed_languages.map((lang) => {
                      return {
                          lang: lang.code,
                          role: lang.user_role.name
                      }
                  })
                : [{ role: project.user_role }]
            let highestRole = "Translator"
            role.forEach((role) => {
                if (role.role !== "Translator") {
                    if (role.role !== "Manager") highestRole = role.role
                    if (highestRole == "manager" || highestRole == "owner")
                        highestRole = "Manager"
                }
            })
            highestProjectRoles[projectIDs[project.id].name] = highestRole

            updateProjectRoles(projectIDs[project.id].name, message, project)
            if (projectIDs[project.id].langRoles)
                project.contributed_languages?.forEach((lang) => {
                    if (
                        highestLangRoles[lang.code] &&
                        highestLangRoles[lang.code] !== "Proofreader" &&
                        lang.user_role?.name === "Proofreader"
                    ) {
                        highestLangRoles[lang.code] = "Proofreader"
                        highestLangRoles[lang.code].projects.push(
                            projectIDs[project.id].name
                        )
                    } else if (!highestLangRoles[lang.code] && lang.user_role)
                        highestLangRoles[lang.code] = {
                            type: lang.user_role.name,
                            projects: [projectIDs[project.id].name]
                        }
                })
        })

    updateLanguageRoles(highestLangRoles, message)
    Object.values(projectIDs)
        .map((i) => i.name)
        .filter((pj) => !joinedProjects.includes(pj))
        .forEach((project) => checkProjectRoles(project, message))

    await message.member.roles.remove(UsefulIDs.Alerted, "User is now Verified")
    await message.member.roles.add(UsefulIDs.Verified, "User is now Verified")
    await getDb()
        .collection("users")
        .updateOne({ id: message.member.user.id }, { $set: { profile: url } })

    console.log(highestLangRoles, highestProjectRoles)
    const endingMessageProjects = {}
    for (const [k, v] of Object.entries(highestProjectRoles)) {
        //k => key; v => value
        endingMessageProjects[k] = [`${k} ${v}`]
    }

    const coll = await getDb().collection("langdb")
    for (const [k, v] of Object.entries(highestLangRoles)) {
        //k => key; v => value
        const lang = (await coll.findOne({ id: k })).name
        v.projects.forEach((p) => {
            endingMessageProjects[p].push(`${lang} ${v.type}`)
        })
    }
    const logEmbed = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setTitle(`${message.author.tag} is now verified!`)
        .setDescription(
            Object.keys(endingMessageProjects).length
                ? `${message.author} has received roles for the following projects:`
                : `${message.author} has not received any roles. They do not translate for any of the projects.`
        )
    if (Object.keys(endingMessageProjects).length)
        for (const [k, v] of Object.entries(endingMessageProjects)) {
            logEmbed.addField(k, v.join(",\n"))
        }

    const dmEmbed = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setAuthor("Received message from staff")
        .setDescription(
            `Hey there!\nYou have successfully verified your Crowdin account!\n${
                Object.keys(endingMessageProjects).length
                    ? "You also received the corresponding roles on our Discord server."
                    : "Sadly you didn't receive any roles because you haven't translated for any of the projects we currently support.\nWhen you have started translating you can refresh your roles by running `+unverify`"
            }\nIf you wanna find out about all the projects we currently support, run \`+projects\` here.`
        )
        .setFooter("Any messages you send here will be sent to staff.")
    message.author
        .send(dmEmbed)
        .then(() =>
            message.client.channels.cache
                .get(UsefulIDs.logChannel)
                .send(logEmbed)
        )
        .catch(() => {
            logEmbed.setFooter("Message not sent because user had DMs off")
            message.client.channels.cache
                .get(UsefulIDs.logChannel)
                .send(logEmbed)
        })
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
async function updateProjectRoles(projectName, message, project) {
    const role = project.contributed_languages?.length
            ? project.contributed_languages.map((lang) => {
                  return {
                      lang: lang.code,
                      role: lang.user_role.name
                  }
              })
            : [{ role: project.user_role }],
        addedProjectRoles = []

    message.member.roles.cache.forEach((role) => {
        if (
            role.name.includes("Translator") ||
            role.name.includes("Proofreader")
        )
            addedProjectRoles.push(role.name)
    })

    let highestRole = "Translator"
    role.forEach((role) => {
        if (role.role !== "Translator") {
            if (role.role !== "Manager") highestRole = role.role
            if (highestRole == "manager" || highestRole == "owner")
                highestRole = "Manager"
        }
    })

    const projectTransRole = (
            await message.guild.roles.cache.find(
                (r) => r.name === `${projectName} Translator`
            )
        ).id,
        projectProofRole = (
            await message.guild.roles.cache.find(
                (r) => r.name === `${projectName} Proofreader`
            )
        ).id,
        projectManagerRole = (
            await message.guild.roles.cache.find(
                (r) => r.name === `${projectName} Manager`
            )
        ).id

    if (highestRole === "Translator") {
        if (await message.member.roles.cache.has(projectProofRole))
            await message.member.roles.remove(
                projectProofRole,
                "User no longer has this role on Crowdin"
            )

        if (await message.member.roles.cache.has(projectManagerRole))
            await message.member.roles.remove(
                projectManagerRole,
                "User no longer has this role on Crowdin"
            )

        await message.member.roles.add(
            projectTransRole,
            "User has received this role on Crowdin"
        )
    } else if (highestRole === "Proofreader") {
        if (await message.member.roles.cache.has(projectTransRole))
            await message.member.roles.remove(
                projectTransRole,
                "User no longer has this role on Crowdin"
            )

        if (await message.member.roles.cache.has(projectManagerRole))
            await message.member.roles.remove(
                projectManagerRole,
                "User no longer has this role on Crowdin"
            )

        await message.member.roles.add(
            projectProofRole,
            "User has received this role on Crowdin"
        )
    } else {
        if (await message.member.roles.cache.has(projectTransRole))
            await message.member.roles.remove(
                projectTransRole,
                "User no longer has this role on Crowdin"
            )

        if (await message.member.roles.cache.has(projectProofRole))
            await message.member.roles.remove(
                projectProofRole,
                "User no longer has this role on Crowdin"
            )

        await message.member.roles.add(
            projectManagerRole,
            "User has received this role on Crowdin"
        )
    }
}

/**
 * @param {{[name: string]: "Translator" | "Proofreader"}} highestLangRoles
 */
async function updateLanguageRoles(highestLangRoles, message) {
    const coll = await getDb().collection("langdb"),
        activeRoles = [],
        addedRoles = []

    for (const [k, v] of Object.entries(highestLangRoles)) {
        activeRoles.push(`${(await coll.findOne({ id: k })).name} ${v.type}`)
    }

    message.member.roles.cache.forEach((role) => {
        if (
            role.name.includes("Translator") ||
            role.name.includes("Proofreader")
        )
            addedRoles.push(role.name)
    })

    activeRoles
        .filter((pj) => !addedRoles.includes(pj))
        .forEach(async (p) => {
            await message.member.roles.add(
                (await message.guild.roles.cache.find((r) => r.name === p)).id,
                "User has received this role on Crowdin"
            )
        })

    addedRoles
        .filter((r) => !activeRoles.includes(r))
        .filter((pj) => {
            const exclude = Object.values(projectIDs).map((i) => i.name)
            let included = true
            for (let i = 0; i < exclude.length; i++) {
                if (pj.includes(exclude[i])) included = false
            }
            return included
        })
        .forEach(async (d) => {
            await message.member.roles.remove(
                (await message.guild.roles.cache.find((r) => r.name === d)).id,
                "User no longer has this role on Crowdin"
            )
        })
}

async function checkProjectRoles(projectName, message) {
    const projectTransRole = (
            await message.guild.roles.cache.find(
                (r) => r.name === `${projectName} Translator`
            )
        ).id,
        projectProofRole = (
            await message.guild.roles.cache.find(
                (r) => r.name === `${projectName} Proofreader`
            )
        ).id,
        projectManagerRole = (
            await message.guild.roles.cache.find(
                (r) => r.name === `${projectName} Manager`
            )
        ).id

    if (await message.member.roles.cache.has(projectTransRole))
        await message.member.roles.remove(
            projectTransRole,
            "User is no longer in this Crowdin project"
        )

    if (await message.member.roles.cache.has(projectProofRole))
        await message.member.roles.remove(
            projectProofRole,
            "User is no longer in this Crowdin project"
        )

    if (await message.member.roles.cache.has(projectManagerRole))
        await message.member.roles.remove(
            projectManagerRole,
            "User is no longer in this Crowdin project"
        )
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
    await new Promise((resolve) => {
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
    if (index > -1) {
        activeConnections.splice(index, 1)
    }

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
