//Import dependencies and define client
const fs = require("fs")
const fetch = require("node-fetch")
const Discord = require("discord.js")
const client = new Discord.Client()
require("dotenv").config()

//Import data, assets and commands
const { prefix, loadingColor, errorColor, successColor, neutralColor, blurple, listenStatuses, watchStatuses } = require("./config.json")
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
const approved = "732298639749152769"
const notAllowed = "732298639736570007" //vote_no emoji

//Import events
const stats = require("./events/stats.js")
const inactives = require("./events/inactives.js")
const unzalgo = require("./events/unzalgo.js")


//Run when bot is ready
client.once("ready", async () => {
  console.log("Ready!")

  //Fetch channels
  client.guilds.cache.get("549503328472530974").members.fetch() //Guild members
  client.channels.cache.get("762341271611506708").messages.fetch("783125633101987930") //server-info roles message
  client.channels.cache.get("569178590697095168").messages.fetch("787366444970541056") //verify message
  client.channels.cache.get("782635440054206504").messages.fetch() //language-database
  const reviewStringsChannels = await client.channels.cache.filter(c => c.name.endsWith("review-strings"))
  reviewStringsChannels.forEach(c => { c.messages.fetch() })

  //Get server boosters and staff for the status
  let boostersStaff = []
  client.guilds.cache.get("549503328472530974").roles.cache.get("644450674796396576").members.forEach(member => boostersStaff.push(member.user.username))//Server Booster
  client.guilds.cache.get("549503328472530974").roles.cache.get("768435276191891456").members.forEach(member => boostersStaff.push(member.user.username))//Discord Staff

  //Set status
  client.user.setStatus("online").catch(console.error)
  client.user.setActivity("+help", { type: "LISTENING" })

  //Change status and run events every minute
  setInterval(() => {
    const pickedUser = boostersStaff[Math.floor(Math.random() * boostersStaff.length)]
    toPick = Math.random() >= 0.2

    if (toPick) {
      let listenStatus = listenStatuses[Math.floor(Math.random() * listenStatuses.length)]
      listenStatus = listenStatus.replace("RANDOM_USER", pickedUser)
      client.user.setActivity(listenStatus, { type: "LISTENING" })
      toPick = Math.random() >= 0.6
    } else {
      let watchStatus = watchStatuses[Math.floor(Math.random() * watchStatuses.length)]
      watchStatus = watchStatus.replace("RANDOM_USER", pickedUser)
      client.user.setActivity(watchStatus, { type: "WATCHING" })
      toPick = Math.random() >= 0.2
    }

    stats.execute(client, false)
    inactives.execute(client, false)
    unzalgo.execute(client, false)
  }, 60000)
})


