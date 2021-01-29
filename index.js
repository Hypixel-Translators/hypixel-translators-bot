//Import dependencies and define client
const fs = require("fs")
const Discord = require("discord.js")
const client = new Discord.Client()
require("dotenv").config()

//Require libraries
const lib = require("./lib/imports.js")
lib.setup(client)

//Export the client
module.exports.client = client

//Log in
client.login(process.env.DISCORD_TOKEN)
