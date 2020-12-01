const { loadingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");
const MongoClient = require('mongodb').MongoClient

module.exports = {
    name: "note",
    description: "WIP",
    usage: "+note <user> <note>",
    channelWhiteList: ["730042612647723058"], // bot-development
    execute(strings, message, args) {
        const uri = `mongodb+srv://${process.env.db_user}:${process.env.db_password}@hypixel-translators.cpz00.mongodb.net/${process.env.db_name}?retryWrites=true&w=majority`
        const client = new MongoClient(uri, { useNewUrlParser: true })
        client.connect(err => {
            const collection = client.db("profiles").collection("notes")   // perform actions on the collection object   
            client.close()
        })

    }
}