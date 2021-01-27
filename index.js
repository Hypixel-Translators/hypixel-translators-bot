//Import dependencies and define client
const fs = require("fs")
const fetch = require("node-fetch")
const Discord = require("discord.js")
const client = new Discord.Client()
const { registerFont, createCanvas, loadImage } = require("canvas")
require("dotenv").config()

//Import data, assets and commands
const { prefix, loadingColor, errorColor, successColor, neutralColor, blurple, listeningStatuses, watchingStatuses, playingStatuses } = require("./config.json")
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
  client.channels.cache.get("762341271611506708").messages.fetch("800415711864029204") //server-info roles message
  client.channels.cache.get("569178590697095168").messages.fetch("787366444970541056") //verify message
  client.channels.cache.get("782635440054206504").messages.fetch() //language-database
  const reviewStringsChannels = await client.channels.cache.filter(c => c.name.endsWith("review-strings"))
  reviewStringsChannels.forEach(c => { c.messages.fetch() })

  //Get server boosters and staff for the status
  let boostersStaff = []
  client.guilds.cache.get("549503328472530974").roles.cache.get("644450674796396576").members.forEach(member => boostersStaff.push(member.user.username)) //Server Booster
  client.guilds.cache.get("549503328472530974").roles.cache.get("768435276191891456").members.forEach(member => boostersStaff.push(member.user.username)) //Discord Staff

  //Set status
  client.user.setStatus("online").catch(console.error)
  client.user.setActivity("+help", { type: "LISTENING" })

  //Change status and run events every minute
  setInterval(() => {
    const pickedUser = boostersStaff[Math.floor(Math.random() * boostersStaff.length)]
    const toPick = Math.ceil(Math.random() * 100) //get percentage
    const statusType = client.user.presence.activities[0].type

    if (toPick > 66) { //Higher than 66%
      let playingStatus = playingStatuses[Math.floor(Math.random() * playingStatuses.length)]
      playingStatus = playingStatus.replace("RANDOM_USER", pickedUser)
      client.user.setActivity(playingStatus, { type: "PLAYING" })
    } else if (toPick <= 66 && toPick > 33) { //Between 33% and 66% (inclusive)
      let watchStatus = watchingStatuses[Math.floor(Math.random() * watchingStatuses.length)]
      watchStatus = watchStatus.replace("RANDOM_USER", pickedUser)
      client.user.setActivity(watchStatus, { type: "WATCHING" })
    } else if (toPick <= 33 && toPick > 0) { //Between 0% and 33% (inclusive)
      let listenStatus = listeningStatuses[Math.floor(Math.random() * listeningStatuses.length)]
      listenStatus = listenStatus.replace("RANDOM_USER", pickedUser)
      client.user.setActivity(listenStatus, { type: "LISTENING" })
    } else console.error("Couldn't set the status because the percentage is a weird number: " + toPick)

    stats.execute(client, false)
    inactives.execute(client, false)
    unzalgo.execute(client, false)
  }, 60000)
})

