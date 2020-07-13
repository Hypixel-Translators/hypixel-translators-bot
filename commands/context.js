const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");
const { GoogleSpreadsheet } = require('google-spreadsheet')
const { promisify } = require('util')
const creds = require('../.gitignore/service-account.json')
const doc = new GoogleSpreadsheet('8f8057b93cce4dda659f117b0401582414e10637');

module.exports = {
    name: "context",
    description: "Does nothing for now!",
    usage: "context <link/ID>",
    channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058"],
    cooldown: 3,
    execute(message, args) {
        accessSpreadsheet()
    }
}

function accessSpreadsheet() {
    doc.useServiceAccountAuth({
        client_email: creds.client_email,
        private_key: creds.private_key,
    })
        .then(() => {
            doc.loadInfo()
                .then(() => {
                    console.log(doc.title);

                    const sheet = doc.sheetsByIndex[0]; // or use doc.sheetsById[id]
                    console.log(sheet.title);
                    console.log(sheet.rowCount);
                })
                .catch(err => {
                    console.log(err)
                })
        })
        .catch(err => {
            console.log(err)
        })
}