const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");
const { GoogleSpreadsheet } = require('google-spreadsheet');


module.exports = {
    name: "context",
    description: "Does nothing for now!",
    usage: "context <link/ID>",
    channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058"],
    cooldown: 3,
    execute(message, args) {
        const doc = new GoogleSpreadsheet('1tVLWskn4InBeopmRdQyrDumr1H6STqyidcEwoL4a8ts');
        doc.useServiceAccountAuth({
            client_email: 'database@hypixel-translators-bot.iam.gserviceaccount.com',
            private_key: '8f8057b93cce4dda659f117b0401582414e10637',
        }).then(() => { doc.loadInfo().then(() => { console.log(doc.title) }) })
    }
}
