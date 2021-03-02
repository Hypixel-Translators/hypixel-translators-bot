import Discord from "discord.js"
import { Command } from "../../lib/dbclient"

const command: Command = {
  name: "mention",
  description: "Mentions a language role with a message.",
  aliases: ["langping", "languageping"],
  usage: "+mention <language> <proofreader|translator|all> [message]",
  cooldown: 120,
  allowTip: false,
  roleWhitelist: ["569839580971401236", "764442984119795732"], //Hypixel Proofreader and Discord Administrator
  channelBlacklist: ["621298919535804426", "619662798133133312", "712046319375482910", "644620638878695424", "550951034332381184", "549894938712866816", "713084081579098152"],
  execute(message: Discord.Message, args: string[], getString: (path: string, cmd?: string, lang?: string)=>any) {
    if (!args[0]) throw "noLang"
    if (!args[1]) throw "noRole"
    let type = args[1].toLowerCase()
    const lowerArg = args[0].toLowerCase()
    let toLook = lowerArg.charAt(0).toUpperCase() + lowerArg.slice(1)
    args.splice(0, 2)
    let toSend = args.join(" ")
    if (toSend.length < 2) {
      toSend = "<a:bongoping:614477510423478275>" + toSend
    }
    const langs = { "Chinesesimplified": "Chinese Simplified", "Chinese-simplified": "Chinese Simplified", "Zhcn": "Chinese Simplified", "Chinesetraditional": "Chinese Traditional", "Chinese-traditional": "Chinese Traditional", "Zhtw": "Chinese Traditional", "Lolcat": "LOLCAT", "Lol": "LOLCAT", "Bg": "Bulgarian", "Cs": "Czech", "Da": "Danish", "Nl": "Dutch", "Fi": "Finnish", "Fr": "French", "De": "German", "El": "Greek", "It": "Italian", "Ja": "Japanese", "Ko": "Korean", "Ms": "Malay", "No": "Norwegian", "Pl": "Polish", "Pt": "Portuguese", "Ptbr": "Portuguese Brazilian", "Brazilian": "Portuguese Brazilian", "Ru": "Russian", "Es": "Spanish", "Sv": "Swedish", "Se": "Swedish", "Th": "Thai", "Tr": "Turkish", "Ua": "Ukrainian", "Enpt": "Pirate English", "Pirate": "Pirate English" }
    //@ts-expect-error
    if (langs.hasOwnProperty(toLook)) toLook = langs[toLook]
    const role = message.guild!.roles.cache.find(x => x.name == (toLook + " Proofreader"))

    if (!role) throw "falseRole"
    if (type === "pf" || type === "pr" || type === "proofreader") {
      const toPing = message.guild!.roles.cache.find(role => role.name === toLook + " Proofreader")
      if (message.member!.roles.cache.find(role => role.name === toLook + " Proofreader" || message.member!.hasPermission("MANAGE_ROLES"))) {
        message.delete()
        message.channel.send(`**${message.author}**: ${toPing} ${toSend}`)
      } else {
        message.channel.send(`${getString("errorNoPing")}${getString("errorNoPingPr")} ${getString("errorNoPingDisclaimer")}`)
          .then(msg => {
            if (!message.deleted) message.delete()
            if (!msg.deleted) msg.delete()
          })
      }
    } else if (type === "tr" || type === "translator") {
      const toPing = message.guild!.roles.cache.find(role => role.name === toLook + " Translator")
      if (message.member!.roles.cache.find(role => role.name === toLook + " Proofreader" || message.member!.hasPermission("MANAGE_ROLES"))) {
        message.delete()
        message.channel.send(`**${message.author}**: ${toPing} ${toSend}`)
      } else {
        message.channel.send(`${getString("errorNoPing")}${getString("errorNoPingTr")} ${getString("errorNoPingDisclaimer")}`)
          .then(msg => {
            if (!message.deleted) message.delete()
            if (!msg.deleted) msg.delete()
          })
      }
    } else if (type === "all" || type === "both") {
      const translatorPing = message.guild!.roles.cache.find(role => role.name === toLook + " Translator")
      const proofreaderPing = message.guild!.roles.cache.find(role => role.name === toLook + " Proofreader")
      if (message.member!.roles.cache.find(role => role.name === toLook + " Proofreader" || message.member!.hasPermission("MANAGE_ROLES"))) {
        message.delete()
        message.channel.send(`**${message.author}**: ${translatorPing} ${proofreaderPing} ${toSend}`)
      } else {
        message.channel.send(`${getString("errorNoPing")}${getString("errorNoPingAll")} ${getString("errorNoPingDisclaimer")}`)
          .then(msg => {
            if (!message.deleted) message.delete()
            if (!msg.deleted) msg.delete()
          })
      }
    }
  }
}

export default command
