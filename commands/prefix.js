const { loadingColor, errorColor, successColor, neutralColor, langdb } = require("../config.json");
const Discord = require("discord.js");
const { flag } = require("country-emoji")

module.exports = {
  name: "prefix",
  description: "Gives the author the appropriate prefix for their language(s).",
  aliases: ["langprefix", "languageprefix"],
  usage: "+prefix",
  cooldown: 15,
  channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058", "749391414600925335"],
  async execute(strings, message, args) {
    const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)

    if (args[0]) {
      let flag = flag(args.join(" "))
      if (!flag) {
        throw "falseLang"
      }

      msg.react("❎")
      msg.react("✅")
      const embed = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setAuthor(strings.moduleName)
        .setTitle(strings.caution)
        .setDescription(strings.warning)
        .addFields({ name: strings.previewT, value: "[" + flag + "] " + message.member.user.username })
        .setFooter(executedBy, message.author.displayAvatarURL());
      message.channel.send(embed)
        .then(msg => {

          const filter = (reaction, reacter) => {
            return (reaction.emoji.name === "✅" || reaction.emoji.name === "❎") && reacter.id === message.author.id;
          }
          const collector = msg.createReactionCollector(filter, { time: 20000 })
          collector.on('collect', (reaction, reacter) => {

            if (reaction.emoji.name === "✅") {

              msg.reactions.removeAll()
              message.member.setNickname("[" + flag + "] " + message.member.user.username, "Used the prefix command")
                .then(() => {
                  const embed = new Discord.MessageEmbed()
                    .setColor(successColor)
                    .setAuthor(strings.moduleName)
                    .setTitle(strings.saved)
                    .addFields({ name: strings.newNickT, value: "\`[" + prefixes + "] " + message.member.user.username + "\`" })
                    .setFooter(executedBy, message.author.displayAvatarURL());
                  msg.edit(embed)
                })
                .catch(err => {
                  const embed = new Discord.MessageEmbed()
                    .setColor(errorColor)
                    .setAuthor(strings.moduleName)
                    .setTitle(strings.errors.error)
                    .setDescription(err)
                    .addFields({ name: strings.previewT, value: "\`[" + prefixes + "] " + message.member.user.username + "\`" })
                    .setFooter(executedBy, message.author.displayAvatarURL());
                  msg.edit(embed)
                })

            } else if (reaction.emoji.name === "❎") {
              msg.reactions.removeAll()
              const embed = new Discord.MessageEmbed()
                .setColor(successColor)
                .setAuthor(strings.moduleName)
                .setTitle(strings.errors.cancelled + strings.errors.notSaved)
                .addFields({ name: strings.newNickT, value: strings.noChanges })
                .setFooter(executedBy, message.author.displayAvatarURL());
              msg.edit(embed)
            }

          })
        })
    }

    const embed = new Discord.MessageEmbed()
      .setColor(loadingColor)
      .setAuthor(strings.moduleName)
      .setTitle(strings.loading)
      .setDescription(strings.loadingRoles)
      .setFooter(executedBy, message.author.displayAvatarURL());
    message.channel.send(embed)
      .then(async msg => {
        var userLangs = []
        var prefixes = ""

        await message.member.roles.cache.forEach(async r => {
          if (r.name.startsWith("Chinese")) { userLangs.push("🇨🇳"); msg.react("🇨🇳"); userLangs.push("🇹🇼"); msg.react("🇹🇼"); userLangs.push("🇭🇰"); msg.react("🇭🇰") } else {
            var langdbEntry = langdb.find(l => l.name.includes(r.name.split(" ")[0]))
            if (langdbEntry) {
              await userLangs.push(langdbEntry.emoji)
              await msg.react(langdbEntry.emoji)
            }
          }
        })

        setTimeout(() => {
          if (userLangs.length < 1) {
            const embed = new Discord.MessageEmbed()
              .setColor(errorColor)
              .setAuthor(strings.moduleName)
              .setTitle(strings.errors.noLanguages)
              .setFooter(executedBy, message.author.displayAvatarURL());
            return msg.edit(embed)
          }
          msg.react("❎")

          const embed = new Discord.MessageEmbed()
            .setColor(neutralColor)
            .setAuthor(strings.moduleName)
            .setTitle(strings.react)
            .setDescription(strings.reactTimer)
            .addFields({ name: strings.previewT, value: strings.noChanges })
            .setFooter(executedBy, message.author.displayAvatarURL());
          msg.edit(embed)

          const filter = (reaction, reacter) => {
            return (userLangs.includes(reaction.emoji.name) || reaction.emoji.name === "✅" || reaction.emoji.name === "❎") && reacter.id === message.author.id;
          };

          const collector = msg.createReactionCollector(filter, { time: 20000 });

          collector.on('collect', (reaction, reacter) => {
            msg.react("✅")
            if (reaction.emoji.name === "✅") {
              msg.reactions.removeAll()
              if (prefixes.length > 0) {
                message.member.setNickname("[" + prefixes + "] " + message.member.user.username, "Used the prefix command")
                  .then(() => {
                    const embed = new Discord.MessageEmbed()
                      .setColor(successColor)
                      .setAuthor(strings.moduleName)
                      .setTitle(strings.saved)
                      .addFields({ name: strings.newNickT, value: "\`[" + prefixes + "] " + message.member.user.username + "\`" })
                      .setFooter(executedBy, message.author.displayAvatarURL());
                    msg.edit(embed)
                  })
                  .catch(err => {
                    const embed = new Discord.MessageEmbed()
                      .setColor(errorColor)
                      .setAuthor(strings.moduleName)
                      .setTitle(strings.errors.error)
                      .setDescription(err)
                      .addFields({ name: strings.previewT, value: "\`[" + prefixes + "] " + message.member.user.username + "\`" })
                      .setFooter(executedBy, message.author.displayAvatarURL());
                    msg.edit(embed)
                  })
              } else {
                const embed = new Discord.MessageEmbed()
                  .setColor(errorColor)
                  .setAuthor(strings.moduleName)
                  .setTitle(strings.errors.confirmedNoFlags + strings.errors.notSaved)
                  .setFooter(executedBy, message.author.displayAvatarURL());
                msg.edit(embed)
              }
            } else if (reaction.emoji.name === "❎") {
              msg.reactions.removeAll()
              prefixes = "n"
              const embed = new Discord.MessageEmbed()
                .setColor(successColor)
                .setAuthor(strings.moduleName)
                .setTitle(strings.errors.cancelled + strings.errors.notSaved)
                .addFields({ name: strings.newNickT, value: strings.noChanges })
                .setFooter(executedBy, message.author.displayAvatarURL());
              msg.edit(embed)
            } else {
              const valueToRemove = reaction.emoji.name
              userLangs = userLangs.filter(item => item !== valueToRemove)
              if (prefixes.length > 0) { prefixes = (prefixes + "-") }
              prefixes = (prefixes + reaction.emoji.name)
              const embed = new Discord.MessageEmbed()
                .setColor(neutralColor)
                .setAuthor(strings.moduleName)
                .setTitle(strings.react)
                .setDescription(strings.reactTimer2)
                .addFields({ name: strings.previewT, value: "\`[" + prefixes + "] " + message.member.user.username + "\`" })
                .setFooter(executedBy, message.author.displayAvatarURL());
              msg.edit(embed)
            }
          });

          collector.on('end', collected => {
            msg.reactions.removeAll()
            if (prefixes === "n") { return; }
            if (prefixes.length > 0) {
              if (message.member.nickname === ("[" + prefixes + "] " + message.member.user.username)) {
                message.member.setNickname("[" + prefixes + "] " + message.member.user.username, "Used the prefix command")
                  .then(() => {
                    const embed = new Discord.MessageEmbed()
                      .setColor(successColor)
                      .setAuthor(strings.moduleName)
                      .setTitle(strings.saved)
                      .addFields({ name: strings.newNickT, value: "\`[" + prefixes + "] " + message.member.user.username + "\`" })
                      .setFooter(executedBy, message.author.displayAvatarURL());
                    msg.edit(embed)
                  })
                  .catch(err => {
                    const embed = new Discord.MessageEmbed()
                      .setColor(errorColor)
                      .setAuthor(strings.moduleName)
                      .setTitle(strings.errors.error)
                      .setDescription(err)
                      .addFields({ name: strings.previewT, value: "\`[" + prefixes + "] " + message.member.user.username + "\`" })
                      .setFooter(executedBy, message.author.displayAvatarURL());
                    msg.edit(embed)
                    console.log(err)
                  })
              } else {
                const embed = new Discord.MessageEmbed()
                  .setColor(successColor)
                  .setAuthor(strings.moduleName)
                  .setTitle(strings.errors.alreadyThis + strings.errors.notSaved)
                  .addFields({ name: strings.newNickT, value: strings.noChanges })
                  .setFooter(executedBy, message.author.displayAvatarURL());
                msg.edit(embed)
              }
            } else {
              const embed = new Discord.MessageEmbed()
                .setColor(errorColor)
                .setAuthor(strings.moduleName)
                .setTitle("Prefix")
                .setDescription(strings.errors.timeOut + strings.errors.notSaved)
                .addFields({ name: strings.newNickT, value: strings.noChanges })
                .setFooter(executedBy, message.author.displayAvatarURL());
              msg.edit(embed)
            }
          })
        }, 1000)

      })

  }
}