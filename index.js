const fs = require("fs");
const Discord = require("discord.js");
const { prefix, token, workingColor, errorColor, successColor, neutralColor, listenStatuses, watchStatuses, randomUser } = require("./config.json");

const client = new Discord.Client();
client.commands = new Discord.Collection();

const commandFiles = fs
  .readdirSync("./commands")
  .filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

const join = require('./events/join.js')

const cooldowns = new Discord.Collection();

client.once("ready", () => {
  console.log("Ready!");

  let now = +new Date();
  const tooOld = 60 * 60 * 12 * 1000;
  client.user.setStatus("online").catch(console.error);
  setInterval(() => {
    var pickedUser = randomUser[Math.floor(Math.random() * randomUser.length)]
    toPick = Math.random() >= 0.2;
    if (toPick) {
      var listenStatus = listenStatuses[Math.floor(Math.random() * listenStatuses.length)]
      listenStatus = listenStatus.replace("RANDOM_USER", pickedUser)
      client.user.setActivity(listenStatus, {
        type: "LISTENING"
      });
      toPick = Math.random() >= 0.6;
    } else {
      var watchStatus = watchStatuses[Math.floor(Math.random() * watchStatuses.length)]
      watchStatus = watchStatus.replace("RANDOM_USER", pickedUser)
      client.user.setActivity(watchStatus, {
        type: "WATCHING"
      });
      toPick = Math.random() >= 0.2;
    }
  }, 15000);
});

client.on("message", message => {
  if (!message.content.startsWith(prefix) || message.author.bot) {
    if (message.channel.type === "dm") {
      if (message.author.bot) { return; }
      const sendTo = client.channels.cache.get("730042612647723058")
      const report = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setTitle("📩 Message from " + message.author.username)
        .setDescription(message.content)
        .addFields({ name: "Reply", value: "\`+dm " + message.author.id + " \`" })
      sendTo.send(report)

      const embed = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setTitle("📨 Messaging staff")
        .setDescription("Message sent!")
        .addFields(
          { name: "Message", value: message }
        )
      message.channel.send(embed)
      return;
    } else { return; }
  }

  const args = message.content.slice(prefix.length).split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command =
    client.commands.get(commandName) ||
    client.commands.find(
      cmd => cmd.aliases && cmd.aliases.includes(commandName)
    );

  if (!command) return;

  const notAllowed = client.emojis.cache.find(emoji => emoji.name === 'vote_no'); // "🚫"

  if (command.allowDM) {
    if (message.channel.type !== "dm") {
      if (command.channelWhiteList) { if (!command.channelWhiteList.includes(message.channel.id) && !message.member.hasPermission("ADMINISTRATOR")) { message.react(notAllowed); return; } }
      if (command.categoryWhiteList) { if (!command.categoryWhiteList.includes(message.channel.parent.id) && !message.member.hasPermission("ADMINISTRATOR")) { message.react(notAllowed); return; } }
      if (command.channelBlackList) { if (command.channelBlackList.includes(message.channel.id) && !message.member.hasPermission("ADMINISTRATOR")) { message.react(notAllowed); return; } }
      if (command.categoryBlackList) { if (command.categoryBlackList.includes(message.channel.parent.id) && !message.member.hasPermission("ADMINISTRATOR")) { message.react(notAllowed); return; } }
    }
  } else {
    if (message.channel.type !== "dm") {
      if (command.channelWhiteList) { if (!command.channelWhiteList.includes(message.channel.id) && !message.member.hasPermission("ADMINISTRATOR")) { message.react(notAllowed); return; } }
      if (command.categoryWhiteList) { if (!command.categoryWhiteList.includes(message.channel.parent.id) && !message.member.hasPermission("ADMINISTRATOR")) { message.react(notAllowed); return; } }
      if (command.channelBlackList) { if (command.channelBlackList.includes(message.channel.id) && !message.member.hasPermission("ADMINISTRATOR")) { message.react(notAllowed); return; } }
      if (command.categoryBlackList) { if (command.categoryBlackList.includes(message.channel.parent.id) && !message.member.hasPermission("ADMINISTRATOR")) { message.react(notAllowed); return; } }
    } else {
      const embed = new Discord.MessageEmbed()
        .setColor(errorColor)
        .setTitle("Error")
        .setDescription("Sorry, but you can't execute this command in private messages. It might not be compatible with private messages (yet).")
        .setFooter("Executed by " + message.author.tag);
      message.channel.send(embed)
      return;
    }
  }

  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Discord.Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(command.name);
  const cooldownAmount = (command.cooldown || 3) * 1000;

  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return message.channel.send(
        `Wait another ${timeLeft.toFixed(1)} second(s) before you use \`${
        command.name
        }\` again.`
      );
    }
  }

  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

  try {
    if (message.member) { if (message.member.hasPermission("ADMINISTRATOR")) { timestamps.delete(message.author.id) } }
    command.execute(message, args);
  } catch (error) {
    timestamps.delete(message.author.id)
    console.error(error);
    const embed = new Discord.MessageEmbed()
      .setColor(errorColor)
      .setTitle("Error")
      .setDescription("Something has gone wrong. Have you entered the command correctly?\nThis can also be an internal error. Execute \`+bug\` to report a bug.")
      .addFields(
        { name: "Command usage", value: `\`${prefix}${command.usage}\`` },
        { name: "Error message", value: error }
      )
      .setFooter("Executed by " + message.author.tag);
    message.channel.send(embed)

  }
});

client.on('guildMemberAdd', member => {
  join.execute(member)
});

client.login(token);