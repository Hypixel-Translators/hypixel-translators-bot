const { errorColor, successColor } = require("../config.json")
const Discord = require("discord.js")
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest

module.exports = {
    name: "define",
    description: "Gives you the definition of a word in English along with some details.",
    usage: "+define <query>",
    cooldown: 10,
    allowDM: true,
    dev: true,
    channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058", "749391414600925335", "551693960913879071"], // bots staff-bots bot-development bot-translators admin-bots
    execute(message, strings, args) {
        message.channel.startTyping()

        try {
            const arg = args.join(' ')
            const xmlhttp = new XMLHttpRequest()
            const url = `https://www.dictionaryapi.com/api/v3/references/collegiate/json/${arg}?key=${process.env.WEBSTER_COLLEGIATE_KEY}`

            xmlhttp.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    const res = JSON.parse(this.responseText)
                    done(res, message, strings)
                }
            }
            xmlhttp.open("GET", url, true)
            xmlhttp.send()
        } catch (err) {
            message.channel.stopTyping()
            throw err
        }
    }
}

function done(res, message, strings) {
    const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
    const embed = new Discord.MessageEmbed()
        .setColor(errorColor)
        .setAuthor(strings.moduleName)
        .setTitle(strings.incomplete)
        .setFooter(executedBy, message.author.displayAvatarURL())

    if (res[0]) {
        if (res[0].meta) {
            const word = res[0].meta.id || arg
            const fl = strings[res[0].fl] || res[0].fl || "?"
            const stems = (res[0].meta.stems || "?").join(", ")
            const def = (res[0].shortdef || "?").join(",\n**or** ")

            embed
                .setColor(successColor)
                .setAuthor(strings.moduleName)
                .setTitle(word + " (" + fl + ")")
                .addField(strings.moduleName, def)
                .setFooter(executedBy, message.author.displayAvatarURL())

            if (res[0].hwi.prs.mw) embed.setDescription(`_${res[0].hwi.prs.mw.replace("-", "∙")}_\n${stems}`)
            else embed.setDescription(stems)
        }
    }

    message.channel.stopTyping()
    message.channel.send(embed)
}