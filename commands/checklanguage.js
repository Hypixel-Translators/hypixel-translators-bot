const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

const fs = require("fs")

module.exports = {
    name: "checklanguage",
    description: "Shows bot and author's permissions or information about the specified user.",
    aliases: ["checklang", "languagecheck", "checklanguage", "czechlanguage", "czechlanguage"],
    usage: "+checklanguage [<user> | detail]",
    channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058", "768160446368186428"], // bots staff-bots bot-development managers
    async execute(strings, message, args) {
        /*const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
        const testFolder = './strings/';
        await fs.readdir(testFolder, async (err, files) => {
            files.forEach(f => {
                const newMessages = await message.client.channels.cache.get("782635440054206504").messages.fetch() //language-database
                const newFiMessages = await newMessages.filter(element => (element.content.split(" ")[0] === args[1]))
                await newFiMessages.forEach(async element => {
                    
                })
            })
        })*/
    }
}