//Run when message is received
client.on("message", async message => {

  //Delete pinned message messages
  if (message.type === "PINS_ADD") message.delete()

  //Define command and stop if none is found
  const args = message.content.slice(prefix.length).split(/ +/)
  const commandName = args.shift().toLowerCase()
  const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName))
  if (!command) return

  //Return if user is a bot or not verified
  if (message.author.bot) return
  if (message.member && !message.member.roles.cache.has("569194996964786178") && command.name !== "verify") return //Verified
  else {
    const server = message.client.guilds.cache.get("549503328472530974")
    const user = server.member(message.author)
    if (!user.roles.cache.has("569194996964786178") && command.name !== "verify") return //Verified
  }

  //Publish message if sent in channel
  if (message.channel.id === "732587569744838777") { //bot-updates
    message.crosspost()
  }

  //Get global strings
  let globalStrings = require(("./strings/en/global.json"))
  let helpStrings = require(("./strings/en/help.json"))
  const oldMessages = await message.client.channels.cache.get("782635440054206504").messages.fetch() //language-database
  const oldFiMessages = await oldMessages.filter(element => element.content.includes(message.author.id))
  oldFiMessages.forEach(async element => {
    oldMsg = element.content.split(" ")
    oldMsg.splice(oldMsg.indexOf(message.author.id), 1)
    globalStrings = require(("./strings/" + oldMsg[0] + "/global.json"))
    helpStrings = require(("./strings/" + oldMsg[0] + "/help.json"))
  })
  let executedBy = globalStrings.executedBy.replace("%%user%%", message.author.tag)

  //Link correction system
  if (message.content.includes("/translate/") && message.content.includes("://")) if (message.channel.id === "549503328472530976" || message.channel.id === "627594632779399195") { // hypixel translators and proofreaders
    let msgTxt = (" " + message.content).slice(1).replace(/translate\.hypixel\.net/g, "crowdin.com").replace(/\/en-(?!en)[a-z]{2,4}/g, "/en-en")
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
        .setFooter(globalStrings.outgoingDisclaimer)
      return message.channel.send(embed)
    } else return //Stop if it starts with prefix
  }

  //Role Blacklist and Whitelist system
  let allowed = true
  if (message.guild.id === "549503328472530974") {
    if (command.roleBlacklist) {
      allowed = true
      if (allowed) {
        command.roleBlacklist.forEach(role => {
          if (message.member.roles.cache.has(role)) allowed = false
        })
      }
    }
    if (command.roleWhitelist) {
      allowed = false
      if (!allowed) {
        command.roleWhitelist.forEach(role => {
          if (message.member.roles.cache.has(role)) allowed = true
        })
      }
    }

    //Channel Blacklist and whitelist systems
    if (command.categoryBlacklist && command.categoryBlacklist.includes(message.channel.parent.id)) allowed = false
    else if (command.channelBlacklist && command.channelBlacklist.includes(message.channel.id)) allowed = false
    else if (command.categoryWhitelist && !command.categoryWhitelist.includes(message.channel.parent.id)) allowed = false
    else if (command.channelWhitelist && !command.channelWhitelist.includes(message.channel.id)) allowed = false

    //Prevent users from running commands in development
    if (command.dev && !message.member.roles.cache.has("768435276191891456")) allowed = false

    //Give perm to admins and return if not allowed
    if (message.member.hasPermission("ADMINISTRATOR")) allowed = true
  }
  if (!allowed) {
    message.react(notAllowed)
    setTimeout(() => {
      if (!message.deleted) message.delete()
    }, 5000);
    return
  }

  //Stop and error if command is not allowed in DMs and command is sent in DMs
  if (!command.allowDM && message.channel.type === "dm") {
    const embed = new Discord.MessageEmbed()
      .setColor(errorColor)
      .setAuthor(globalStrings.error)
      .setTitle(globalStrings.dmError)
      .setFooter(executedBy, message.author.displayAvatarURL())
    return message.channel.send(embed)
  }
  //Cooldown system
  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Discord.Collection())
  }
  const now = Date.now()
  const timestamps = cooldowns.get(command.name)
  const cooldownAmount = (command.cooldown || 3) * 1000
  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount
    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000
      let timeLeftS
      if (Math.ceil(timeLeft) >= 120) {
        timeLeftS = (globalStrings.minsLeftT.replace("%%time%%", Math.ceil(timeLeft / 60)).replace("%%command%%", commandName))
      } else if (Math.ceil(timeLeft) === 1) {
        timeLeftS = (globalStrings.secondLeft.replace("%%command%%", commandName))
      } else {
        timeLeftS = (globalStrings.timeLeftT.replace("%%time%%", Math.ceil(timeLeft)).replace("%%command%%", commandName))
      }
      const embed = new Discord.MessageEmbed()
        .setColor(errorColor)
        .setAuthor(globalStrings.cooldown)
        .setTitle(timeLeftS)
        .setFooter(executedBy, message.author.displayAvatarURL())
      message.channel.send(embed)
      return
    }
  }

  //Remove cooldown if administrator
  if (message.member && !message.member.hasPermission("ADMINISTRATOR")) timestamps.set(message.author.id, now)
  setTimeout(() => { timestamps.delete(message.author.id) }, cooldownAmount)

  //Get command strings
  let strings = require(("./strings/en/" + command.name + ".json"))
  oldFiMessages.forEach(async element => {
    oldMsg = element.content.split(" ")
    oldMsg.splice(oldMsg.indexOf(message.author.id), 1)
    strings = require(("./strings/" + oldMsg[0] + "/" + command.name + ".json"))
  })
  globalStrings.executedBy.replace("%%user%%", message.author.tag)

  //Run command and handle errors
  try { command.execute(message, strings, args, globalStrings) }
  catch (error) {

    //Handle errors
    console.log("Error incoming! Message:\n>>>" + message)
    console.error(error)
    timestamps.delete(message.author.id)
    const embed = new Discord.MessageEmbed()
      .setColor(errorColor)
      .setAuthor(globalStrings.error)
      .setTitle(globalStrings[error] || error)
      .setFooter(executedBy, message.author.displayAvatarURL())
    if (!helpStrings[command.name]) {
      embed.addFields({ name: globalStrings.usage, value: "`" + command.usage + "`" })
    } else {
      embed.addFields({ name: globalStrings.usage, value: "`" + helpStrings[command.name].usage + "`" })
    }
    message.channel.send(embed)
    return

  } finally {

    //Try sending a tip
    if (command.name !== "verify" && command.name !== "mention") {
      let d = Math.random().toFixed(2)
      let keys = Object.keys(globalStrings.tips)
      let tip = globalStrings.tips[keys[keys.length * Math.random() << 0]]
      if (d < 0.05) message.channel.send(`**${globalStrings.tip.toUpperCase()}:** ${tip.replace("%%botUpdates%%", "<#732587569744838777>").replace("%%gettingStarted%%", "<#699275092026458122>").replace("%%twitter%%", "<https://twitter.com/HTranslators>").replace("%%translate%%", "<https://discordapp.com/channels/549503328472530974/732587569744838777/754410226601427044>").replace("%%rules%%", "<#699367003135148063>").replace("%%serverInfo%%", "<#762341271611506708>")}`)
    }
  }
})


