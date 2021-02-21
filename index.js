//Import dependencies and define client
const Discord = require("discord.js")
const client = new Discord.Client()
require("dotenv").config()

//Export the client
module.exports.client = client

async function start() {

    //Start MongoDB
    client.mongodb = require('./lib/mongodb')
    await client.mongodb.init()

    //Import commands and events
    const imports = require("./lib/imports")
    imports.setup(client)
}

start()

//Log in
client.login(process.env.DISCORD_TOKEN)
