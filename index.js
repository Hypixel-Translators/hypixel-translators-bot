const fs = require("fs");
const Discord = require("discord.js");
const { prefix, workingColor, errorColor, successColor, neutralColor, listenStatuses, watchStatuses, randomUser } = require("./config.json");
const token = process.env.TOKEN

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

  client.channels.cache.get("732587569744838777").messages.fetch("733036798736990309")
  client.channels.cache.get("732326676192690236").messages.fetch()
  client.channels.cache.get("734081393499308053").messages.fetch()
  client.channels.cache.get("732326761882321046").messages.fetch()
  client.channels.cache.get("748968125663543407").messages.fetch() //languages database

  client.user.setStatus("online").catch(console.error);

  setInterval(() => {
    var pickedUser = randomUser[Math.floor(Math.random() * randomUser.length)]
    toPick = Math.random() >= 0.2;
    client.user.setActivity("+help", { type: "WATCHING" });

    if (toPick) {
      var listenStatus = listenStatuses[Math.floor(Math.random() * listenStatuses.length)]
      listenStatus = listenStatus.replace("RANDOM_USER", pickedUser)
      client.user.setActivity(listenStatus, { type: "LISTENING" });
      toPick = Math.random() >= 0.6;
    } else {
      var watchStatus = watchStatuses[Math.floor(Math.random() * watchStatuses.length)]
      watchStatus = watchStatus.replace("RANDOM_USER", pickedUser)
      client.user.setActivity(watchStatus, { type: "WATCHING" });
      toPick = Math.random() >= 0.2;
    }

    stats.execute(client, false)
  }, 30000);
});


