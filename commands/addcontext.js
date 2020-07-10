const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");
const { GoogleSpreadsheet } = require('google-spreadsheet')
const doc = new GoogleSpreadsheet('1tVLWskn4InBeopmRdQyrDumr1H6STqyidcEwoL4a8ts');


module.exports = {
    name: "addcontext",
    description: "Does nothing for now!",
    usage: "addcontext",
    cooldown: 3,
    execute(message, args) {
        checkSheet()
    }
}


async function checkSheet() {
    await doc.useServiceAccountAuth({
        client_email: "database@hypixel-translators-bot.iam.gserviceaccount.com",
        private_key: "8f8057b93cce4dda659f117b0401582414e10637",
    });
    await doc.loadInfo(); // loads document properties and worksheets
    console.log(doc.title);
    const embed = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setTitle("Add Context")
        .setDescription(doc.title)
        .setFooter("Executed by " + message.author.tag);
    message.channel.send(embed)
}