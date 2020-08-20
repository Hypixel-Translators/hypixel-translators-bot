const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
  name: "vcleave",
  description: "Leaves the VC the bot is in.",
  usage: "vcleave",
  cooldown: 30,
  execute(message) {
    var allowed = false
    if (message.channel.type !== "dm") { if (message.member.roles.cache.has("621071221462663169") || message.member.roles.cache.has("549885657749913621") || message.member.roles.cache.has("241926666400563203")) { allowed = true } }
    if (!allowed) return;
    message.client.leaveVoiceChannel()
  }
};