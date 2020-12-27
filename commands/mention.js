module.exports = {
  name: "mention",
  description: "Mentions a language role with a message.",
  aliases: ["langping", "languageping"],
  usage: "+mention <language> <proofreader|translator|all> [message]",
  cooldown: 120,
  channelBlackList: ["621298919535804426", "619662798133133312", "712046319375482910", "644620638878695424", "550951034332381184", "549894938712866816", "713084081579098152"],
  execute(message, strings, args) {
    if (!args[0]) {
      message.channel.send(strings.errorNoArgs + "\n`bg`, `cs`, `da`, `de`, `el`, `enpt`, `es`, `fi`, `fr`, `it`, `ja`, `ko`, `lol`, `ms`, `nl`, `no`, `pl`, `pt`, `ptbr`, `ru`, `sv`, `th`, `tr`, `ua`, `zhcn`, `zhtw`.")
      return
    }
    if (!args[1]) {
      message.channel.send(strings.errorNoArgs2 + "\n`proofreader`, `translator`, `all`.")
      return
    }
    const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
    var type = args[1].toLowerCase()
    const lowerArg = args[0].toLowerCase()
    var toLook = lowerArg.charAt(0).toUpperCase() + lowerArg.slice(1)
    args.splice(0, 2)
    var toSend = args.join(" ")
    if (toSend.length < 2) {
      toSend = "<a:bongoping:614477510423478275>" + toSend
    }
    const langs = { "Chinesesimplified": "Chinese (Simplified)", "Chinese-simplified": "Chinese (Simplified)", "Zhcn": "Chinese (Simplified)", "Chinesetraditional": "Chinese (Traditional)", "Chinese-traditional": "Chinese (Traditional)", "Zhtw": "Chinese (Traditional)", "Lolcat": "LOLCAT", "Lol": "LOLCAT", "Bg": "Bulgarian", "Cs": "Czech", "Da": "Danish", "Nl": "Dutch", "Fi": "Finnish", "Fr": "French", "De": "German", "El": "Greek", "It": "Italian", "Ja": "Japanese", "Ko": "Korean", "Ms": "Malay", "No": "Norwegian", "Pl": "Polish", "Pt": "Portuguese", "Ptbr": "Brazilian", "Ru": "Russian", "Es": "Spanish", "Sv": "Swedish", "Th": "Thai", "Tr": "Turkish", "Ua": "Ukrainian", "Enpt": "Pirate" }
    if (langs.hasOwnProperty(toLook)) {
      toLook = langs[toLook]
    }

    console.log("toLook: " + toLook)
    console.log("type: " + type)
    console.log("toSend: " + toSend)
    const role = message.guild.roles.cache.find(x => x.name == (toLook + " Proofreader"))

    if (!role) {
      message.channel.send(strings.errorNotFound + "\n`bg`, `cs`, `da`, `de`, `el`, `enpt`, `es`, `fi`, `fr`, `it`, `ja`, `ko`, `lol`, `ms`, `nl`, `no`, `pl`, `pt`, `ptbr`, `ru`, `sv`, `th`, `tr`, `ua`, `zhcn`, `zhtw`.")
      return
    }
    if (type === "pf" || type === "pr" || type === "proofreader") {
      const toPing = message.guild.roles.cache.find(role => role.name === toLook + " Proofreader")
      const lowerRole = message.guild.roles.cache.find(role => role.name === toLook + " Translator")
      console.log(toPing + " " + lowerRole)
      if (message.member.roles.cache.find(role => role.name === toLook + " Proofreader" || message.member.hasPermission("ADMINISTRATOR"))) {
        message.delete()
        message.channel.send("**<@" + message.member.id + ">**: <@&" + toPing + "> " + toSend)
      } else { message.channel.send(strings.errorNoPing + strings.errorNoPingPr + " " + strings.errorNoPingDisclaimer) }
    } else if (type === "tr" || type === "translator") {
      const toPing = message.guild.roles.cache.find(role => role.name === toLook + " Translator")
      const higherRole = message.guild.roles.cache.find(role => role.name === toLook + " Proofreader")
      console.log(toPing + " " + higherRole)
      if (message.member.roles.cache.find(role => role.name === toLook + " Proofreader" || message.member.hasPermission("ADMINISTRATOR"))) {
        message.delete()
        message.channel.send("**<@" + message.member.id + ">**: <@&" + toPing + "> " + toSend)
      } else { message.channel.send(strings.errorNoPing + strings.errorNoPingTr + " " + strings.errorNoPingDisclaimer) }
    } else if (type === "all" || type === "both") {
      const translatorPing = message.guild.roles.cache.find(role => role.name === toLook + " Translator")
      const proofreaderPing = message.guild.roles.cache.find(role => role.name === toLook + " Proofreader")
      console.log(translatorPing + " " + proofreaderPing)
      if (message.member.roles.cache.find(role => role.name === toLook + " Proofreader" || message.member.hasPermission("ADMINISTRATOR"))) {
        message.delete()
        message.channel.send("**<@" + message.member.id + ">**: <@&" + translatorPing + "> <@&" + proofreaderPing + "> " + toSend)
      } else { message.channel.send(strings.errorNoPing + strings.errorNoPingAll + " " + strings.errorNoPingDisclaimer) }
    }
  }
}
