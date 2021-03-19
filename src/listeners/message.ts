import { client } from "../index.js"
import Discord from "discord.js"
import { Stream } from "stream"
import { crowdinVerify } from "./../lib/crowdinverify"
import leveling from "./../lib/leveling"
import { prefix, loadingColor, errorColor, successColor, neutralColor, blurple } from "../config.json"
import { DbUser } from "../lib/dbclient.js"

client.on("message", async message => {

    //Stop if user is a bot
    if (message.author.bot) return

    //Delete pinned message messages
    if (message.type === "PINS_ADD" && message.channel.type !== "dm") return message.delete()

    //Define command and leveling system
    const args: string[] = message.content.slice(prefix.length).split(/ +/)
    const commandName = args.shift()!.toLowerCase()
    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases! && cmd.aliases.includes(commandName))
    const noXp = ["613015467984158742", "619190456911134750", "748267955552518175", "549894938712866816", "782267779008823326", "622814312615903233"] //Important, Archived, Verification, bots, music and staff-announcements
    const noXpRoles = ["549894155174674432", "645208834633367562"] //Bot and Muted
    client.channels.cache.filter(c => (c as Discord.TextChannel).name?.endsWith("review-strings")).forEach(c => noXp.push(c.id))
    if (message.guild?.id === "549503328472530974" && !command && !noXp.includes((message.channel as Discord.GuildChannel).parentID!) && !noXp.includes(message.channel.id!) && !message.member?.roles.cache.some(r => noXpRoles.includes(r.id))) await leveling(message)

    //Publish message if sent in bot-updates
    if (message.channel.id === "732587569744838777") return message.crosspost() //bot-updates

    //Link correction system
    if (!(message.channel instanceof Discord.DMChannel) && message.content.toLowerCase().includes("/translate/hypixel/") && message.content.includes("://")) {
        if (message.channel.parentID === "549503328472530977" || message.channel.parentID === "748585307825242322" || message.channel.parentID === "763131996163407902" || message.channel.parentID === "646083561769926668") { //Hypixel, SkyblockAddons, Bot and Quickplay Translations
            const langFix = message.content.replace(/translate\.hypixel\.net/gi, "crowdin.com").replace(/\/en-(?!en#)[a-z]{2,4}/gi, "/en-en")
            if (/\/en(-?[a-z]{2,4})?[^#-]/gi.test(message.content)) {
                message.react("732298639736570007")
                const embed = new Discord.MessageEmbed()
                    .setColor(errorColor)
                    .setAuthor(getString("errors.wrongLink", {}, "global"))
                    .setTitle(getString("wrongStringURL", {}, "global"))
                    .setDescription(getString("example", { url: "https://crowdin.com/translate/hypixel/286/en-en#106644" }, "global"))
                    .setImage("https://i.imgur.com/eDZ8u9f.png")
                if (message.content !== langFix && message.channel.parentID === "549503328472530977") embed.setDescription(`${getString("example", { url: "https://crowdin.com/translate/hypixel/286/en-en#106644" }, "global")}\n${getString("reminderLang", { format: "`crowdin.com/translate/hypixel/.../en-en#`" }, "global")}`)
                return message.channel.send(message.author, embed)
            } else if (message.content !== langFix && message.channel.parentID === "549503328472530977") {
                message.react("732298639736570007")
                const embed = new Discord.MessageEmbed()
                    .setColor(errorColor)
                    .setAuthor(getString("errors.wrongLink", {}, "global"))
                    .setTitle(getString("linkCorrectionDesc", { format: "`crowdin.com/translate/hypixel/.../en-en#`" }, "global"))
                    .setDescription(langFix)
                return message.channel.send(message.author, embed)
            }
        }
    }

    //Crowdin verification system
    if (/(https:\/\/)([a-z]{2,}\.)?crowdin\.com\/profile?\/?\S{1,}/gi.test(message.content) && message.channel.id === "569178590697095168") { //verify
        message.react("798339571531382874") //icon_working
        await crowdinVerify(message.member!, message.content.match(/(https:\/\/)([a-z]{2,}\.)?crowdin\.com\/profile\/\S{1,}/gi)?.[0], true)
        message.delete()
    }

    //Staff messaging system
    if (!message.content.startsWith(prefix) && message.author !== client.user && message.channel.type === "dm") {
        const staffBots = client.channels.cache.get("624881429834366986") as Discord.TextChannel
        const staffMsg = new Discord.MessageEmbed()
            .setColor(neutralColor)
            .setAuthor("Incoming message from " + message.author.tag)
            .setDescription(message.content)
            .addField("To reply", `\`+dm ${message.author.id} \``)

        const dmEmbed = new Discord.MessageEmbed()
            .setColor(successColor)
            .setAuthor(getString("outgoing", {}, "global"))
            .setDescription(message.content)
            .setFooter(getString("outgoingDisclaimer", {}, "global"))
        if (message.attachments.size > 1) {
            const images: (Discord.BufferResolvable | Stream)[] = []
            message.attachments.forEach(file => images.push(file.attachment))
            staffMsg.setTitle("View attachments")
            dmEmbed.setTitle("Attachments sent")
            staffBots.send({ embed: staffMsg, files: images })
            return message.channel.send(dmEmbed)
        } else if (message.attachments.size > 0) {
            staffMsg
                .setTitle("View attachment")
                .setImage(message.attachments.first()!.url)
            dmEmbed.setTitle("Attachment sent")
            staffBots.send(staffMsg)
        } else staffBots.send(staffMsg) //staff-bots
        return message.channel.send(dmEmbed)
    }

    //Stop if the message is not a command
    if (!message.content.startsWith(prefix)) return
    if (!command) return

    //Log if command is ran in DMs
    if (message.channel.type === "dm") console.log(`${message.author.tag} used command ${commandName} in DMs`)

    //Return if user is not verified
    if (message.member && !message.member.roles.cache.has("569194996964786178") && command.name !== "verify") return //Verified
    else {
        const member = message.client.guilds.cache.get("549503328472530974")!.member(message.author)
        if (!member?.roles.cache.has("569194996964786178") && command.name !== "verify") return //Verified
    }

    //Role Blacklist and Whitelist system
    let allowed = true
    if (command.roleBlacklist) {
        allowed = true
        command.roleBlacklist.forEach(role => {
            if (message.member?.roles.cache.has(role)) allowed = false
        })
    }
    if (command.roleWhitelist) {
        allowed = false
        command.roleWhitelist.forEach(role => {
            if (message.member?.roles.cache.has(role)) allowed = true
        })
    }

    //Channel Blacklist and whitelist systems
    //@ts-expect-error
    if (command.categoryBlacklist && command.categoryBlacklist?.includes(message.channel.parentID)) allowed = false
    else if (command.channelBlacklist && command.channelBlacklist?.includes(message.channel.id)) allowed = false
    //@ts-expect-error
    else if (command.categoryWhitelist && !command.categoryWhitelist?.includes(message.channel.parentID)) allowed = false
    else if (command.channelWhitelist && !command.channelWhitelist?.includes(message.channel.id)) allowed = false

    //Enable commands in DMs
    if (command.allowDM && message.channel.type === "dm") allowed = true

    //Prevent users from running commands in development
    if (command.dev && !message.member?.roles.cache.has("764442984119795732")) allowed = false //Discord Administrator

    //Give perm to admins and return if not allowed
    if (message.member?.hasPermission("MANAGE_ROLES") && command.name !== "eval") allowed = true
    if (!allowed) {
        message.react("732298639736570007")
        return setTimeout(() => {
            if (!message.deleted && message.channel.type !== "dm") message.delete()
        }, 5000)
    }

    //Get the author from the database
    const author: DbUser = await client.getUser(message.author.id)
    const executedBy = getString("executedBy", { user: message.author.tag }, "global")

    //Stop and error if command is not allowed in DMs and command is sent in DMs
    if (!command.allowDM && message.channel.type === "dm") {
        const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setAuthor(getString("error", {}, "global"))
            .setTitle(getString("errors.dmError", {}, "global"))
            .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
        return message.channel.send(embed)
    }
    //Cooldown system
    if (!client.cooldowns.has(command.name)) client.cooldowns.set(command.name, new Discord.Collection())
    const now = Date.now()
    const timestamps: Discord.Collection<string, number> = client.cooldowns.get(command.name)!
    const cooldownAmount = (command.cooldown || 3) * 1000
    if (timestamps.has(message.author.id)) {
        const expirationTime = timestamps.get(message.author.id)! + cooldownAmount
        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000
            let timeLeftS
            if (Math.ceil(timeLeft) >= 120) timeLeftS = getString("minsLeftT", { time: Math.ceil(timeLeft / 60), command: commandName }, "global")
            else if (Math.ceil(timeLeft) === 1) timeLeftS = getString("secondLeft", { command: commandName }, "global")
            else timeLeftS = getString("timeLeftT", { time: Math.ceil(timeLeft), command: commandName }, "global")

            const embed = new Discord.MessageEmbed()
                .setColor(errorColor)
                .setAuthor(getString("cooldown", {}, "global"))
                .setTitle(timeLeftS)
                .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
            return message.channel.send(embed)
        }
    }

    //Remove cooldown if administrator
    if (message.member && !message.member.hasPermission("MANAGE_ROLES")) timestamps.set(message.author.id, now)
    setTimeout(() => { timestamps.delete(message.author.id) }, cooldownAmount)

    //Function to get strings
    function getString(path: string, variables?: { [key: string]: string | number }, cmd: string = command!.name, lang: string = author.lang): any {
        let enStrings = require(`../../strings/en/${cmd || command!.name}.json`)
        let strings: any
        try { strings = require(`../../strings/${lang || author.lang}/${cmd || command!.name}.json`) }
        catch { strings = require(`../../strings/en/${cmd || command!.name}.json`) }
        const pathSplit = path.split(".")
        let string
        pathSplit.forEach(pathPart => {
            if (pathPart) {
                let jsonElement
                if (strings[pathPart]) jsonElement = strings[pathPart]
                else jsonElement = enStrings[pathPart]

                if (typeof jsonElement === "object" && pathSplit.indexOf(pathPart) !== pathSplit.length - 1) { //check if the string isn't an object nor the end of the path
                    if (strings[pathPart]) strings = strings[pathPart]
                    enStrings = enStrings[pathPart]
                    return
                } else {
                    string = strings[pathPart]
                    if (!string || typeof string === "string" && !arrayEqual(string.match(/%%\w+%%/g), enStrings[pathPart].match(/%%\w+%%/g))) {
                        string = enStrings[pathPart] //if the string hasn't been added yet or if the variables changed
                        if (!string) {
                            string = `strings.${path}` //in case of fire
                            if (command!.category != "Admin" && command!.category != "Staff") console.error(`Couldn't get string ${path} in English for ${cmd || command!.name}, please fix this`)
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

    //Run command and handle errors
    try { await command.execute(message, args, getString) }
    catch (error) {
        if (!error.stack) error = getString(`errors.${error}`, {}, "global")

        //Handle errors
        timestamps.delete(message.author.id)
        const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setAuthor(getString("error", {}, "global"))
            .setTitle(error.message?.substring(0, 255) || error.toString().substring(0, 255))
            .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
        if (getString(`${command.name}.usage`, {}, "help") === `strings.${command.name}.usage`) embed.addField(getString("usage", {}, "global"), `\`${command.usage}\``)
        else embed.addField(getString("usage", {}, "global"), `\`${getString(`${command.name}.usage`, {}, "help")}\``)
        message.channel.stopTyping()
        return message.channel.send(embed)
            .then(msg => {
                if (error.stack) {
                    if (process.env.NODE_ENV === "production") {
                        const embed = new Discord.MessageEmbed()
                            .setColor(errorColor)
                            .setAuthor("Unexpected error!")
                            .setTitle(error.toString().substring(0, 255))
                            .setDescription(`\`\`\`${error.stack.substring(0, 2047)}\`\`\``)
                            .setFooter("Check the console for more details");
                        (message.client.channels.cache.get("730042612647723058") as Discord.TextChannel).send("ERROR INCOMING, PLEASE FIX <@240875059953139714>", embed) //Rodry and bot-development
                    }
                    //@ts-expect-error
                    console.error(`Unexpected error with command ${commandName} on channel ${message.channel.name || message.channel.type} executed by ${message.author.tag}. Here's the error:\n${error.stack}`)
                } else {
                    setTimeout(() => {
                        if (!message.deleted && message.channel.type !== "dm") message.delete()
                        if (!msg.deleted && message.channel.type !== "dm") msg.delete()
                    }, 10000)
                }
            })
    } finally {

        // Try sending a tip
        const d = Math.random() * 100 // Get percentage
        if (command.allowTip !== false && d <= 5) { // Less than or equal to 5%
            const keys = Object.keys(getString("tips", {}, "global"))
            const tip = getString(`tips.${keys[keys.length * Math.random() << 0]}`, { botUpdates: "<#732587569744838777>", gettingStarted: "<#699275092026458122>", twitter: "<https://twitter.com/HTranslators>", rules: "<#796159719617986610>", serverInfo: "<#762341271611506708>", bots: "<#549894938712866816>" }, "global")
            message.channel.send(`**${getString("tip", {}, "global").toUpperCase()}:** ${tip}`)
        }
    }
})

function arrayEqual(a: any, b: any) {
    if (a == b) return true

    if (!Array.isArray(a) || !Array.isArray(b)) return false

    // .concat() to not mutate arguments
    let arr1 = a.concat().sort(),
        arr2 = b.concat().sort()

    // Remove duplicated values
    arr1 = arr1.filter((item: string, index: number) => arr1.indexOf(item) == index)
    arr2 = arr2.filter((item: string, pos: number) => arr2.indexOf(item) == pos)

    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false
    }

    return true
}