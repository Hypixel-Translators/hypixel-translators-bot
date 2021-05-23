import { loadingColor, errorColor, successColor, neutralColor } from "../../config.json"
import Discord from "discord.js"
import { flag } from "country-emoji"
import { db } from "../../lib/dbclient"
import { Command } from "../../index"

const command: Command = {
  name: "prefix",
  description: "Gives the author the appropriate prefix for their language(s).",
  usage: "+prefix [flags]",
  options: [{
    type: "STRING",
    name: "flags",
    description: "The flags to be applied to your prefix.",
    required: true
  }],
  cooldown: 30,
  channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058"], //bots staff-bots bot-development
  async execute(interaction: Discord.CommandInteraction, getString: (path: string, variables?: { [key: string]: string | number } | string, cmd?: string, lang?: string) => any) {
    const executedBy = getString("executedBy", { user: interaction.user.tag }, "global"),
      member = interaction.member as Discord.GuildMember,
      nickNoPrefix = member.displayName.replace(/\[[^\s]*\] ?/g, ""),
      langdb = await db.collection("langdb").find().toArray()

    if (interaction.options[0].value) {
      let flagEmojis: (string | undefined)[] = [];
      (interaction.options[0].value as string).split(" ").forEach(emoji => {
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
        .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
      await interaction.reply(embed)
      const msg = await interaction.fetchReply() as Discord.Message
      msg.react("✅").then(() => msg.react("❎"))

      const collector = msg.createReactionCollector((reaction: Discord.MessageReaction, reacter: Discord.User) => (reaction.emoji.name === "✅" || reaction.emoji.name === "❎") && reacter.id === interaction.user.id, { time: this.cooldown! * 1000 })

      collector.on("collect", async reaction => {
        msg.react("✅")
        if (reaction.emoji.name === "✅") {
          msg.reactions.removeAll()
          if (member.nickname !== (`[${prefix}] ${nickNoPrefix}`)) {
            await member.setNickname(`[${prefix}] ${nickNoPrefix}`, "Used the prefix command")
              .then(() => {
                const embed = new Discord.MessageEmbed()
                  .setColor(successColor)
                  .setAuthor(getString("moduleName"))
                  .setTitle(getString("saved"))
                  .addField(getString("newNickT"), `\`[${prefix}] ${nickNoPrefix}\``)
                  .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                interaction.editReply(embed)
                const staffAlert = new Discord.MessageEmbed()
                  .setColor(loadingColor)
                  .setAuthor("Prefix")
                  .setTitle("A user manually changed their prefix")
                  .setDescription(`${interaction.user} manually changed their prefix to include the following flag: ${prefix}\nMake sure they have the appropriate roles for this prefix and, if not, follow the appropriate procedure`)
                  .setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }));
                (interaction.client.channels.cache.get("624881429834366986") as Discord.TextChannel).send(staffAlert) //staff-bots
              })
              .catch(err => {
                const embed = new Discord.MessageEmbed()
                  .setColor(errorColor)
                  .setAuthor(getString("moduleName"))
                  .setTitle(getString("errors.error"))
                  .setDescription(err)
                  .addField(getString("previewT"), `\`[${prefix}] ${nickNoPrefix}\``)
                  .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                interaction.editReply(embed)
              })
          } else {
            const embed = new Discord.MessageEmbed()
              .setColor(successColor)
              .setAuthor(getString("moduleName"))
              .setTitle(getString("errors.alreadyThis") + getString("errors.notSaved"))
              .addField(getString("newNickT"), getString("noChanges"))
              .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
            interaction.editReply(embed)
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
            .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
          interaction.editReply(embed)
        }
      })
      collector.on('end', () => {
        msg.reactions.removeAll()
        if (prefix === "n") return
        if (prefix) {
          if (member.nickname !== (`[${prefix}] ${nickNoPrefix}`)) {
            member.setNickname(`[${prefix}] ${nickNoPrefix}`, "Used the prefix command")
              .then(() => {
                const embed = new Discord.MessageEmbed()
                  .setColor(successColor)
                  .setAuthor(getString("moduleName"))
                  .setTitle(getString("saved"))
                  .addField(getString("newNickT"), `\`[${prefix}] ${nickNoPrefix}\``)
                  .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                interaction.editReply(embed)
              })
              .catch(err => {
                const embed = new Discord.MessageEmbed()
                  .setColor(errorColor)
                  .setAuthor(getString("moduleName"))
                  .setTitle(getString("errors.error"))
                  .setDescription(err)
                  .addField(getString("previewT"), `\`[${prefix}] ${nickNoPrefix}\``)
                  .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                interaction.editReply(embed)
                console.log(err)
              })
          } else {
            const embed = new Discord.MessageEmbed()
              .setColor(successColor)
              .setAuthor(getString("moduleName"))
              .setTitle(getString("errors.alreadyThis") + getString("errors.notSaved"))
              .addField(getString("newNickT"), getString("noChanges"))
              .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
            interaction.editReply(embed)
          }
        } else {
          const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setAuthor(getString("moduleName"))
            .setTitle(getString("errors.timedOut"))
            .setDescription(getString("errors.timeOutCustom") + getString("errors.notSaved"))
            .addField(getString("newNickT"), getString("noChanges"))
            .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
          interaction.editReply(embed)
        }
      })
    } else {

      const loadingEmbed = new Discord.MessageEmbed()
        .setColor(loadingColor)
        .setAuthor(getString("moduleName"))
        .setTitle(getString("loading"))
        .setDescription(getString("loadingRoles"))
        .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
      await interaction.reply(loadingEmbed)
      const msg = await interaction.fetchReply() as Discord.Message
      let userLangs: string[] = []
      let prefixes = ""

      await member.roles.cache.forEach(async r => {
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
        if (member.roles.cache.find(role => role.name.startsWith("Bot ") && role.id !== "732615152246980628") || member.roles.cache.find(role => role.name.startsWith("SkyblockAddons "))) { //Bot updates
          const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setAuthor(getString("moduleName"))
            .setTitle(getString("errors.trNoRoles"))
            .setDescription(getString("customPrefix"))
            .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
          return interaction.editReply(embed)
        } else {
          const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setAuthor(getString("moduleName"))
            .setTitle(getString("errors.noLanguages"))
            .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
          return interaction.editReply(embed)
        }
      }
      msg.react("❎")

      const noChangesEmbed = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setAuthor(getString("moduleName"))
        .setTitle(getString("react"))
        .setDescription(getString("reactTimer", { cooldown: this.cooldown! }))
        .addField(getString("previewT"), getString("noChanges"))
        .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
      interaction.editReply(noChangesEmbed)

      const collector = msg.createReactionCollector((reaction: Discord.MessageReaction, reacter: Discord.User) => (userLangs.includes(reaction.emoji.name!) || reaction.emoji.name === "✅" || reaction.emoji.name === "❎") && reacter.id === interaction.user.id, { time: this.cooldown! * 1000 })

      collector.on('collect', async (reaction, reacter) => {
        if (reaction.emoji.name !== "❎") msg.react("✅")
        if (reaction.emoji.name === "✅") {
          msg.reactions.removeAll()
          if (prefixes) {
            if (member.nickname !== (`[${prefixes}] ${nickNoPrefix}`)) {
              await member.setNickname(`[${prefixes}] ${nickNoPrefix}`, "Used the prefix command")
                .then(() => {
                  const embed = new Discord.MessageEmbed()
                    .setColor(successColor)
                    .setAuthor(getString("moduleName"))
                    .setTitle(getString("saved"))
                    .addField(getString("newNickT"), `\`[${prefixes}] ${nickNoPrefix}\``)
                    .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                  interaction.editReply(embed)
                })
                .catch(err => {
                  const embed = new Discord.MessageEmbed()
                    .setColor(errorColor)
                    .setAuthor(getString("moduleName"))
                    .setTitle(getString("errors.error"))
                    .setDescription(err)
                    .addField(getString("previewT"), `\`[${prefixes}] ${nickNoPrefix}\``)
                    .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                  interaction.editReply(embed)
                })
              prefixes = "n"
            } else {
              prefixes = "n"
              const embed = new Discord.MessageEmbed()
                .setColor(errorColor)
                .setAuthor(getString("moduleName"))
                .setTitle(getString("errors.alreadyThis") + getString("errors.notSaved"))
                .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
              interaction.editReply(embed)
            }
          } else {
            const embed = new Discord.MessageEmbed()
              .setColor(errorColor)
              .setAuthor(getString("moduleName"))
              .setTitle(getString("errors.confirmedNoFlags") + getString("errors.notSaved"))
              .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
            interaction.editReply(embed)
          }
        } else if (reaction.emoji.name === "❎") {
          msg.reactions.removeAll()
          prefixes = "n"
          const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setAuthor(getString("moduleName"))
            .setTitle(getString("errors.cancelled") + getString("errors.notSaved"))
            .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
          interaction.editReply(embed)
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
            .addField(getString("previewT"), `\`[${prefixes}] ${nickNoPrefix}\``)
            .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
          interaction.editReply(embed)
        }
      })

      collector.on('end', () => {
        msg.reactions.removeAll()
        if (prefixes === "n") return
        if (prefixes.length > 0) {
          if (member.nickname !== (`[${prefixes}] ${nickNoPrefix}`)) {
            member.setNickname(`[${prefixes}] ${nickNoPrefix}`, "Used the prefix command")
              .then(() => {
                const embed = new Discord.MessageEmbed()
                  .setColor(successColor)
                  .setAuthor(getString("moduleName"))
                  .setTitle(getString("saved"))
                  .addField(getString("newNickT"), `\`[${prefixes}] ${nickNoPrefix}\``)
                  .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                interaction.editReply(embed)
              })
              .catch(err => {
                const embed = new Discord.MessageEmbed()
                  .setColor(errorColor)
                  .setAuthor(getString("moduleName"))
                  .setTitle(getString("errors.error"))
                  .setDescription(err)
                  .addField(getString("previewT"), `\`[${prefixes}] ${nickNoPrefix}\``)
                  .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                interaction.editReply(embed)
                console.log(err)
              })
          } else {
            const embed = new Discord.MessageEmbed()
              .setColor(successColor)
              .setAuthor(getString("moduleName"))
              .setTitle(getString("errors.alreadyThis") + getString("errors.notSaved"))
              .addField(getString("newNickT"), getString("noChanges"))
              .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
            interaction.editReply(embed)
          }
        } else {
          const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setAuthor(getString("moduleName"))
            .setTitle(getString("errors.timedOut"))
            .setDescription(getString("errors.timeOut") + getString("errors.notSaved"))
            .addField(getString("newNickT"), getString("noChanges"))
            .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
          interaction.editReply(embed)
        }
      })
    }
  }
}

export default command
