const { token, workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

const client = new Discord.Client();

client.once("ready", () => {
  client.user.setStatus("idle").catch(console.error);
  const embed = new Discord.MessageEmbed()
    .setColor(workingColor)
    .setTitle("Build")
    .setDescription("Deployment started... ")
    .setFooter("The bot's status will turn back to 🟢 once the bot is ready.");
  message.channel.send(embed)
})

client.login(token);