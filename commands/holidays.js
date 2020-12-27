const fetch = require("node-fetch")
const fs = require('fs')
const path = require('path')

module.exports = {
    name: "holidays",
    description: "Sends an announcement wishing everyone a happy (holiday) in each language.",
    usage: "+holidays <holiday>",
    aliases: ["holiday"],
    channelWhiteList: ["730042612647723058", "551693960913879071"], // bot-development admin-bots
    execute(message, strings, args) {
        if (!message.member.hasPermission("ADMINISTRATOR")) return "noAccess"
        if (!args[0]) return message.channel.send("You absolute buffoon you need to tell me what holiday to look for.")
        let holidayName = args[0].toLowerCase()
        if (holidayName === "newyear" || args.join("").toLowerCase() === "newyear") holidayName = "newYear"
        if (!strings[holidayName]) return message.channel.send("I have no idea what holiday that is sir.")
        strings = require(`../strings/en/holidays.json`)
        const dirPath = path.join(__dirname, "../strings")
        let holiday = []
        let log = []
        holiday.push(strings[holidayName])
        fs.readdir(dirPath, function (err, files) {
            files.forEach(file => {
                if (err) return console.error('Unable to scan directory: ' + err)
                strings = require(`../strings/${file}/holidays.json`)
                if (!holiday.includes(strings[holidayName])) {
                    holiday.push(strings[holidayName])
                    log.push(`${file}: ${strings[holidayName]}`)
                }
            })
            const announcement = holiday.join(" ")
            if (announcement) {
                message.client.channels.cache.get("549503985501995011").send(`${announcement}\n\n - From the Hypixel Translators Team. ❤`) //announcements
                    .then(msg => fetch(`https://discordapp.com/api/v8/channels/549503985501995011/messages/${msg.id}/crosspost`, { method: "Post", headers: { "Authorization": `Bot ${process.env.TOKEN}` } }))
                message.channel.send(`${holidayName.charAt(0).toUpperCase() + holidayName.slice(1)} announcement sent! Here's each language's translation:\n${log.join("\n")}`)
                console.log(log)
                console.log(`Sent the ${holidayName.charAt(0).toUpperCase() + holidayName.slice(1)} announcement`)
            } else return message.channel.send("For some reason there is nothing in the announcement so I can't send it. Fix your code bro.")
        })
    }
}
