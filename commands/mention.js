const Discord = require("discord.js");
const { langdb } = require("../config.json")

module.exports = {
  name: "mention",
  description: "Mentions a language role with a message.",
  aliases: ["langping", "languageping"],
  usage: "mention <language> <proofreader|translator|all> [message]",
  cooldown: 120,
  channelBlackList: ["621298919535804426", "619662798133133312", "712046319375482910", "644620638878695424", "550951034332381184", "549894938712866816", "713084081579098152"],
  execute(strings, message, args) {
    if (!args[0]) {
      message.channel.send(strings.errorNotFound + "`bg`, `cs`, `da`, `de`, `el`, `enpt`, `es`, `fi`, `fr`, `it`, `ja`, `ko`, `lol`, `ms`, `nl`, `no`, `pl`, `pt`, `ptbr`, `ru`, `sv`, `th`, `tr`, `ua`, `zhcn`, `zhtw`.");
      return
    }
    const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
    var type = args[1]
    const lowerArg = args[0].toLowerCase()
    var toLook = lowerArg.charAt(0).toUpperCase() + lowerArg.slice(1)
    args.splice(0, 2)
    var toSend = args.join(" ")
    if (toSend.length < 2) {
      toSend = "<a:bongoping:614477510423478275>" + toSend
    }

    if (toLook === "Chinesesimplified" || toLook === "Chinese-simplified" || toLook === "Zhcn") { toLook = "Chinese (Simplified)" }
    if (toLook === "Chinesetraditional" || toLook === "Chinese-traditional" || toLook === "Zhtw") { toLook = "Chinese (Traditional)" }
    if (toLook === "Lolcat" || toLook === "Lol") { toLook = "LOLCAT" }
    if (toLook === "Bg") { toLook = "Bulgarian" }
    if (toLook === "Cs") { toLook = "Czech" }
    if (toLook === "Da") { toLook = "Danish" }
    if (toLook === "Nl") { toLook = "Dutch" }
    if (toLook === "Fi") { toLook = "Finnish" }
    if (toLook === "Fr") { toLook = "French" }
    if (toLook === "De") { toLook = "German" }
    if (toLook === "El") { toLook = "Greek" }
    if (toLook === "It") { toLook = "Italian" }
    if (toLook === "Ja") { toLook = "Japanese" }
    if (toLook === "Ko") { toLook = "Korean" }
    if (toLook === "Ms") { toLook = "Malay" }
    if (toLook === "No") { toLook = "Norwegian" }
    if (toLook === "Pl") { toLook = "Polish" }
    if (toLook === "Pt") { toLook = "Portuguese" }
    if (toLook === "Ptbr") { toLook = "Brazilian" }
    if (toLook === "Ru") { toLook = "Russian" }
    if (toLook === "Es") { toLook = "Spanish" }
    if (toLook === "Sv") { toLook = "Swedish" }
    if (toLook === "Th") { toLook = "Thai" }
    if (toLook === "Tr") { toLook = "Turkish" }
    if (toLook === "Ua") { toLook = "Ukrainian" }
    if (toLook === "Enpt") { toLook = "Pirate English" }


    console.log("toLook: " + toLook)
    console.log("toSend: " + toSend)
    console.log("type: " + type)
    const role = message.guild.roles.cache.find(x => x.name == (toLook + " Proofreader"))

    if (!role) {
      message.channel.send(strings.errorNotFound + "`bg`, `cs`, `da`, `de`, `el`, `enpt`, `es`, `fi`, `fr`, `it`, `ja`, `ko`, `lol`, `ms`, `nl`, `no`, `pl`, `pt`, `ptbr`, `ru`, `sv`, `th`, `tr`, `ua`, `zhcn`, `zhtw`.");
      return;
    }
    if (type === "pf" || type === "pr" || type === "proofreader" || type === "Proofreader") {
      const toPing = message.guild.roles.cache.find(role => role.name === toLook + " Proofreader");
      const lowerRole = message.guild.roles.cache.find(role => role.name === toLook + " Translator");
      console.log(toPing + "\n" + lowerRole);
      if (message.member.roles.cache.find(role => role.name === toLook + " Proofreader" || message.member.hasPermission("ADMINISTRATOR"))) {
        message.delete()
        message.channel.send("**<@" + message.member.id + ">**: <@&" + toPing + "> " + toSend);
      } else { message.channel.send(strings.errorNoPing + strings.errorNoPingPr + strings.errorNoPingDisclaimer) }
    } else if (type === "tr" || type === "translator" || type === "Translator") {
      const toPing = message.guild.roles.cache.find(role => role.name === toLook + " Translator");
      const higherRole = message.guild.roles.cache.find(role => role.name === toLook + " Proofreader");
      console.log(toPing + "\n" + higherRole);
      if (message.member.roles.cache.find(role => role.name === toLook + " Proofreader" || message.member.hasPermission("ADMINISTRATOR"))
      ) {
        message.delete()
        message.channel.send("**<@" + message.member.id + ">**: <@&" + toPing + "> " + toSend);
      } else { message.channel.send(strings.errorNoPing + strings.errorNoPingTr + strings.errorNoPingDisclaimer) }
    } else if (type === "all" || type === "both") {
      const translatorPing = message.guild.roles.cache.find(role => role.name === toLook + " Translator");
      const proofreaderPing = message.guild.roles.cache.find(role => role.name === toLook + " Proofreader");
      console.log(translatorPing + "\n" + proofreaderPing);
      if (message.member.roles.cache.find(role => role.name === toLook + " Proofreader" || message.member.hasPermission("ADMINISTRATOR"))) {
        message.delete()
        message.channel.send("**<@" + message.member.id + ">**: <@&" + translatorPing + "> <@&" + proofreaderPing + "> " + toSend);
      } else { message.channel.send(strings.errorNoPing + strings.errorNoPingAll + strings.errorNoPingDisclaimer) }
    }
  }
};

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
