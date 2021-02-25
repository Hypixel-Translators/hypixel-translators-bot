const fs = require("fs")
const path = require("path")
const Discord = require("discord.js")

function findCommands(dir, pattern) {

    let results = []

    fs.readdirSync(dir).forEach(innerPath => {

        innerPath = path.resolve(dir, innerPath)
        const stat = fs.statSync(innerPath)

        if (stat.isDirectory()) results = results.concat(findCommands(innerPath, pattern))
        if (stat.isFile() && innerPath.endsWith(pattern)) results.push(innerPath)
    })

    return results
}

const cmdFiles = findCommands("./commands/", ".js")

module.exports.setup = (client) => {

    //Set commands
    client.commands = new Discord.Collection()
    if (cmdFiles.length <= 0) console.log("There are no commands to load...")
    else {
        cmdFiles.forEach(file => {
            const command = require(file)
            client.commands.set(command.name, command)
        })
        console.log(`Loaded ${cmdFiles.length} commands.`)
    }

    //Setup events
    fs.readdir("./listeners/", (err, files) => {
        if (err) console.error(err)
        let jsfiles = files.filter(f => f.endsWith(".js"))
        if (jsfiles.length <= 0) return console.log("There are no events to load...")
        jsfiles.forEach((f, i) => require(`../listeners/${f}`))
        console.log(`Loaded ${jsfiles.length} events.`)
    })
}