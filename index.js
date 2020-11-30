//Import dependencies and define client
const fs = require("fs")
const fetch = require("node-fetch")
const Discord = require("discord.js")
const client = new Discord.Client()

//Import data, assets and commands
const { prefix, loadingColor, errorColor, successColor, neutralColor, listenStatuses, watchStatuses, randomUser } = require("./config.json")
client.commands = new Discord.Collection()
const commandFiles = fs
  .readdirSync("./commands")
  .filter(file => file.endsWith(".js"))
for (const file of commandFiles) {
  const command = require(`./commands/${file}`)
  client.commands.set(command.name, command)
}
const cooldowns = new Discord.Collection()

//Define assets
const notAllowed = "732298639736570007" //vote_no emoji

//Import events
const stats = require("./events/stats.js")
const inactives = require("./events/inactives.js")


//Run when bot is ready
client.once("ready", async () => {
  console.log("Ready!")

  //Fetch channels
  client.channels.cache.get("732587569744838777").messages.fetch("782638406459064320") //bot-updates reaction role message
  client.channels.cache.get("782635440054206504").messages.fetch() //language-database
  const reviewStringsChannels = await client.channels.cache.filter(c => c.name.endsWith("review-strings"))
  reviewStringsChannels.forEach(c => { c.messages.fetch() })

  //Set status
  client.user.setStatus("online").catch(console.error)
  client.user.setActivity("+help", { type: "WATCHING" })

  //Change status and run events every minute
  setInterval(() => {
    var pickedUser = randomUser[Math.floor(Math.random() * randomUser.length)]
    toPick = Math.random() >= 0.2;

    if (toPick) {
      var listenStatus = listenStatuses[Math.floor(Math.random() * listenStatuses.length)]
      listenStatus = listenStatus.replace("RANDOM_USER", pickedUser)
      client.user.setActivity(listenStatus, { type: "LISTENING" })
      toPick = Math.random() >= 0.6
    } else {
      var watchStatus = watchStatuses[Math.floor(Math.random() * watchStatuses.length)]
      watchStatus = watchStatus.replace("RANDOM_USER", pickedUser)
      client.user.setActivity(watchStatus, { type: "WATCHING" })
      toPick = Math.random() >= 0.2
    }

    stats.execute(client, false)
    inactives.execute(client, false)
  }, 60000)
})


