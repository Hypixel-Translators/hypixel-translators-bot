//Import dependencies and define client
const Discord = require("discord.js")
const client = new Discord.Client()
require("dotenv").config()

//Import commands and events
const imports = require("./lib/imports")
imports.setup(client)

//Start MongoDB
client.mongodb = require('./lib/mongodb')
client.mongodb.init()

//Export the client
module.exports.client = client

//Log in
client.login(process.env.DISCORD_TOKEN)
