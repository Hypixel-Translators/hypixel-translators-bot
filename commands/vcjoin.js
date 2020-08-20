const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");
const fs = require('fs');
const ffmpeg = require('ffmpeg');

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
    const dispatcher = connection.play('../vc.mp3');
    dispatcher.on('finish', () => {
      connection.disconnect();
    });
  }
}