const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");
const fs = require('fs');

module.exports = {
  name: "vcjoin",
  description: "Joins the VC you're in.",
  usage: "vcjoin",
  cooldown: 30,
  execute(message) {
    var allowed = false
    if (message.channel.type !== "dm") { if (message.member.roles.cache.has("621071221462663169") || message.member.roles.cache.has("549885657749913621") || message.member.roles.cache.has("241926666400563203")) { allowed = true } }
    if (!allowed) { console.log("vcjoin not allowed"); return; }

    joinVoice(message)
  }
};

async function joinVoice(message) {
  if (message.member.voice.channel) {
    const connection = await message.member.voice.channel.join();
    const dispatcher = connection.play('https://public.db.files.1drv.com/y4mKATMU-U14U9r3ubsDxts9QOrdOG2IU1nLGH9TwVy-BeMyg6IMSh6Dy8PP4Sb0n3_jXcd4o_EAmMTm3cWPDJw7o28COqlAHPHuDSxFh2MP1DshUuDiKvkFKmfiKjvE1_G3AEoaHIBnZY0b_hsL2vj7rTAvp_Xnx0ctrbAIdfyIzCFkHU-TCpDRNhiWVQpqvIF8b9rnmQYQIYDZx22c3j0IqF-G3MzYDcincOGPoO1bTc?');
    dispatcher.on('finish', () => {
      connection.disconnect();
    });
  }
}