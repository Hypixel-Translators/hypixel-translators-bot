const { successColor, langdb } = require("../../config.json")
const Discord = require("discord.js")
const country = require("countryjs")
const { flag } = require("country-emoji")

module.exports = {
  name: "newlang",
  description: "Creates a new language category with the appropriate channels and roles.",
  usage: "+newlang <lang code> [HEX color]",
  roleWhitelist: ["764442984119795732"], //Discord Administrator
  async execute(message, strings, args) {
    const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
    message.channel.startTyping()
    const lang = args[0].toLowerCase()
    const code = args[0].toUpperCase()
    const langdbEntry = langdb.find(entry => entry.code === lang)
    let nationality = country.demonym(code)
    let emoji = flag(lang)
    if (langdbEntry) {
      nationality = langdbEntry.name
      emoji = langdbEntry.emoji
    }
    console.log(lang)
    console.log(nationality)
    const translatorRole = await message.guild.roles.create({
      data: {
        name: `${nationality} Translator`,
        color: `${args[1] || "000000"}`,
        hoist: false,
        position: 22,
        permissions: ["VIEW_CHANNEL", "CHANGE_NICKNAME", "SEND_MESSAGES", "ADD_REACTIONS", "USE_EXTERNAL_EMOJIS", "READ_MESSAGE_HISTORY", "CONNECT", "SPEAK", "STREAM", "USE_VAD"],
        mentionable: false
      },
      reason: "Added language " + nationality
    })
    const proofreaderRole = await message.guild.roles.create({
      data: {
        name: `${nationality} Proofreader`,
        color: `${args[1] || "000000"}`,
        hoist: false,
        position: 49,
        permissions: ["VIEW_CHANNEL", "CHANGE_NICKNAME", "SEND_MESSAGES", "ADD_REACTIONS", "USE_EXTERNAL_EMOJIS", "READ_MESSAGE_HISTORY", "CONNECT", "SPEAK", "STREAM", "USE_VAD"],
        mentionable: false
      },
      reason: "Added language " + nationality
    })
    const overwrites = [
      {
        id: message.guild.roles.everyone.id,
        deny: ["VIEW_CHANNEL", "CONNECT"]
      },
      {
        id: message.guild.roles.cache.find(role => role.name === "Muted").id,
        deny: ["SEND_MESSAGES", "ADD_REACTIONS", "SPEAK"]
      },
      {
        id: message.guild.roles.cache.find(role => role.name === "Bot").id,
        allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "CONNECT", "SPEAK"]
      },
      {
        id: translatorRole.id,
        allow: ["VIEW_CHANNEL", "CONNECT"]
      },
      {
        id: proofreaderRole.id,
        allow: ["VIEW_CHANNEL", "MANAGE_MESSAGES", "CONNECT", "PRIORITY_SPEAKER", "MOVE_MEMBERS"]
      },
      {
        id: message.guild.roles.cache.find(role => role.name === "Quickplay Manager").id,
        allow: ["VIEW_CHANNEL", "MANAGE_MESSAGES", "CONNECT", "PRIORITY_SPEAKER", "MOVE_MEMBERS"]
      },
      {
        id: message.guild.roles.cache.find(role => role.name === "Hypixel Manager").id,
        allow: ["VIEW_CHANNEL", "MANAGE_MESSAGES", "CONNECT", "PRIORITY_SPEAKER", "MOVE_MEMBERS"]
      }
    ]
    const pfOverwrites = Array.from(overwrites)
    pfOverwrites.splice(3, 1)
    const category = await message.guild.channels.create(`${country.name(code)} ${emoji}`, {
      type: "category",
      permissionOverwrites: overwrites,
      position: 9,
      reason: "Added language " + nationality
    })
    const translatorsChannel = await message.guild.channels.create(`${nationality} translators`, {
      topic: `A text channel where you can discuss ${nationality.charAt(0).toUpperCase() + nationality.slice(1)} translations! ${emoji}\n\nTranslation`,
      parent: category,
      permissionOverwrites: overwrites,
      reason: "Added language " + nationality
    })
    const proofreadersChannel = await message.guild.channels.create(`${nationality} proofreaders`, {
      parent: category,
      permissionOverwrites: pfOverwrites,
      reason: "Added language " + nationality
    })
    const translatorsVoice = await message.guild.channels.create(`${nationality} Translators`, {
      type: "voice",
      userLimit: 10,
      parent: category,
      permissionOverwrites: overwrites,
      reason: "Added language " + nationality
    })
    const proofreadersVoice = await message.guild.channels.create(`${nationality} Proofreaders`, {
      type: "voice",
      userLimit: 10,
      parent: category,
      permissionOverwrites: pfOverwrites,
      reason: "Added language " + nationality
    })
    const embed = new Discord.MessageEmbed()
      .setColor(successColor)
      .setAuthor(strings.moduleName)
      .setTitle(strings.langTitle.replace("%%country%%", country.name(code)))
      .setDescription(strings.warnings)
      .addFields(
        { name: strings.textChannels, value: strings.newItems.replace("%%newItem%%", translatorsChannel).replace("%%newItem2%%", proofreadersChannel) },
        { name: strings.voiceChannels, value: strings.newItems.replace("%%newItem%%", translatorsVoice).replace("%%newItem2%%", proofreadersVoice) },
        { name: strings.roles, value: strings.newItems.replace("%%newItem%%", translatorRole).replace("%%newItem2%%", proofreaderRole) }
      )
      .setFooter(executedBy, message.author.displayAvatarURL())
    message.channel.stopTyping()
    message.channel.send(embed)
  }
}