client.on("message", async message => {
  const notAllowed = client.emojis.cache.find(emoji => emoji.name === 'vote_no'); // "🚫"
  if (message.author.bot) return;
  if (message.member) {
    if (!message.member.roles.cache.has("569194996964786178")) return;
  } else {
    const server = message.client.guilds.cache.get("549503328472530974")
    const user = server.member(message.author)
    if (!user.roles.cache.has("569194996964786178")) return;
  }

  var globalStrings = require(("./strings/en/global.json"))
  var helpStrings = require(("./strings/en/help.json"))
  const oldMessages = await message.client.channels.cache.get("748968125663543407").messages.fetch() //languages database
  const oldFiMessages = await oldMessages.filter(element => element.content.includes(message.author.id))
  oldFiMessages.forEach(async element => {
    oldMsg = element.content.split(" ")
    oldMsg.splice(oldMsg.indexOf(message.author.id), 1)
    globalStrings = require(("./strings/" + oldMsg[0] + "/global.json"))
    helpStrings = require(("./strings/" + oldMsg[0] + "/help.json"))
  })
  var executedBy = globalStrings.executedBy.replace("%%user%%", message.author.tag)

  if (message.content === "+stats" && message.member.hasPermission("VIEW_AUDIT_LOG")) { stats.execute(client, true); return; }
  if (message.content === "+tip") {
    const embed = new Discord.MessageEmbed()
      .setColor(successColor)
      .setAuthor(globalStrings.tip)
      .setDescription(globalStrings.tips[Math.floor(Math.random() * Object.keys(globalStrings.tips).length)])
      .setFooter(executedBy)
    message.channel.send(embed)
  }

  if (message.content.includes("/translate/") && message.content.includes("://") && message.channel.id === "730042612647723058") {
    var msgTxt = (" " + message.content).slice(1).replace(/translate\.hypixel\.net/g, "crowdin.com").replace(/\/en-(?!en)[a-z]{2,4}/g, '/en-en')
    if (message.content != msgTxt) message.react(notAllowed); message.channel.send("<@" + message.author.id + "> _Please change the link to the `crowdin.com/translate/.../.../en-en` format next time._\n\n>>> " + msgTxt)
  }

  if (!message.content.startsWith(prefix)) {
    if (message.channel.type === "dm") {
      const sendTo = client.channels.cache.get("730042612647723058")
      const report = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setAuthor("Incoming message from " + message.author.tag)
        .setDescription(message.content)
        .addFields({ name: "To reply", value: "\`+dm " + message.author.id + " \`" })
      sendTo.send(report)

      const embed = new Discord.MessageEmbed()
        .setColor(successColor)
        .setAuthor(globalStrings.outgoing)
        .setDescription(message.content)
        .setFooter(globalStrings.outgoingDisclaimer);
      message.channel.send(embed)
      return;
    } else { return; }
  }


  const args = message.content.slice(prefix.length).split(/ +/);
  const commandName = args.shift().toLowerCase();
  const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

  if (!command) return;

  if (command.allowDM) {
    if (message.channel.type !== "dm") {
      if (command.channelWhiteList) { if (!command.channelWhiteList.includes(message.channel.id) && !message.member.hasPermission("ADMINISTRATOR") && message.author.id !== "722738307477536778") { message.react(notAllowed); return; } }
      if (command.categoryWhiteList) { if (!command.categoryWhiteList.includes(message.channel.parent.id) && !message.member.hasPermission("ADMINISTRATOR") && message.author.id !== "722738307477536778") { message.react(notAllowed); return; } }
      if (command.channelBlackList) { if (command.channelBlackList.includes(message.channel.id) && !message.member.hasPermission("ADMINISTRATOR") && message.author.id !== "722738307477536778") { message.react(notAllowed); return; } }
      if (command.categoryBlackList) { if (command.categoryBlackList.includes(message.channel.parent.id) && !message.member.hasPermission("ADMINISTRATOR") && message.author.id !== "722738307477536778") { message.react(notAllowed); return; } }
    }
  } else {
    if (message.channel.type !== "dm") {
      if (command.channelWhiteList) { if (!command.channelWhiteList.includes(message.channel.id) && !message.member.hasPermission("ADMINISTRATOR") && message.author.id !== "722738307477536778") { message.react(notAllowed); return; } }
      if (command.categoryWhiteList) { if (!command.categoryWhiteList.includes(message.channel.parent.id) && !message.member.hasPermission("ADMINISTRATOR") && message.author.id !== "722738307477536778") { message.react(notAllowed); return; } }
      if (command.channelBlackList) { if (command.channelBlackList.includes(message.channel.id) && !message.member.hasPermission("ADMINISTRATOR") && message.author.id !== "722738307477536778") { message.react(notAllowed); return; } }
      if (command.categoryBlackList) { if (command.categoryBlackList.includes(message.channel.parent.id) && !message.member.hasPermission("ADMINISTRATOR") && message.author.id !== "722738307477536778") { message.react(notAllowed); return; } }
    } else {
      const embed = new Discord.MessageEmbed()
        .setColor(errorColor)
        .setAuthor(globalStrings.error)
        .setTitle(globalStrings.dmError)
        .setFooter(executedBy)
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
      setTimeout(() => {
        const timeLeft = (expirationTime - now) / 1000;
        var timeLeftT
        if (timeLeft => 120) { timeLeftT = globalStrings.minsLeftT.replace("%%time%%", Math.ceil(timeLeft / 60)).replace("%%command%%", command.name) } else {
          timeLeftT = globalStrings.timeLeftT.replace("%%time%%", Math.ceil(timeLeft)).replace("%%command%%", command.name)
        }
        return message.channel.send(timeLeftT)
      }, 100)
    }
  }

  if (message.member) if (message.member.hasPermission("BAN_MEMBERS")) timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

  var strings = require(("./strings/en/" + command.name + ".json"))
  oldFiMessages.forEach(async element => {
    oldMsg = element.content.split(" ")
    oldMsg.splice(oldMsg.indexOf(message.author.id), 1)
    strings = require(("./strings/" + oldMsg[0] + "/" + command.name + ".json"))
  })
  globalStrings.executedBy.replace("%%user%%", message.author.tag)
  setTimeout(() => {
    try {
      command.execute(strings, message, args)
    } catch (error) {
      timestamps.delete(message.author.id)
      console.error(error);
      const embed = new Discord.MessageEmbed()
        .setColor(errorColor)
        .setAuthor(globalStrings.error)
        .setTitle(globalStrings[error] || error)
        //.setDescription(globalStrings.generalError)
        .setFooter(executedBy)
      if (!helpStrings[command.name]) { embed.addFields({ name: globalStrings.usage, value: "`" + command.usage + "`" }) } else { embed.addFields({ name: globalStrings.usage, value: "`" + helpStrings[command.name].usage + "`" }) }
      message.channel.send(embed)
    }
    var d = Math.random(); var s = Math.round(Math.random()); if (d < 0.05) message.channel.send(`**${globalStrings.tip.toUpperCase()}:** ${globalStrings.tips[globalStrings.tips.length * Math.random() | 0]}`)
  }, 50)
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
              .setFooter("An error occurred, please contact QkeleQ10#6046.")
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
              .setFooter("An error occurred, please contact QkeleQ10#6046.")
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
