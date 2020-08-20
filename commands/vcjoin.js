const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
  name: "vcjoin",
  description: "Joins the VC you're in.",
  usage: "vcjoin",
  cooldown: 30,
  execute(message) {
    var allowed = false
    if (message.channel.type !== "dm") { if (message.member.roles.cache.has("621071221462663169") || message.member.roles.cache.has("549885657749913621") || message.member.roles.cache.has("241926666400563203")) { allowed = true } }
    if (!allowed) { console.log("vcjoin not allowed"); return; }
    message.member.voice.channel.join();
  }
};