//Run when message is received
client.on("message", async message => {

  //Return if user is a bot or unverified
  if (message.author.bot) return
  if (message.member) {
    if (!message.member.roles.cache.has("569194996964786178")) return //Verified
  } else {
    const server = message.client.guilds.cache.get("549503328472530974")
    const user = server.member(message.author)
    if (!user.roles.cache.has("569194996964786178")) return //Verified
  }

  //Publish message if sent in channel
  if (message.channel.id === "732587569744838777") { //bot-updates
    return fetch(`https://discordapp.com/api/v8/channels/${message.channel.id}/messages/${message.id}/crosspost`, { method: 'Post', headers: { 'Authorization': `Bot ${process.env.TOKEN}` } })
  }

  //Get global strings
  var globalStrings = require(("./strings/en/global.json"))
  var helpStrings = require(("./strings/en/help.json"))
  const oldMessages = await message.client.channels.cache.get("782635440054206504").messages.fetch() //language-database
  const oldFiMessages = await oldMessages.filter(element => element.content.includes(message.author.id))
  oldFiMessages.forEach(async element => {
    oldMsg = element.content.split(" ")
    oldMsg.splice(oldMsg.indexOf(message.author.id), 1)
    globalStrings = require(("./strings/" + oldMsg[0] + "/global.json"))
    helpStrings = require(("./strings/" + oldMsg[0] + "/help.json"))
  })
  var executedBy = globalStrings.executedBy.replace("%%user%%", message.author.tag)

  //+tip command
  if (message.content === "+tip") {
    const embed = new Discord.MessageEmbed()
      .setColor(successColor)
      .setAuthor(globalStrings.tip)
      .setDescription(globalStrings.tips[Math.floor(Math.random() * Object.keys(globalStrings.tips).length)].replace("%%botUpdates%%", "<#732587569744838777>").replace("%%gettingStarted%%", "<#699275092026458122>").replace("%%twitter%%", "(https://twitter.com/HTranslators)").replace("%%translate%%", "(https://discordapp.com/channels/549503328472530974/732587569744838777/754410226601427044)").replace("%%rules%%", "<#699367003135148063>").replace("%%serverInfo%%", "<#699367079241056347>"))
      .setFooter(executedBy)
    return message.channel.send(embed)
  }

  //Link correction system
  if (message.content.includes("/translate/") && message.content.includes("://")) if (message.channel.id === "549503328472530976" || message.channel.id === "627594632779399195") { // hypixel translators and proofreaders
    var msgTxt = (" " + message.content).slice(1).replace(/translate\.hypixel\.net/g, "crowdin.com").replace(/\/en-(?!en)[a-z]{2,4}/g, '/en-en')
    if (message.content !== msgTxt) {
      message.react(notAllowed) 
      message.channel.send(globalStrings.linkCorrection.replace("%%user%%", "<@" + message.author.id + ">") + "\n\n>>> " + msgTxt)
    }
  }

  //Staff messaging system
  if (!message.content.startsWith(prefix)) {
    if (message.channel.type === "dm") {
      const sendTo = client.channels.cache.get("730042612647723058") //bot-development
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
      return message.channel.send(embed)
    } else return //Stop if not starting with prefix
  }

  //Define command and stop if none is found
  const args = message.content.slice(prefix.length).split(/ +/)
  const commandName = args.shift().toLowerCase()
  const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName))
  if (!command) return

  //Blacklist and whitelist systems
  let allowed = true
  if (command.categoryBlackList && command.categoryBlackList.includes(message.channel.parent.id)) allowed = false
  if (command.categoryWhiteList && !command.categoryWhiteList.includes(message.channel.parent.id)) allowed = false
  else allowed = true
  if (command.channelBlackList && command.channelBlackList.includes(message.channel.id)) allowed = false
  if (command.channelWhiteList && !command.channelWhiteList.includes(message.channel.id)) allowed = false
  else allowed = true
  if (message.member.hasPermission("ADMINISTRATOR")) allowed = true
  if (!allowed) return message.react(notAllowed)

  //Stop and error if command is not allowed in DMs and command is sent in DMs
  if (!command.allowDM && message.channel.type === "dm") {
    const embed = new Discord.MessageEmbed()
      .setColor(errorColor)
      .setAuthor(globalStrings.error)
      .setTitle(globalStrings.dmError)
      .setFooter(executedBy)
    return message.channel.send(embed)
  }
  //Cooldown system
  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Discord.Collection())
  }
  const now = Date.now();
  const timestamps = cooldowns.get(command.name)
  const cooldownAmount = (command.cooldown || 3) * 1000
  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount
    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      var timeLeftS
      if (Math.ceil(timeLeft) > 120) {
        timeLeftS = (globalStrings.minsLeftT.replace("%%time%%", Math.ceil(timeLeft / 60)).replace("%%command%%", command.name))
      } else {
        timeLeftS = (globalStrings.timeLeftT.replace("%%time%%", Math.ceil(timeLeft)).replace("%%command%%", command.name))
      }
      const embed = new Discord.MessageEmbed()
        .setColor(errorColor)
        .setAuthor(globalStrings.cooldown)
        .setTitle(timeLeftS)
        .setFooter(executedBy)
    }
  }

  //Remove cooldown if administrator
  if (message.member) if (message.member.hasPermission("ADMINISTRATOR")) timestamps.set(message.author.id, now)
  setTimeout(() => { timestamps.delete(message.author.id) }, cooldownAmount)

  //Get command strings
  var strings = require(("./strings/en/" + command.name + ".json"))
  oldFiMessages.forEach(async element => {
    oldMsg = element.content.split(" ")
    oldMsg.splice(oldMsg.indexOf(message.author.id), 1)
    strings = require(("./strings/" + oldMsg[0] + "/" + command.name + ".json"))
  })
  globalStrings.executedBy.replace("%%user%%", message.author.tag)

  //Run command and handle errors
  //setTimeout(() => {
  try { command.execute(strings, message, args) }
  catch (error) {

    //Handle errors
    console.log("Error incoming! Message:\n>>>" + message)
    console.error(error);
    timestamps.delete(message.author.id)
    const embed = new Discord.MessageEmbed()
      .setColor(errorColor)
      .setAuthor(globalStrings.error)
      .setTitle(globalStrings[error] || error)
      .setFooter(executedBy)
    if (!helpStrings[command.name]) {
      embed.addFields({ name: globalStrings.usage, value: "`" + command.usage + "`" })
    } else {
      embed.addFields({ name: globalStrings.usage, value: "`" + helpStrings[command.name].usage + "`" })
    }
    message.channel.send(embed)

  } finally {

    //Try sending a tip
    var d = Math.random(); var s = Math.round(Math.random())
    if (d < 0.05) message.channel.send(`**${globalStrings.tip.toUpperCase()}:** ${globalStrings.tips[globalStrings.tips.length * Math.random() | 0].replace("%%botUpdates%%", "<#732587569744838777>").replace("%%gettingStarted%%", "<#699275092026458122>").replace("%%twitter%%", "(https://twitter.com/HTranslators)").replace("%%translate%%", "(https://discordapp.com/channels/549503328472530974/732587569744838777/754410226601427044)").replace("%%rules%%", "<#699367003135148063>").replace("%%serverInfo%%", "<#699367079241056347>")}`)

  }
  //}, 50)
})