//Run when message is received
client.on("message", async message => {

  //Delete pinned message messages
  if (message.type === "PINS_ADD" && message.channel.type !== "dm") message.delete()

  //Publish message if sent in bot-updates
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
  if (message.content.toLowerCase().includes("/translate/hypixel/") && message.content.includes("://")) if (message.channel.id === "549503328472530976" || message.channel.id === "627594632779399195") { // hypixel translators and proofreaders
    const msgTxt = message.content.replace(/translate\.hypixel\.net/gi, "crowdin.com").replace(/\/en-(?!en#)[a-z]{2,4}/gi, "/en-en")
    if (message.content !== msgTxt) {
      message.react(notAllowed)
      const embed = new Discord.MessageEmbed()
        .setColor(errorColor)
        .setAuthor(globalStrings.linkCorrectionName)
        .setTitle(globalStrings.linkCorrectionDesc.replace("%%format%%", "`crowdin.com/translate/.../.../en-en`"))
        .setDescription(msgTxt)
      message.channel.send(`<@${message.author.id}>`, embed)
    }
  }

  //Staff messaging system
  if (!message.content.startsWith(prefix) && message.author !== client.user && message.channel.type === "dm") {
    const staffMsg = new Discord.MessageEmbed()
      .setColor(neutralColor)
      .setAuthor("Incoming message from " + message.author.tag)
      .setDescription(message.content)
      .addFields({ name: "To reply", value: `\`+dm ${message.author.id} \`` })
    client.channels.cache.get("624881429834366986").send(staffMsg) //staff-bots

    const embed = new Discord.MessageEmbed()
      .setColor(successColor)
      .setAuthor(globalStrings.outgoing)
      .setDescription(message.content)
      .setFooter(globalStrings.outgoingDisclaimer)
    return message.channel.send(embed)
  }

  //Stop if the message is not a command
  if (!message.content.startsWith(prefix)) return

  //Define command and stop if none is found
  const args = message.content.slice(prefix.length).split(/ +/)
  const commandName = args.shift().toLowerCase()
  const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName))
  if (!command) return

  //Log if command is ran in DMs
  if (message.channel.type === "dm") console.log(message.author.tag + " used command " + commandName + " in DMs")

  //Return if user is a bot or not verified
  if (message.author.bot) return
  if (message.member && !message.member.roles.cache.has("569194996964786178") && command.name !== "verify") return //Verified
  else {
    const server = message.client.guilds.cache.get("549503328472530974")
    const user = server.member(message.author)
    if (!user.roles.cache.has("569194996964786178") && command.name !== "verify") return //Verified
  }

  //Role Blacklist and Whitelist system
  let allowed = true
  if (message.channel.type !== "dm") {
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
      if (command.dev && !message.member.roles.cache.has("768435276191891456")) allowed = false //Discord Staff

      //Give perm to admins and return if not allowed
      if (message.member.hasPermission("MANAGE_ROLES")) allowed = true
    } else allowed = false
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
      .setTitle(globalStrings.errors.dmError)
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
  if (message.member && !message.member.hasPermission("MANAGE_ROLES")) timestamps.set(message.author.id, now)
  setTimeout(() => { timestamps.delete(message.author.id) }, cooldownAmount)

  //Get command strings
  let strings = require(("./strings/en/" + command.name + ".json"))
  oldFiMessages.forEach(async element => {
    oldMsg = element.content.split(" ")
    oldMsg.splice(oldMsg.indexOf(message.author.id), 1)
    try { strings = require(("./strings/" + oldMsg[0] + "/" + command.name + ".json")) }
    catch { console.error(`Couldn't get command strings for the command ${command.name} on the language ${oldMsg[0]}. The file does not exist yet.`) }
  })
  globalStrings.executedBy.replace("%%user%%", message.author.tag)

  //Run command and handle errors
  try { command.execute(message, strings, args, globalStrings) }
  catch (error) {

    //Handle errors
    console.error(`Error with command ${commandName} on channel ${message.channel.name} executed by ${message.author.tag}. Here's the error: ${error}`)
    timestamps.delete(message.author.id)
    const embed = new Discord.MessageEmbed()
      .setColor(errorColor)
      .setAuthor(globalStrings.error)
      .setTitle(globalStrings.errors[error] || error)
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
      if (d < 0.05) message.channel.send(`**${globalStrings.tip.toUpperCase()}:** ${tip.replace("%%botUpdates%%", "<#732587569744838777>").replace("%%gettingStarted%%", "<#699275092026458122>").replace("%%twitter%%", "<https://twitter.com/HTranslators>").replace("%%rules%%", "<#699367003135148063>").replace("%%serverInfo%%", "<#762341271611506708>").replace("%%bots%%", "<#549894938712866816>")}`)
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
    if (reaction.message.id === "800415711864029204" && !user.bot) { //server-info roles message
      let roleId
      if (reaction.emoji.name === "📊") roleId = "646098170794868757" //Polls
      else if (reaction.emoji.name === "🤖") roleId = "732615152246980628" //Bot Updates
      else if (reaction.emoji.name === "🎉") roleId = "801052623745974272" //Giveaway pings
      else return
      reaction.message.guild.member(user).roles.add(roleId, "Removed the reaction in server-info")
        .then(() => console.log(`Gave the ${reaction.message.guild.roles.cache.get(roleId).name} role to ${user.tag}`))
        .catch(err => console.error(`An error occured while trying to give the ${reaction.message.guild.roles.cache.get(roleId).name} role to ${user.tag}. Here's the error:\n${err}`))
    }
  }
})


