const { successColor } = require("../config.json")
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest
const Discord = require("discord.js")

module.exports = {
    name: "slashcommand",
    description: "Adds, modifies or deletes a slash command.",
    aliases: ["slashc"],
    usage: "+slashcommand POST|PATCH|DELETE <json>",
    roleWhitelist: ["620274909700161556"], //*
    dev: true,
    channelWhitelist: ["624881429834366986", "730042612647723058", "551693960913879071"], //staff-bots bot-dev admin-bots
    execute(message) {
        var xhr = new XMLHttpRequest()
        xhr.open(message.split(' ')[1], "https://discord.com/api/v8/applications/" + `${'ADD APPLICATION ID HERE'}` + "/commands")
        xhr.setRequestHeader("Authorization", process.env.TOKEN)
        xhr.send(message.split(' ').shift().shift().join(' '))
    }
}
