const fs = require("fs")
const Discord = require("discord.js")

module.exports.setup = (client) => {

    //Set commands
    client.commands = new Discord.Collection()
    const commandFiles = fs
        .readdirSync("./commands")
        .filter(file => file.endsWith(".js"))
    for (const file of commandFiles) {
        const command = require(`../commands/${file}`)
        client.commands.set(command.name, command)
    }

    //Setup events
    fs.readdir("./events/", (err, files) => {
        if (err) console.error(err)
        let jsfiles = files.filter(f => f.split(".").pop() === "js")
        if (jsfiles.length <= 0) return console.log("There are no events to load...")
        console.log(`Loading ${jsfiles.length} events...`)
        jsfiles.forEach((f, i) => {
            require(`../events/${f}`)
            console.log(`${i + 1}: ${f} loaded!`)
        })
    })
}