//Run when reaction is added
client.on("messageReactionAdd", async (reaction, user) => {
  const channel = reaction.message.channel
  if (channel.type !== "dm") {
    //Delete message when channel name ends with review-strings
    if (channel.name.endsWith("review-strings") && !user.bot) {
      if (reaction.emoji.name === "vote_yes" || reaction.emoji.name === "✅" || reaction.emoji.name === "like" || reaction.emoji.name === "👍" || reaction.emoji.name === "approved") {
        reaction.message.react("⏱")
        reaction.message.react(reaction.emoji)
        setTimeout(() => {
          if (!reaction.message.deleted) reaction.message.delete()
          console.log(`String reviewed in ${reaction.message.channel.name} (saw reaction ${reaction.emoji.name})`)
        }, 10000)
      }
    }

    //Give Polls role if reacted on reaction role message
    if (reaction.message.id === "783125633101987930" && reaction.emoji.name === "📊" && !user.bot) { //server-info roles message
      reaction.message.guild.member(user).roles.add("646098170794868757", "Removed the reaction in server-info")
        .then(() => console.log("Gave the Polls role to " + user.tag))
        .catch(err => console.log("An error occured while trying to give the Polls role to " + user.tag + ". Here's the error:\n" + err))
    }

    //Give Bot Updates role if reacted on reaction role message
    if (reaction.message.id === "783125633101987930" && reaction.emoji.name === "🤖" && !user.bot) { //server-info roles message
      reaction.message.guild.member(user).roles.add("732615152246980628", "Removed the reaction in server-info")
        .then(() => console.log("Gave the Bot Updates role to " + user.tag))
        .catch(err => console.log("An error occured while trying to give the Bot Updates role to " + user.tag + ". Here's the error:\n" + err))
    }
  }
})


//Run when reaction is removed
client.on("messageReactionRemove", async (reaction, user) => {

  const channel = reaction.message.channel
  if (channel.type !== "dm") {
    //Take Polls role if reaction removed from reaction role message
    if (reaction.message.id === "783125633101987930" && reaction.emoji.name === "📊" && !user.bot) { //server-info roles message
      reaction.message.guild.member(user).roles.remove("646098170794868757", "Removed the reaction in server-info")
        .then(() => console.log("Took the Polls role from " + user.tag))
        .catch(err => console.log("An error occured while trying to take the Polls role from " + user.tag + ". Here's the error:\n" + err))
    }

    //Take Bot updates role if reaction removed from reaction role message
    if (reaction.message.id === "783125633101987930" && reaction.emoji.name === "🤖" && !user.bot) { //server-info roles message
      reaction.message.guild.member(user).roles.remove("732615152246980628", "Removed the reaction in server-info")
        .then(() => console.log("Took the Bot Updates role from " + user.tag))
        .catch(err => console.log("An error occured while trying to take the Bot Updates role from " + user.tag + ". Here's the error:\n" + err))
    }
  }
})

//Run when someone leaves
client.on("guildMemberRemove", member => {
  //Run if the member who leaves had the Bot Translator/Proofreader/Manager roles
  const botRole = member.roles.cache.find(role => role.name.startsWith("Bot ") && role.id !== "732615152246980628")
  if (botRole) { //bot updates
    client.channels.cache.get("768160446368186428").send(`${member.user.tag} had the <@&${botRole.id}> role and just left the server!`) //managers
    console.log(`${member.user.tag} left and had the ${botRole.name} role`)
  }
})

//Log in
client.login(process.env.TOKEN)
