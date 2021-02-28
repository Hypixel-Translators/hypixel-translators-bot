const { client } = require("../index")
const Discord = require("discord.js")
const { prefix, loadingColor, errorColor, successColor, neutralColor, blurple } = require("../config.json")
const { getUser } = require("../lib/mongodb")
const { crowdinVerify } = require("../lib/crowdinverify.js")
client.cooldowns = new Discord.Collection()

client.on("message", async message => {

    //Stop if user is a bot
    if (message.author.bot) return

    //Delete pinned message messages
    if (message.type === "PINS_ADD" && message.channel.type !== "dm") return message.delete()

    //Publish message if sent in bot-updates
    if (message.channel.id === "732587569744838777") return message.crosspost() //bot-updates


    //Link correction system
    if (message.content.toLowerCase().includes("/translate/hypixel/") && message.content.includes("://")) {
        if (message.channel.parent.id === "549503328472530977" || message.channel.parent.id === "748585307825242322" || message.channel.parent.id === "763131996163407902" || message.channel.parent.id === "646083561769926668") { //Hypixel, SkyblockAddons, Bot and Quickplay Translations
            const langFix = message.content.replace(/translate\.hypixel\.net/gi, "crowdin.com").replace(/\/en-(?!en#)[a-z]{2,4}/gi, "/en-en")
            if (/\/en(-?[a-z]{2,4})?[^#-]/gi.test(message.content)) {
                message.react("732298639736570007")
                const embed = new Discord.MessageEmbed()
                    .setColor(errorColor)
                    .setAuthor(getString("errors.wrongLink", "global"))
                    .setTitle(getString("wrongStringURL", "global"))
                    .setDescription(getString("example", "global").replace("%%url%%", "https://crowdin.com/translate/hypixel/286/en-en#106644"))
                    .setImage("https://i.imgur.com/eDZ8u9f.png")
                if (message.content !== langFix && message.channel.parent.id === "549503328472530977") embed.setDescription(`${getString("example", "global").replace("%%url%%", "<https://crowdin.com/translate/hypixel/286/en-en#106644>")}\n${getString("reminderLang", "global").replace("%%format%%", "`crowdin.com/translate/hypixel/.../en-en#`")}`)
                return message.channel.send(message.author, embed)
            } else if (message.content !== langFix && message.channel.parent.id === "549503328472530977") {
                message.react("732298639736570007")
                const embed = new Discord.MessageEmbed()
                    .setColor(errorColor)
                    .setAuthor(getString("errors.wrongLink", "global"))
                    .setTitle(getString("linkCorrectionDesc", "global").replace("%%format%%", "`crowdin.com/translate/hypixel/.../en-en#`"))
                    .setDescription(langFix)
                return message.channel.send(message.author, embed)
            }
        }
    }

    //Crowdin verification system
    if (/(https:\/\/)([a-z]{2,}\.)?crowdin\.com\/profile?\/?\S{1,}/gi.test(message.content) && message.channel.id === "569178590697095168") { //verify
        message.react("798339571531382874") //icon_working
        await crowdinVerify(message.member, message.content.match(/(https:\/\/)([a-z]{2,}\.)?crowdin\.com\/profile\/\S{1,}/gi)?.[0], true)
        message.delete()
    }

    //Staff messaging system
    if (!message.content.startsWith(prefix) && message.author !== client.user && message.channel.type === "dm") {
        const staffMsg = new Discord.MessageEmbed()
            .setColor(neutralColor)
            .setAuthor("Incoming message from " + message.author.tag)
            .setDescription(message.content)
            .addFields({ name: "To reply", value: `\`+dm ${message.author.id} \`` })
        client.channels.cache.get("624881429834366986").send(staffMsg) //staff-bots

        const embed = new Discord.MessageEmbed()
            .setColor(successColor)
            .setAuthor(getString("outgoing", "global"))
            .setDescription(message.content)
            .setFooter(getString("outgoingDisclaimer", "global"))
        return message.channel.send(embed)
    }

    //Stop if the message is not a command
    if (!message.content.startsWith(prefix)) return

    //Define command and stop if none is found
    const args = message.content.slice(prefix.length).split(/ +/)
    const commandName = args.shift().toLowerCase()
    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName))
    if (!command) return

    //Log if command is ran in DMs
    if (message.channel.type === "dm") console.log(message.author.tag + " used command " + commandName + " in DMs")

    //Return if user is not verified
    if (message.member && !message.member.roles.cache.has("569194996964786178") && command.name !== "verify") return //Verified
    else {
        const server = message.client.guilds.cache.get("549503328472530974")
        const user = server.member(message.author)
        if (!user.roles.cache.has("569194996964786178") && command.name !== "verify") return //Verified
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
    if (command.categoryBlacklist && command.categoryBlacklist?.includes(message.channel.parent?.id)) allowed = false
    else if (command.channelBlacklist && command.channelBlacklist?.includes(message.channel.id)) allowed = false
    else if (command.categoryWhitelist && !command.categoryWhitelist?.includes(message.channel.parent?.id)) allowed = false
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
        }, 5000);
    }

    //Get the author from the database
    const author = await getUser(message.author.id)
    const executedBy = getString("executedBy", "global").replace("%%user%%", message.author.tag)

    //Stop and error if command is not allowed in DMs and command is sent in DMs
    if (!command.allowDM && message.channel.type === "dm") {
        const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setAuthor(getString("error", "global"))
            .setTitle(getString("errors.dmError", "global"))
            .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
        return message.channel.send(embed)
    }
    //Cooldown system
    if (!client.cooldowns.has(command.name)) client.cooldowns.set(command.name, new Discord.Collection())
    const now = Date.now()
    const timestamps = client.cooldowns.get(command.name)
    const cooldownAmount = (command.cooldown || 3) * 1000
    if (timestamps.has(message.author.id)) {
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount
        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000
            let timeLeftS
            if (Math.ceil(timeLeft) >= 120) timeLeftS = (getString("minsLeftT", "global").replace("%%time%%", Math.ceil(timeLeft / 60)).replace("%%command%%", commandName))
            else if (Math.ceil(timeLeft) === 1) timeLeftS = (getString("secondLeft", "global").replace("%%command%%", commandName))
            else timeLeftS = (getString("timeLeftT", "global").replace("%%time%%", Math.ceil(timeLeft)).replace("%%command%%", commandName))

            const embed = new Discord.MessageEmbed()
                .setColor(errorColor)
                .setAuthor(getString("cooldown", "global"))
                .setTitle(timeLeftS)
                .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
            return message.channel.send(embed)
        }
    }

    //Remove cooldown if administrator
    if (message.member && !message.member.hasPermission("MANAGE_ROLES")) timestamps.set(message.author.id, now)
    setTimeout(() => { timestamps.delete(message.author.id) }, cooldownAmount)

    //Function to get strings
    function getString(path, cmd, lang) {
        let enStrings = require(`../strings/en/${cmd || command.name}.json`)
        try { strings = require(`../strings/${lang || author.lang}/${cmd || command.name}.json`) }
        catch { strings = require(`../strings/en/${cmd || command.name}.json`) }
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
                    if (!string) {
                        string = enStrings[pathPart] //if the string hasn't been added yet
                        if (!string) {
                            string = `strings.${path}` //in case of fire
                            console.error(`Couldn't get string ${path} in English for ${cmd || command.name}, please fix this`)
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
        if (!error.stack) error = getString(`errors.${error}`, "global")

        //Handle errors
        timestamps.delete(message.author.id)
        const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setAuthor(getString("error", "global"))
            .setTitle(error.message?.substring(0, 255) || error.substring(0, 255))
            .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
        if (getString(`${command.name}.usage`, "help") === `strings.${command.name}.usage`) embed.addFields({ name: getString("usage", "global"), value: `\`${command.usage}\`` })
        else embed.addFields({ name: getString("usage", "global"), value: `\`${getString(`${command.name}.usage`, "help")}\`` })
        message.channel.stopTyping()
        return message.channel.send(embed)
            .then(msg => {
                if (error.stack) {
                    if (process.env.NODE_ENV === "production") {
                        const embed = new Discord.MessageEmbed()
                            .setColor(errorColor)
                            .setAuthor("Unexpected error!")
                            .setTitle(error.substring(0, 255))
                            .setDescription(`\`\`\`${error.stack.substring(0, 2047)}\`\`\``)
                            .setFooter("Check the console for more details")
                        message.guild.channels.cache.get("730042612647723058").send("ERROR INCOMING, PLEASE FIX <@240875059953139714>", embed) //Rodry and bot-development
                    } 
                    console.error(`Unexpected error with command ${commandName} on channel ${message.channel.name || message.channel.type} executed by ${message.author.tag}. Here's the error:\n${error.stack}`)
                } else {
                    setTimeout(() => {
                        if (!message.deleted && message.channel.type !== "dm") message.delete()
                        if (!msg.deleted && message.channel.type !== "dm") msg.delete()
                    }, 10000);
                }
            })
    } finally {

        //Try sending a tip
        const d = Math.random().toFixed(2)
        if (command.allowTip !== false && d < 0.05) {
            const keys = Object.keys(getString("tips", "global"))
            const tip = getString(`tips.${keys[keys.length * Math.random() << 0]}`, "global")
            message.channel.send(`**${getString("tip", "global").toUpperCase()}:** ${tip.replace("%%botUpdates%%", "<#732587569744838777>").replace("%%gettingStarted%%", "<#699275092026458122>").replace("%%twitter%%", "<https://twitter.com/HTranslators>").replace("%%rules%%", "<#796159719617986610>").replace("%%serverInfo%%", "<#762341271611506708>").replace("%%bots%%", "<#549894938712866816>")}`)
        }
    }
})