//Run when reaction is added
client.on('messageReactionAdd', async (reaction, user) => {
  const channel = reaction.message.channel

  //Delete message when channel name ends with review-strings
  if (channel.name.endsWith("review-strings")) {
    if (reaction.emoji.name === "vote_yes" || reaction.emoji.name === "✅" || reaction.emoji.name === "like" || reaction.emoji.name === "👍" || reaction.emoji.name === "approved") {
      reaction.message.react("⏱")
      reaction.message.react(reaction.emoji)
      setTimeout(() => {
        reaction.message.delete()
        console.log("String reviewed (saw reaction " + reaction.emoji.name + ")")
      }, 10000)
    }
  }

  //Give role if reacted on reaction role message
  if (reaction.message.id === "782638406459064320" && reaction.emoji.name === "🤖") { //bot-updates reaction role message
    console.log("The correct reaction for Bot Updates has been added!")
    let role = reaction.message.guild.roles.cache.find(role => role.name === 'Bot Updates')
    client.channels.cache.get("732587569744838777").messages.fetch("782638406459064320") //bot-updates reaction role message
      .then(message => {
        reaction.message.guild.member(user).roles.add(role, "Added the reaction in bot-updates")
          .catch(err => {
            console.log(err)
            const receivedEmbed = message.embeds[0];
            const embed = new Discord.MessageEmbed(receivedEmbed)
              .setFooter("An error occurred, please contact the staff team.")
              .setColor(errorColor)
            message.edit(embed)
            setInterval(() => {
              embed
                .setDescription("React with 🤖 to get mentioned whenever a bot update comes out. \n_This gives you <@&732615152246980628>._")
                .setFooter("Please check if you received the role after reacting. If not, please contact the staff team.")
                .setColor(neutralColor)
              message.edit(embed)
            }, 5000)
          })
      })

  }
})


//Run when reaction is removed
client.on('messageReactionRemove', async (reaction, user) => {

  //Take role if reaction removed from reaction role message
  if (reaction.message.id === "782638406459064320" && reaction.emoji.name === "🤖") { //bot-updates reaction role message
    console.log("The correct reaction for Bot Updates has been removed!")
    let role = reaction.message.guild.roles.cache.find(role => role.name === 'Bot Updates')
    client.channels.cache.get("732587569744838777").messages.fetch("782638406459064320") //bot-updates reaction role message
      .then(message => {
        reaction.message.guild.member(user).roles.remove(role, "Removed the reaction in bot-updates")
          .catch(err => {
            console.log(err)
            const receivedEmbed = message.embeds[0];
            const embed = new Discord.MessageEmbed(receivedEmbed)
              .setTitle("Get notified of bot updates")
              .setFooter("An error occurred, please contact the staff team.")
              .setColor(errorColor)
            message.edit(embed)
            setInterval(() => {
              embed
                .setTitle("Get notified of bot updates")
                .setDescription("React with 🤖 to get mentioned whenever a bot update comes out. \n_This gives you <@&732615152246980628>._")
                .setFooter("Please check if you received the role after reacting. If not, please contact the staff team.")
                .setColor(neutralColor)
              message.edit("", embed)
            }, 5000)
          })
      })

  }
})


//Log in
client.login(process.env.TOKEN)
