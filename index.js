const fs = require("fs");
const Discord = require("discord.js");
const { prefix, token } = require("./config.json");

const client = new Discord.Client();
client.commands = new Discord.Collection();

const commandFiles = fs
  .readdirSync("./commands")
  .filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

const cooldowns = new Discord.Collection();

client.once("ready", () => {
  console.log("Ready!");
  var used1 = false;
  client.user.setStatus("online").catch(console.error);
  setInterval(() => {
    if (used1) {
      client.user.setActivity("+help", {
        type: "LISTENING"
      });
      used1 = false;
    } else {
      client.user.setActivity("your commands", {
        type: "WATCHING"
      });
      used1 = true;
    }
  }, 20000);
});

client.on("message", message => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command =
    client.commands.get(commandName) ||
    client.commands.find(
      cmd => cmd.aliases && cmd.aliases.includes(commandName)
    );

  if (!command) return;

  if (command.guildOnly && message.channel.type !== "text") {
    return message.reply(
      "You can't use this command in private messages."
    );
  }

  if (command.args && !args.length) {
    let reply = `You didn't leave any arguments, ${message.author}!`;

    if (command.usage) {
      reply += `\nYou should use this command like this: \`${prefix}${command.name} ${command.usage}\``;
    }

    return message.channel.send(reply);
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
    command.execute(message, args);
  } catch (error) {
    console.error(error);
    message.channel.send(
      "An error has occurred whilst executing that command, sorry!"
    );
  }
});

client.login(token);
