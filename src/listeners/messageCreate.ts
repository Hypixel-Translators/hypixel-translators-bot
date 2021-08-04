import { client } from "../index"
import Discord from "discord.js"
import fs from "fs"
import { Stream } from "stream"
import { crowdinVerify } from "../lib/crowdinverify"
import leveling from "../lib/leveling"
import { errorColor, successColor, neutralColor } from "../config.json"
import { db, DbUser } from "../lib/dbclient"
import { isEqual } from "lodash"

client.on("messageCreate", async message => {
    //Delete pinned message and thread created messages
    if (
        (message.type === "PINS_ADD" && message.channel.type !== "DM") ||
        (message.type === "THREAD_CREATED" && (message.channel as Discord.TextChannel).name.endsWith("-review-strings"))
    ) {
        await message.delete()
        return
    }

    //Stop if user is a bot
    if (message.author.bot) return

    //Define command and leveling system
    const noXp = [
        "613015467984158742", //Important
        "619190456911134750", //Archived
        "748267955552518175", //Verification
        "549894938712866816", //bots
        "782267779008823326", //music
        "622814312615903233" //staff-announcements
    ]
    const noXpRoles = ["549894155174674432", "645208834633367562"] //Bot and Muted
    client.channels.cache.filter(c => (c as Discord.TextChannel).name?.endsWith("review-strings")).forEach(c => noXp.push(c.id))
    if (
        message.guild?.id === "549503328472530974" &&
        !noXp.includes((message.channel as Discord.GuildChannel).parentId!) &&
        !noXp.includes(message.channel.id!) &&
        !message.member?.roles.cache.some(r => noXpRoles.includes(r.id))
    )
        await leveling(message)

    //Publish message if sent in bot-updates or if it's a tweet
    if (message.channel.id === "732587569744838777" || //bot-updates
        message.channel.id === "618909521741348874" && !message.embeds[0]?.description?.startsWith("@")) { //twitter
        await message.crosspost()
        return
    }

    // Delete non-stringURL messages in review-strings
    const stringURLRegex = /https:\/\/crowdin\.com\/translate\/hypixel\/(?:\d+|all)\/en(?:-\w+)?(?:\?[\w\d%&=$+!*'()-]*)?#\d+/gi
    if (message.channel instanceof Discord.TextChannel && message.channel.name.endsWith("-review-strings")) {
        if (!/https:\/\/crowdin\.com\/translate\/hypixel\/(?:\d+|all)\/en(?:-\w+)?(?:\?[\w\d%&=$+!*'()-]*)?#\d+/gi.test(message.content)) await message.delete()
        else {
            await message.react("732298639749152769") // vote_yes
            await message.react("839262179416211477") // vote_maybe
            await message.react("732298639736570007") // vote_no
        }
    }

    //Get the author from the database
    const author: DbUser = await client.getUser(message.author.id)

    //Link correction system
    if (
        message.channel.type !== "DM" &&
        message.content.toLowerCase().includes("/translate/hypixel/") &&
        message.content.includes("://") &&
        /https:\/\/crowdin\.com\/translate\/\w+\/(?:\d+|all)\/en(?:-\w+)?/gi.test(message.content)
    ) {
        if (
            message.channel.parentId === "549503328472530977" || //Hypixel Translations
            message.channel.parentId === "748585307825242322" || //SkyblockAddons Translations
            message.channel.parentId === "763131996163407902" || //Bot Translations
            message.channel.parentId === "646083561769926668"    //Quickplay translations
        ) {
            const langFix = message.content.replace(/translate\.hypixel\.net/gi, "crowdin.com").replace(/\/en-(?!en#)[a-z]{2,4}/gi, "/en-en")
            if (!/(?:\?[\w\d%&=$+!*'()-]*)?#\d+/gi.test(message.content)) {
                await message.react("732298639736570007")
                const embed = new Discord.MessageEmbed()
                    .setColor(errorColor as Discord.HexColorString)
                    .setAuthor(getGlobalString("errors.wrongLink"))
                    .setTitle(getGlobalString("wrongStringURL"))
                    .setDescription(getGlobalString("example", { url: "https://crowdin.com/translate/hypixel/286/en-en#106644" }))
                    .setImage("https://i.imgur.com/eDZ8u9f.png")
                if (message.content !== langFix && message.channel.parentId === "549503328472530977")
                    embed.setDescription(
                        `${getGlobalString("example", { url: "https://crowdin.com/translate/hypixel/286/en-en#106644" })}\n${getGlobalString("reminderLang", {
                            format: "`crowdin.com/translate/.../.../en-en#`"
                        })}`
                    )
                await message.channel.send({ content: `${message.author}`, embeds: [embed] })
                return
            } else if (message.content !== langFix && message.channel.parentId === "549503328472530977") {
                await message.react("732298639736570007")
                const embed = new Discord.MessageEmbed()
                    .setColor(errorColor as Discord.HexColorString)
                    .setAuthor(getGlobalString("errors.wrongLink"))
                    .setTitle(getGlobalString("linkCorrectionDesc", { format: "`crowdin.com/translate/hypixel/.../en-en#`" }))
                    .setDescription(`**${getGlobalString("correctLink")}**\n${langFix.match(stringURLRegex)![0]}`)
                await message.channel.send({ content: `${message.author}`, embeds: [embed] })
                return
            }
        }
    }

    //Crowdin verification system
    if (/(https:\/\/)([a-z]{2,}\.)?crowdin\.com\/profile?\/?\S{1,}/gi.test(message.content) && message.channel.id === "569178590697095168") {
        //verify
        await message.react("798339571531382874") //icon_working
        await crowdinVerify(message.member!, message.content.match(/(https:\/\/)([a-z]{2,}\.)?crowdin\.com\/profile\/\S{1,}/gi)?.[0], true)
        if (!message.deleted) await message.delete()
        message.channel.messages.fetch().then(async messages => {
            const fiMessages = messages.filter(msgs => msgs.author.id === message.author.id)
            await (message.channel as Discord.TextChannel).bulkDelete(fiMessages)
        })
    }

    //Staff messaging system
    const member = await message.client.guilds.cache.get("549503328472530974")!.members.fetch(message.author.id)
    if (message.author !== client.user && message.channel.type === "DM" && !member!.roles.cache.has("645208834633367562")) {
        // Muted
        const staffBots = client.channels.cache.get("624881429834366986") as Discord.TextChannel
        const hourCooldown = 48, // Hours to wait before asking for confirmation
            confirmTime = 60, // 1 min
            controlButtons = new Discord.MessageActionRow()
                .addComponents(
                    new Discord.MessageButton()
                        .setStyle("SUCCESS")
                        .setCustomId("confirm")
                        .setEmoji("✅")
                        .setLabel(getGlobalString("pagination.confirm")),
                    new Discord.MessageButton()
                        .setStyle("DANGER")
                        .setCustomId("cancel")
                        .setEmoji("❎")
                        .setLabel(getGlobalString("pagination.cancel"))
                )
        if (!author.staffMsgTimestamp || author.staffMsgTimestamp + hourCooldown * 60 * 60 * 1000 < message.createdTimestamp) {
            const embed = new Discord.MessageEmbed()
                .setColor(neutralColor as Discord.HexColorString)
                .setTitle(getGlobalString("staffDm.confirmation"))
                .setDescription(message.content)
                .setFooter(getGlobalString("staffDm.confirmSend"))
            if (message.attachments.size > 0) embed.setTitle(`${getGlobalString("staffDm.confirmation")} ${getGlobalString("staffDm.attachmentsWarn")}`)
            const msg = await message.channel.send({ embeds: [embed], components: [controlButtons] }),
                collector = msg.createMessageComponentCollector({ time: confirmTime * 1000 })

            let replied = false
            collector.on("collect", async reaction => {
                replied = true
                controlButtons.components.forEach(button => button.setDisabled(true))
                if (reaction.customId === "cancel") {
                    embed
                        .setColor(errorColor as Discord.HexColorString)
                        .setTitle(getGlobalString("staffDm.dmCancelled"))
                        .setFooter(getGlobalString("staffDm.resendInfo"))
                    await msg.edit({ embeds: [embed], components: [controlButtons] })
                } else if (reaction.customId === "confirm") await staffDm(msg, true)
            })

            collector.on("end", async () => {
                if (replied) return
                controlButtons.components.forEach(button => button.setDisabled(true))
                const timeOutEmbed = new Discord.MessageEmbed()
                    .setColor(errorColor as Discord.HexColorString)
                    .setAuthor(getGlobalString("staffDm.dmCancelled"))
                    .setDescription(message.content)
                    .setFooter(getGlobalString("staffDm.resendInfo"))
                await msg.edit({ embeds: [timeOutEmbed], components: [controlButtons] })
            })
        } else await staffDm(message, false)

        async function staffDm(msg: Discord.Message, afterConfirm: boolean) {
            if (afterConfirm) await db.collection("users").updateOne({ id: message.author.id }, { $set: { staffMsgTimestamp: Date.now() } })
            else await db.collection("users").updateOne({ id: message.author.id }, { $set: { staffMsgTimestamp: message.createdTimestamp } })
            const staffMsg = new Discord.MessageEmbed()
                .setColor(neutralColor as Discord.HexColorString)
                .setAuthor("Incoming message from " + message.author.tag)
                .setDescription(message.content)
            const dmEmbed = new Discord.MessageEmbed()
                .setColor(successColor as Discord.HexColorString)
                .setAuthor(getGlobalString("staffDm.messageSent"))
                .setDescription(message.content)
                .setFooter(getGlobalString("staffDm.noConfirmWarn"))
            if (message.attachments.size > 1 || !(message.attachments.first()?.contentType?.startsWith("image") ?? true)) {
                const images: (Discord.BufferResolvable | Stream)[] = []
                message.attachments.forEach(file => images.push(file.attachment))
                staffMsg.setTitle("View attachments")
                dmEmbed.setTitle(getGlobalString("staffDm.attachmentsSent"))
                await staffBots.send({ content: `/dm user:@${message.author.tag} message:`, embeds: [staffMsg], files: images })
                await message.channel.send({ embeds: [dmEmbed] })
                return
            } else if (message.attachments.size > 0) {
                staffMsg
                    .setTitle("View attachment")
                    .setImage(message.attachments.first()!.url)
                dmEmbed.setTitle(getGlobalString("staffDm.attachmentSent"))
                await staffBots.send({ content: `/dm user:@${message.author.tag} message:`, embeds: [staffMsg] })
            } else await staffBots.send({ content: `/dm user:@${message.author.tag} message:`, embeds: [staffMsg] })
            if (afterConfirm) await msg.edit({ embeds: [dmEmbed], components: [controlButtons] })
            else await msg.channel.send({ embeds: [dmEmbed] })
        }
    }

    //Event role system
    if (message.member?.roles.cache.has("764442984119795732") && message.mentions.roles.has("863430999122509824") && message.content.includes("\n\n")) { //Discord Administrator
        await db.collection("config").updateOne({ name: "event" }, { $push: { ids: message.id } })
        await message.react("732298639749152769") // vote_yes
        await message.react("732298639736570007") // vote_no
    }

    //Function to get strings
    /**
     * Gets a string or an object of strings for the correct language and replaces all variables if any
     *
     * @param {string} path Path to the string. Use dots to access strings inside objects
     * @param {Object} [variables] Object containing all the variables and their corresponding text to be replaced in the string.
     * @param {string} [cmd] The name of the file to get strings from. Defaults to global
     * @param {string} [lang] The language to get the string from. Defaults to the author's language preference.
     * @returns A clean string with all the variables replaced or an object of strings. Will return `null` if the path cannot be found.
     */
    function getGlobalString(
        path: string,
        variables?: { [key: string]: string | number } | string,
        cmd: string = "global",
        lang: string = author.lang ?? "en"
    ): any {
        if (typeof variables === "string") {
            const languages = fs.readdirSync("./strings")
            lang = languages.includes(cmd) ? cmd : author.lang ?? "en"
            cmd = variables
        }
        const command = client.commands.get(cmd)
        let enStrings = require(`../../strings/en/${cmd}.json`)
        let strings: any
        try {
            strings = require(`../../strings/${lang}/${cmd}.json`)
        } catch {
            strings = require(`../../strings/en/${cmd}.json`)
        }
        const pathSplit = path.split(".")
        let string
        pathSplit.forEach(pathPart => {
            if (pathPart) {
                let jsonElement
                if (strings[pathPart]) jsonElement = strings[pathPart]
                else jsonElement = enStrings[pathPart]

                if (typeof jsonElement === "object" && pathSplit.indexOf(pathPart) !== pathSplit.length - 1) {
                    //check if the string isn't an object nor the end of the path
                    if (strings[pathPart]) strings = strings[pathPart]
                    enStrings = enStrings[pathPart]
                    return
                } else {
                    string = strings[pathPart]
                    if (!string || (typeof string === "string" && !isEqual(string.match(/%%\w+%%/g)?.sort(), enStrings[pathPart].match(/%%\w+%%/g)?.sort()))) {
                        string = enStrings[pathPart] //if the string hasn't been added yet or if the variables changed
                        if (!string) {
                            string = null //in case of fire
                            if (command?.category != "Admin" && command?.category != "Staff" && !path.includes(" "))
                                console.error(`Couldn't get string ${path} in English for ${cmd}, please fix this`)
                        }
                    }
                    if (typeof string === "string" && variables) {
                        for (const [variable, text] of Object.entries(variables)) {
                            string = string.replace(`%%${variable}%%`, String(text))
                        }
                    }
                }
            } else if (strings) string = strings
            else string = enStrings
        })
        return string
    }
})
