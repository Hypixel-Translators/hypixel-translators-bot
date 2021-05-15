import { loadingColor, errorColor, successColor, neutralColor } from "../../config.json"
import Discord from "discord.js"
import { flag } from "country-emoji"
import { db } from "../../lib/dbclient"
import { Command } from "../../index"

const command: Command = {
  name: "prefix",
  description: "Gives the author the appropriate prefix for their language(s).",
  aliases: ["langprefix", "languageprefix"],
  usage: "+prefix [flags]",
  cooldown: 30,
  channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058"], //bots staff-bots bot-development
  async execute(message: Discord.Message, args: string[], getString: (path: string, variables?: { [key: string]: string | number } | string, cmd?: string, lang?: string) => any) {
    const executedBy = getString("executedBy", { user: message.author.tag }, "global")
    const nickNoPrefix = message.member!.displayName.replace(/\[[^\s]*\] ?/g, "")
    const langdb = await db.collection("langdb").find().toArray()

    if (args[0]) {
      let flagEmojis: (string | undefined)[] = []
      args.forEach(emoji => {
        if (emoji.toLowerCase() === "lol" || emoji.toLowerCase() === "lolcat") flagEmojis.push("😹")
        else if (emoji.toLowerCase() === "enpt" || emoji.toLowerCase() === "pirate") flagEmojis.push("☠")
        else if (emoji.toLowerCase() === "ib" || emoji.toLowerCase() === "banana") flagEmojis.push("🍌")
        else if (emoji.toLowerCase() === "bc" || emoji.toLowerCase() === "biscuitish") flagEmojis.push("🍪")
        else flagEmojis.push(flag(emoji))
      })
      if (!flagEmojis || flagEmojis.includes(undefined)) throw "falseFlag"

      let prefix = flagEmojis.join("-")
      const embed = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setAuthor(getString("moduleName"))
        .setTitle(getString("caution"))
        .setDescription(`${getString("warning")}\n${getString("reactTimer", { cooldown: this.cooldown! })}`)
        .addField(getString("previewT"), `\`[${prefix}] ${nickNoPrefix}\``)
        .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
      message.channel.send(embed)
        .then(msg => {
          msg.react("✅").then(() => msg.react("❎"))

          const collector = msg.createReactionCollector((reaction: Discord.MessageReaction, reacter: Discord.User) => (reaction.emoji.name === "✅" || reaction.emoji.name === "❎") && reacter.id === message.author.id, { time: this.cooldown! * 1000 })

          collector.on("collect", async reaction => {
            msg.react("✅")
            if (reaction.emoji.name === "✅") {
              msg.reactions.removeAll()
              if (message.member!.nickname !== (`[${prefix}]  ${nickNoPrefix}`)) {
                await message.member!.setNickname(`[${prefix}]  ${nickNoPrefix}`, "Used the prefix command")
                  .then(() => {
                    const embed = new Discord.MessageEmbed()
                      .setColor(successColor)
                      .setAuthor(getString("moduleName"))
                      .setTitle(getString("saved"))
                      .addField(getString("newNickT"), `\`[${prefix}] ${nickNoPrefix}\``)
                      .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                    msg.edit(embed)
                    const staffAlert = new Discord.MessageEmbed()
                      .setColor(loadingColor)
                      .setAuthor("Prefix")
                      .setTitle("A user manually changed their prefix")
                      .setDescription(`${message.author} manually changed their prefix to include the following flag: ${prefix}\nMake sure they have the appropriate roles for this prefix and, if not, follow the appropriate procedure`)
                      .setFooter(`Executed by ${message.author.tag}`, message.author.displayAvatarURL({ format: "png", dynamic: true }));
                    (message.client.channels.cache.get("624881429834366986") as Discord.TextChannel).send(staffAlert) //staff-bots
                  })
                  .catch(err => {
                    const embed = new Discord.MessageEmbed()
                      .setColor(errorColor)
                      .setAuthor(getString("moduleName"))
                      .setTitle(getString("errors.error"))
                      .setDescription(err)
                      .addField(getString("previewT"), `\`[${prefix}] ${nickNoPrefix}\``)
                      .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                    msg.edit(embed)
                  })
              } else {
                const embed = new Discord.MessageEmbed()
                  .setColor(successColor)
                  .setAuthor(getString("moduleName"))
                  .setTitle(getString("errors.alreadyThis") + getString("errors.notSaved"))
                  .addField(getString("newNickT"), getString("noChanges"))
                  .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                msg.edit(embed)
              }
              prefix = "n"
            } else if (reaction.emoji.name === "❎") {
              msg.reactions.removeAll()
              prefix = "n"
              const embed = new Discord.MessageEmbed()
                .setColor(successColor)
                .setAuthor(getString("moduleName"))
                .setTitle(getString("errors.cancelled") + getString("errors.notSaved"))
                .addField(getString("newNickT"), getString("noChanges"))
                .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
              msg.edit(embed)
            }
          })
          collector.on('end', () => {
            msg.reactions.removeAll()
            if (prefix === "n") return
            if (prefix) {
              if (message.member!.nickname !== (`[${prefix}]  ${nickNoPrefix}`)) {
                message.member!.setNickname(`[${prefix}]  ${nickNoPrefix}`, "Used the prefix command")
                  .then(() => {
                    const embed = new Discord.MessageEmbed()
                      .setColor(successColor)
                      .setAuthor(getString("moduleName"))
                      .setTitle(getString("saved"))
                      .addField(getString("newNickT"), `\`[${prefix}] ${nickNoPrefix}\``)
                      .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                    msg.edit(embed)
                  })
                  .catch(err => {
                    const embed = new Discord.MessageEmbed()
                      .setColor(errorColor)
                      .setAuthor(getString("moduleName"))
                      .setTitle(getString("errors.error"))
                      .setDescription(err)
                      .addField(getString("previewT"), `\`[${prefix}] ${nickNoPrefix}\``)
                      .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                    msg.edit(embed)
                    console.log(err)
                  })
              } else {
                const embed = new Discord.MessageEmbed()
                  .setColor(successColor)
                  .setAuthor(getString("moduleName"))
                  .setTitle(getString("errors.alreadyThis") + getString("errors.notSaved"))
                  .addField(getString("newNickT"), getString("noChanges"))
                  .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                msg.edit(embed)
              }
            } else {
              const embed = new Discord.MessageEmbed()
                .setColor(errorColor)
                .setAuthor(getString("moduleName"))
                .setTitle(getString("errors.timedOut"))
                .setDescription(getString("errors.timeOutCustom") + getString("errors.notSaved"))
                .addField(getString("newNickT"), getString("noChanges"))
                .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
              msg.edit(embed)
            }
          })
        })
    } else {

      const embed = new Discord.MessageEmbed()
        .setColor(loadingColor)
        .setAuthor(getString("moduleName"))
        .setTitle(getString("loading"))
        .setDescription(getString("loadingRoles"))
        .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
      message.channel.send(embed)
        .then(async msg => {
          let userLangs: string[] = []
          let prefixes = ""

          await message.member!.roles.cache.forEach(async r => {
            const roleName = r.name.split(" ")
            await roleName.splice(roleName.length - 1, 1)
            const role = roleName.join(" ")
            let langdbEntry = langdb.find(l => l.name === role)
            if (langdbEntry) {
              userLangs.push(langdbEntry.emoji)
            }
          })
          userLangs = userLangs.reverse()
          userLangs.forEach(async emoji => await msg.react(emoji))

          if (userLangs.length < 1) {
            if (message.member!.roles.cache.find(role => role.name.startsWith("Bot ") && role.id !== "732615152246980628") || message.member!.roles.cache.find(role => role.name.startsWith("SkyblockAddons "))) { //Bot updates
              const embed = new Discord.MessageEmbed()
                .setColor(errorColor)
                .setAuthor(getString("moduleName"))
                .setTitle(getString("errors.trNoRoles"))
                .setDescription(getString("customPrefix"))
                .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
              return msg.edit(embed)
            } else {
              const embed = new Discord.MessageEmbed()
                .setColor(errorColor)
                .setAuthor(getString("moduleName"))
                .setTitle(getString("errors.noLanguages"))
                .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
              return msg.edit(embed)
            }
          }
          msg.react("❎")

          const embed = new Discord.MessageEmbed()
            .setColor(neutralColor)
            .setAuthor(getString("moduleName"))
            .setTitle(getString("react"))
            .setDescription(getString("reactTimer", { cooldown: this.cooldown! }))
            .addField(getString("previewT"), getString("noChanges"))
            .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
          msg.edit(embed)

          const collector = msg.createReactionCollector((reaction: Discord.MessageReaction, reacter: Discord.User) => (userLangs.includes(reaction.emoji.name!) || reaction.emoji.name === "✅" || reaction.emoji.name === "❎") && reacter.id === message.author.id, { time: this.cooldown! * 1000 })

          collector.on('collect', async (reaction, reacter) => {
            if (reaction.emoji.name !== "❎") msg.react("✅")
            if (reaction.emoji.name === "✅") {
              msg.reactions.removeAll()
              if (prefixes) {
                if (message.member!.nickname !== (`[${prefixes}]  ${nickNoPrefix}`)) {
                  await message.member!.setNickname(`[${prefixes}]  ${nickNoPrefix}`, "Used the prefix command")
                    .then(() => {
                      const embed = new Discord.MessageEmbed()
                        .setColor(successColor)
                        .setAuthor(getString("moduleName"))
                        .setTitle(getString("saved"))
                        .addField(getString("newNickT"), `\`[${prefixes}]  ${nickNoPrefix}\``)
                        .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                      msg.edit(embed)
                    })
                    .catch(err => {
                      const embed = new Discord.MessageEmbed()
                        .setColor(errorColor)
                        .setAuthor(getString("moduleName"))
                        .setTitle(getString("errors.error"))
                        .setDescription(err)
                        .addField(getString("previewT"), `\`[${prefixes}]  ${nickNoPrefix}\``)
                        .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                      msg.edit(embed)
                    })
                  prefixes = "n"
                } else {
                  prefixes = "n"
                  const embed = new Discord.MessageEmbed()
                    .setColor(errorColor)
                    .setAuthor(getString("moduleName"))
                    .setTitle(getString("errors.alreadyThis") + getString("errors.notSaved"))
                    .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                  msg.edit(embed)
                }
              } else {
                const embed = new Discord.MessageEmbed()
                  .setColor(errorColor)
                  .setAuthor(getString("moduleName"))
                  .setTitle(getString("errors.confirmedNoFlags") + getString("errors.notSaved"))
                  .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                msg.edit(embed)
              }
            } else if (reaction.emoji.name === "❎") {
              msg.reactions.removeAll()
              prefixes = "n"
              const embed = new Discord.MessageEmbed()
                .setColor(errorColor)
                .setAuthor(getString("moduleName"))
                .setTitle(getString("errors.cancelled") + getString("errors.notSaved"))
                .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
              msg.edit(embed)
            } else {
              const valueToRemove = reaction.emoji.name
              userLangs = userLangs.filter(item => item !== valueToRemove)
              if (prefixes) prefixes = prefixes + "-"
              prefixes = prefixes + reaction.emoji.name
              const embed = new Discord.MessageEmbed()
                .setColor(neutralColor)
                .setAuthor(getString("moduleName"))
                .setTitle(getString("react"))
                .setDescription(getString("reactTimer2", { cooldown: this.cooldown! }))
                .addField(getString("previewT"), `\`[${prefixes}]  ${nickNoPrefix}\``)
                .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
              msg.edit(embed)
            }
          })

          collector.on('end', () => {
            msg.reactions.removeAll()
            if (prefixes === "n") return
            if (prefixes.length > 0) {
              if (message.member!.nickname !== (`[${prefixes}]  ${nickNoPrefix}`)) {
                message.member!.setNickname(`[${prefixes}]  ${nickNoPrefix}`, "Used the prefix command")
                  .then(() => {
                    const embed = new Discord.MessageEmbed()
                      .setColor(successColor)
                      .setAuthor(getString("moduleName"))
                      .setTitle(getString("saved"))
                      .addField(getString("newNickT"), `\`[${prefixes}]  ${nickNoPrefix}\``)
                      .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                    msg.edit(embed)
                  })
                  .catch(err => {
                    const embed = new Discord.MessageEmbed()
                      .setColor(errorColor)
                      .setAuthor(getString("moduleName"))
                      .setTitle(getString("errors.error"))
                      .setDescription(err)
                      .addField(getString("previewT"), `\`[${prefixes}]  ${nickNoPrefix}\``)
                      .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                    msg.edit(embed)
                    console.log(err)
                  })
              } else {
                const embed = new Discord.MessageEmbed()
                  .setColor(successColor)
                  .setAuthor(getString("moduleName"))
                  .setTitle(getString("errors.alreadyThis") + getString("errors.notSaved"))
                  .addField(getString("newNickT"), getString("noChanges"))
                  .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
                msg.edit(embed)
              }
            } else {
              const embed = new Discord.MessageEmbed()
                .setColor(errorColor)
                .setAuthor(getString("moduleName"))
                .setTitle(getString("errors.timedOut"))
                .setDescription(getString("errors.timeOut") + getString("errors.notSaved"))
                .addField(getString("newNickT"), getString("noChanges"))
                .setFooter(executedBy, message.author.displayAvatarURL({ format: "png", dynamic: true }))
              msg.edit(embed)
            }
          })

        })
    }
  }
}

export default command