//Run when reaction is removed
client.on("messageReactionRemove", async (reaction, user) => {
  if (reaction.message.channel.type !== "dm") {
    //Reaction roles
    if (reaction.message.id === "800415711864029204" && !user.bot) { //server-info roles message
      let roleId
      if (reaction.emoji.name === "📊") roleId = "646098170794868757" //Polls
      else if (reaction.emoji.name === "🤖") roleId = "732615152246980628" //Bot Updates
      else if (reaction.emoji.name === "🎉") roleId = "801052623745974272" //Giveaway pings
      else return
      reaction.message.guild.member(user).roles.remove(roleId, "Removed the reaction in server-info")
        .then(() => console.log(`Took the ${reaction.message.guild.roles.cache.get(roleId).name} role from ${user.tag}`))
        .catch(err => console.error(`An error occured while trying to take the ${reaction.message.guild.roles.cache.get(roleId).name} role from ${user.tag}. Here's the error:\n${err}`))
    }
  }
})

//Run when someone joins
client.on("guildMemberAdd", member => {

  //Define assets and create canvas
  registerFont("./assets/Bitter-Regular.ttf", { family: "Bitter" })
  registerFont("./assets/Bitter-Bold.ttf", { family: "Bitter-Bold" })
  const canvas = createCanvas(800, 200)
  const ctx = canvas.getContext("2d")
  const userName = member.user.username
  const userAvatar = member.user.displayAvatarURL({ format: "png" })
  const memberCount = `${member.guild.memberCount}`

  //Select appropriate font based on used characters
  /*let usernameFont
  if (/(^[A-zÀ-ÿ0-9 $-/:-?{-~!"^_`\[\]])\w+/gi.test(userName)) usernameFont = "37.5px Bitter-Bold"
  else usernameFont = "37.5px sans-serif"*/

  loadImage("./assets/joinBackground.png").then(bg => {
    let nameWidth

    //GENERAL
    //Add background and set basic styling
    ctx.drawImage(bg, 0, 0, 800, 200)
    ctx.fillStyle = "white"


    //TEXT
    //Measure text widths
    ctx.font = "37.5px Bitter"
    let welcome = ctx.measureText("Welcome ")
    ctx.font = "37.5px sans-serif"
    let name = ctx.measureText(userName)
    if (name.width > (550 - welcome.width)) nameWidth = (550 - welcome.width)
    else nameWidth = name.width

    //Draw 'Welcome ' and '!'
    ctx.font = "37.5px Bitter"
    ctx.fillText("Welcome ", 200, 92.5)
    ctx.fillText("!", (200 + welcome.width + nameWidth), 92.5)

    //Draw username
    ctx.font = "37.5px sans-serif"
    ctx.fillText(userName, (200 + welcome.width), 92.5, (550 - welcome.width))

    //Draw member count
    ctx.font = "30px Bitter"
    ctx.fillText("You're member #" + memberCount, 200, 132.5)

    //ICON
    //Draw a circle for the image to go into
    ctx.beginPath()
    ctx.arc(100, 100, 75, 0, 2 * Math.PI)
    ctx.closePath()

    //Put the image in the circle
    loadImage(userAvatar).then((userPic) => {
      ctx.clip()
      ctx.drawImage(userPic, 25, 25, 150, 150)
      ctx.restore()

      //OUTPUT
      const attachment = new Discord.MessageAttachment(canvas.toBuffer(), `${member.user.username} join.png`)
      member.guild.channels.cache.get("549882021934137354").send(`<@${member.user.id}> just joined! Welcome! 🎉`, attachment) //join-leave
    })
  })
  member.send(`Hey there and thanks for joining **${member.guild.name}**! If you're a translator, be sure to check out <#699275092026458122> as this channel includes useful information for new and current translators. If you're looking to translate other projects, check out the ones we currently support by executing \`+projects\` here! We hope you have fun on our server!`).catch(() => console.log(`Couldn't DM user ${member.user.tag}, probably because they have DMs off`)) //getting started
})

//Run when someone leaves
client.on("guildMemberRemove", member => {
  //Leave message
  member.guild.channels.cache.get("549882021934137354").send(`**${member.user.tag}** just left the server 🙁`) //join-leave

  //Run if the member who leaves had the Bot Translator/Proofreader/Manager roles
  const botRole = member.roles.cache.find(role => role.name.startsWith("Bot ") && role.id !== "732615152246980628")
  if (botRole) { //bot updates
    client.channels.cache.get("768160446368186428").send(`${member.user.tag} had the <@&${botRole.id}> role and just left the server!`) //managers
    console.log(`${member.user.tag} left and had the ${botRole.name} role`)
  }
})

//Log in
client.login(process.env.DISCORD_TOKEN)
