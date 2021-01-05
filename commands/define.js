const { errorColor, successColor } = require("../config.json")
const Discord = require("discord.js")
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest

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
            var arg = args.join(' ')
            var xmlhttp = new XMLHttpRequest()
            var url = `https://www.dictionaryapi.com/api/v3/references/collegiate/json/${arg}?key=${process.env.WEBSTER_COLLEGIATE_KEY}`

            xmlhttp.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    var res = JSON.parse(this.responseText)
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
            var word = res[0].meta.id || arg
            var fl = strings[res[0].fl] || res[0].fl || "?"
            var hw = (res[0].hwi.prs.mw || "?").replace("-", "∙")
            var stems = (res[0].meta.stems || "?").join(", ")
            var def = (res[0].shortdef || "?").join(",\n**or** ")

            embed
                .setColor(successColor)
                .setAuthor(strings.moduleName)
                .setTitle(word + " (" + fl + ")")
                .setDescription(`_${hw}_\n${stems}`)
                .addField(strings.moduleName, def)
                .setFooter(executedBy, message.author.displayAvatarURL())
        }
    }

    message.channel.stopTyping()
    message.channel.send(embed)
}