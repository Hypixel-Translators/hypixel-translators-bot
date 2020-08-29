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

const reviewStrings = require('./events/reviewStrings.js')
const stats = require('./events/stats.js')

const cooldowns = new Discord.Collection();

client.once("ready", () => {
  console.log("Ready!");

  client.channels.cache.get("732587569744838777").messages.fetch("733036798736990309");
  client.channels.cache.get("732326676192690236").messages.fetch({ limit: 100 })
  client.channels.cache.get("734081393499308053").messages.fetch({ limit: 100 })
  client.channels.cache.get("732326761882321046").messages.fetch({ limit: 100 })
  client.channels.cache.get("748968125663543407").messages.fetch({ limit: 100 }) //languages database

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

    stats.execute(client, false)
  }, 30000);
});


client.on("message", async message => {
  if (message.content === "+stats" && message.member.hasPermission("VIEW_AUDIT_LOG")) {
    stats.execute(client, true)
    return;
  }

  if (message.author.bot) return;

  if (message.member) {
    if (!message.member.roles.cache.has("569194996964786178")) return;
  } else {
    const server = message.client.guilds.cache.get("549503328472530974")
    const user = server.member(message.author)
    if (!user.roles.cache.has("569194996964786178")) return;
  }


  if (!message.content.startsWith(prefix)) {
    if (message.channel.type === "dm") {
      const sendTo = client.channels.cache.get("730042612647723058")
      const report = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setTitle("📩 Message from " + message.author.username)
        .setDescription(message.content)
        .addFields({ name: "Reply", value: "\`+dm " + message.author.id + " \`" })
      sendTo.send(report)

      const embed = new Discord.MessageEmbed()
        .setColor(successColor)
        .setTitle("📨 Sent message to staff")
        .setDescription(message)
        .setFooter("Any message you send here will get sent to staff.");
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
    var strings = require(("./strings/en/" + command.name + ".json"))
    if (message.member) { if (message.member.hasPermission("ADMINISTRATOR") || message.author.id === "722738307477536778") { timestamps.delete(message.author.id) } }
    await message.client.channels.cache.get("748968125663543407").messages.fetch({ limit: 100 }) //languages database
      .then(async langDbMessages => {
        fiMessages = langDbMessages.filter(msg => msg.content.startsWith(message.author.id))
        if (await fiMessages) {
          await fiMessages.forEach(async element => {
            const langprefs = element.content.split(" ")
            const path = ("./strings/" + langprefs[1] + "/" + command.name + ".json")
            await fs.access(path, fs.F_OK, async (err) => {
              if (await err) {
                console.error(err)
                strings = require(("./strings/en/" + command.name + ".json"))
              } else {
                strings = await require(("./strings/" + langprefs[1] + "/" + command.name + ".json"))
              }
            })
          });
        }
      })
    setTimeout(() => { command.execute(strings, message, args); }, 100)
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

client.on('messageReactionAdd', async (reaction, user) => {
  const channelName = reaction.message.channel.name
  if (channelName.includes("review-strings")) {
    if (reaction.emoji.name === "vote_yes" || reaction.emoji.name === "✅" || reaction.emoji.name === "like" || reaction.emoji.name === "👍" || reaction.emoji.name === "approved") {
      console.log("Clear message (saw reaction " + reaction.emoji.name + ")")
      reviewStrings.execute(reaction, user)
    }
  }
  if (reaction.message.id === "733036798736990309" && reaction.emoji.name === "🤖") {
    console.log("The correct reaction for Bot Updates has been added!")
    let role = reaction.message.guild.roles.cache.find(role => role.name === 'Bot Updates')
    client.channels.cache.get("732587569744838777").messages.fetch("733036798736990309")
      .then(message => {
        reaction.message.guild.member(user).roles.add(role)
          .catch(err => {
            console.log(err)
            const receivedEmbed = message.embeds[0];
            const embed = new Discord.MessageEmbed(receivedEmbed)
              .setFooter("An error occurred, please contact QkeleQ#6046.")
              .setColor(errorColor)
            message.edit(embed)
            setInterval(() => {
              embed
                .setDescription("React with 🤖 to get mentioned whenever a bot update comes out. \n_This gives you <@&732615152246980628>._")
                .setFooter("Please check if you received the role after reacting. If not, please contact QkeleQ10#6046.")
                .setColor(neutralColor)
              message.edit(embed)
            }, 5000)
          })
      })
  }
});

client.on('messageReactionRemove', async (reaction, user) => {
  if (reaction.message.id === "733036798736990309" && reaction.emoji.name === "🤖") {
    console.log("The correct reaction for Bot Updates has been removed!")
    let role = reaction.message.guild.roles.cache.find(role => role.name === 'Bot Updates')
    client.channels.cache.get("732587569744838777").messages.fetch("733036798736990309")
      .then(message => {
        reaction.message.guild.member(user).roles.remove(role)
          .catch(err => {
            console.log(err)
            const receivedEmbed = message.embeds[0];
            const embed = new Discord.MessageEmbed(receivedEmbed)
              .setFooter("An error occurred, please contact QkeleQ#6046.")
              .setColor(errorColor)
            message.edit(embed)
            setInterval(() => {
              embed
                .setDescription("React with 🤖 to get mentioned whenever a bot update comes out. \n_This gives you <@&732615152246980628>._")
                .setFooter("Please check if you received the role after reacting. If not, please contact QkeleQ10#6046.")
                .setColor(neutralColor)
              message.edit(embed)
            }, 5000)
          })
      })
  }
});

client.login(token);
