import { loadingColor, errorColor, successColor, neutralColor } from "../../config.json"
import Discord from "discord.js"
import { flag } from "country-emoji"
import { db, DbUser } from "../../lib/dbclient"
import { client, Command, GetStringFunction } from "../../index"
import { LangDbEntry } from "../../events/stats"

const command: Command = {
  name: "prefix",
  description: "Gives the author the appropriate prefix for their language(s).",
  options: [{
    type: "STRING",
    name: "flags",
    description: "The flags to be applied to your prefix.",
    required: false
  }],
  cooldown: 30,
  channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058"], //bots staff-bots bot-development
  async execute(interaction, getString: GetStringFunction) {
    const executedBy = getString("executedBy", { user: interaction.user.tag }, "global"),
      member = interaction.member as Discord.GuildMember,
      nickNoPrefix = member.displayName.replaceAll(/\[[^\s]*\] ?/g, "").trim(),
      langdb: LangDbEntry[] = await db.collection("langdb").find().toArray()

    if (interaction.options.getString("flags", false) && !member.roles.cache.has("569839517444341771") && !member.roles.cache.has("569839580971401236")) { //Hypixel Translator and Proofreader
      const flagEmojis: (string | undefined)[] = [];
      interaction.options.getString("flags", true).split(" ").forEach(emoji => {
        if (emoji.toLowerCase() === "lol" || emoji.toLowerCase() === "lolcat") flagEmojis.push("😹")
        else if (emoji.toLowerCase() === "enpt" || emoji.toLowerCase() === "pirate") flagEmojis.push("☠")
        else if (emoji.toLowerCase() === "ib" || emoji.toLowerCase() === "banana") flagEmojis.push("🍌")
        else if (emoji.toLowerCase() === "bc" || emoji.toLowerCase() === "biscuitish") flagEmojis.push("🍪")
        else flagEmojis.push(flag(emoji))
      })
      if (!flagEmojis.length || flagEmojis.includes(undefined)) throw "falseFlag"

      let prefix = flagEmojis.join("-")
      const embed = new Discord.MessageEmbed()
        .setColor(neutralColor as Discord.HexColorString)
        .setAuthor(getString("moduleName"))
        .setTitle(getString("caution"))
        .setDescription(`${getString("warning")}\n${getString("reactTimer", { cooldown: this.cooldown! })}`)
        .addField(getString("previewT"), `\`[${prefix}] ${nickNoPrefix}\``)
        .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true })),
        confirmButtons = new Discord.MessageActionRow()
          .addComponents(
            new Discord.MessageButton()
              .setCustomId("confirm")
              .setStyle("SUCCESS")
              .setLabel(getString("pagination.confirm", "global"))
              .setEmoji("✅"),
            new Discord.MessageButton()
              .setCustomId("cancel")
              .setStyle("DANGER")
              .setEmoji("❎")
              .setLabel(getString("pagination.cancel", "global"))
          )
      await interaction.reply({ embeds: [embed], components: [confirmButtons] })
      const msg = await interaction.fetchReply() as Discord.Message,
        collector = msg.createMessageComponentCollector({ time: this.cooldown! * 1000 })

      confirmButtons.components.forEach(button => button.setDisabled(true))
      collector.on("collect", async buttonInteraction => {
        const userDb: DbUser = await client.getUser(buttonInteraction.user.id)
        if (interaction.user.id !== buttonInteraction.user.id) return await buttonInteraction.reply({ content: getString("pagination.notYours", { command: `/${this.name}` }, "global", userDb.lang), ephemeral: true })
        if (buttonInteraction.customId === "confirm") {
          if (member.nickname !== (`[${prefix}] ${nickNoPrefix}`)) {
            await member.setNickname(`[${prefix}] ${nickNoPrefix}`, "Used the prefix command")
              .then(async () => {
                const embed = new Discord.MessageEmbed()
                  .setColor(successColor as Discord.HexColorString)
                  .setAuthor(getString("moduleName"))
                  .setTitle(getString("saved"))
                  .addField(getString("newNickT"), `\`[${prefix}] ${nickNoPrefix}\``)
                  .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                await interaction.editReply({ embeds: [embed], components: [confirmButtons] })
                const staffAlert = new Discord.MessageEmbed()
                  .setColor(loadingColor as Discord.HexColorString)
                  .setAuthor("Prefix")
                  .setTitle("A user manually changed their prefix")
                  .setDescription(`${interaction.user} manually changed their prefix to include the following flag: ${prefix}\nMake sure they have the appropriate roles for this prefix and, if not, follow the appropriate procedure`)
                  .setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                await (interaction.client.channels.cache.get("624881429834366986") as Discord.TextChannel).send({ embeds: [staffAlert] }) //staff-bots
              })
              .catch(async err => {
                const embed = new Discord.MessageEmbed()
                  .setColor(errorColor as Discord.HexColorString)
                  .setAuthor(getString("moduleName"))
                  .setTitle(getString("errors.error"))
                  .setDescription(err.toString())
                  .addField(getString("previewT"), `\`[${prefix}] ${nickNoPrefix}\``)
                  .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                await interaction.editReply({ embeds: [embed], components: [confirmButtons] })
                console.log(err.stack || err)
              })
          } else {
            const embed = new Discord.MessageEmbed()
              .setColor(successColor as Discord.HexColorString)
              .setAuthor(getString("moduleName"))
              .setTitle(getString("errors.alreadyThis") + getString("errors.notSaved"))
              .addField(getString("newNickT"), getString("noChanges"))
              .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
            await interaction.editReply({ embeds: [embed], components: [confirmButtons] })
          }
          prefix = "n"
        } else if (buttonInteraction.customId === "cancel") {
          prefix = "n"
          const embed = new Discord.MessageEmbed()
            .setColor(errorColor as Discord.HexColorString)
            .setAuthor(getString("moduleName"))
            .setTitle(getString("errors.cancelled") + getString("errors.notSaved"))
            .addField(getString("newNickT"), getString("noChanges"))
            .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
          await interaction.editReply({ embeds: [embed], components: [confirmButtons] })
        }
      })
      collector.on('end', async () => {
        if (prefix === "n") return
        if (prefix) {
          if (member.nickname !== (`[${prefix}] ${nickNoPrefix}`)) {
            member.setNickname(`[${prefix}] ${nickNoPrefix}`, "Used the prefix command")
              .then(async () => {
                const embed = new Discord.MessageEmbed()
                  .setColor(successColor as Discord.HexColorString)
                  .setAuthor(getString("moduleName"))
                  .setTitle(getString("saved"))
                  .addField(getString("newNickT"), `\`[${prefix}] ${nickNoPrefix}\``)
                  .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                await interaction.editReply({ embeds: [embed], components: [confirmButtons] })
              })
              .catch(async err => {
                const embed = new Discord.MessageEmbed()
                  .setColor(errorColor as Discord.HexColorString)
                  .setAuthor(getString("moduleName"))
                  .setTitle(getString("errors.error"))
                  .setDescription(err.toString())
                  .addField(getString("previewT"), `\`[${prefix}] ${nickNoPrefix}\``)
                  .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                await interaction.editReply({ embeds: [embed], components: [confirmButtons] })
                console.log(err.stack || err)
              })
          } else {
            const embed = new Discord.MessageEmbed()
              .setColor(successColor as Discord.HexColorString)
              .setAuthor(getString("moduleName"))
              .setTitle(getString("errors.alreadyThis") + getString("errors.notSaved"))
              .addField(getString("newNickT"), getString("noChanges"))
              .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
            await interaction.editReply({ embeds: [embed], components: [confirmButtons] })
          }
        } else {
          const embed = new Discord.MessageEmbed()
            .setColor(errorColor as Discord.HexColorString)
            .setAuthor(getString("moduleName"))
            .setTitle(getString("errors.timedOut"))
            .setDescription(getString("errors.timeOutCustom") + getString("errors.notSaved"))
            .addField(getString("newNickT"), getString("noChanges"))
            .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
          await interaction.editReply({ embeds: [embed], components: [confirmButtons] })
        }
      })
    } else {
      await interaction.defer()
      let userLangs: LangDbEntry[] = [],
        prefixes = ""

      member.roles.cache.forEach(r => {
        const roleName = r.name.split(" ")
        roleName.splice(roleName.length - 1, 1)
        const role = roleName.join(" ")
        let langdbEntry = langdb.find(l => l.name === role)
        if (langdbEntry) {
          userLangs.push(langdbEntry)
        }
      })
      userLangs = userLangs.reverse()
      const prefixButtons: Discord.MessageButton[] = []
      userLangs.forEach(entry => {
        const button = new Discord.MessageButton()
          .setStyle("SUCCESS")
          .setCustomId(entry.code)
          .setEmoji(entry.emoji)
        prefixButtons.push(button)
      })
      const controlButtons: Discord.MessageButton[] = [
        new Discord.MessageButton()
          .setCustomId("confirm")
          .setStyle("SUCCESS")
          .setDisabled(true)
          .setEmoji("✅")
          .setLabel(getString("pagination.confirm", "global")),
        new Discord.MessageButton()
          .setCustomId("cancel")
          .setStyle("DANGER")
          .setEmoji("❎")
          .setLabel(getString("pagination.cancel", "global"))
      ]
      const components: Discord.MessageButton[][] = []
      let p = 0
      while (p < prefixButtons.length) components.push(prefixButtons.slice(p, p += 5))
      components.push(controlButtons)
      const rows = components.map(c => ({ type: 1, components: c }))

      if (!userLangs.length) {
        if (member.roles.cache.find(role => role.name.startsWith("Bot ") && role.id !== "732615152246980628") || member.roles.cache.find(role => role.name.startsWith("SkyblockAddons "))) { //Bot updates
          const embed = new Discord.MessageEmbed()
            .setColor(errorColor as Discord.HexColorString)
            .setAuthor(getString("moduleName"))
            .setTitle(getString("errors.trNoRoles"))
            .setDescription(getString("customPrefix"))
            .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
          client.cooldowns.get(this.name)!.delete(interaction.user.id)
          return await interaction.editReply({ embeds: [embed] })
        } else {
          const embed = new Discord.MessageEmbed()
            .setColor(errorColor as Discord.HexColorString)
            .setAuthor(getString("moduleName"))
            .setTitle(getString("errors.noLanguages"))
            .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
          client.cooldowns.get(this.name)!.delete(interaction.user.id)
          return await interaction.editReply({ embeds: [embed] })
        }
      }
      const noChangesEmbed = new Discord.MessageEmbed()
        .setColor(neutralColor as Discord.HexColorString)
        .setAuthor(getString("moduleName"))
        .setTitle(getString("react"))
        .setDescription(getString("reactTimer", { cooldown: this.cooldown! }))
        .addField(getString("previewT"), getString("noChanges"))
        .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
      await interaction.editReply({ embeds: [noChangesEmbed], components: rows })
      const msg = await interaction.fetchReply() as Discord.Message

      const collector = msg.createMessageComponentCollector({ time: this.cooldown! * 1000 })

      collector.on('collect', async buttonInteraction => {
        const userDb: DbUser = await client.getUser(buttonInteraction.user.id)
        if (interaction.user.id !== buttonInteraction.user.id) return await buttonInteraction.reply({ content: getString("pagination.notYours", { command: `/${this.name}` }, "global", userDb.lang), ephemeral: true })
        if (buttonInteraction.customId !== "cancel") components[components.length - 1].find(b => b.customId === "confirm")!.setDisabled(false)
        if (buttonInteraction.customId === "confirm") {
          components.forEach(buttons => buttons.forEach(button => button.setDisabled(true)))
          if (prefixes) {
            if (member.nickname !== (`[${prefixes}] ${nickNoPrefix}`)) {
              await member.setNickname(`[${prefixes}] ${nickNoPrefix}`, "Used the prefix command")
                .then(async () => {
                  const embed = new Discord.MessageEmbed()
                    .setColor(successColor as Discord.HexColorString)
                    .setAuthor(getString("moduleName"))
                    .setTitle(getString("saved"))
                    .addField(getString("newNickT"), `\`[${prefixes}] ${nickNoPrefix}\``)
                    .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                  await buttonInteraction.update({ embeds: [embed], components: rows })
                })
                .catch(async err => {
                  const embed = new Discord.MessageEmbed()
                    .setColor(errorColor as Discord.HexColorString)
                    .setAuthor(getString("moduleName"))
                    .setTitle(getString("errors.error"))
                    .setDescription(err.toString())
                    .addField(getString("previewT"), `\`[${prefixes}] ${nickNoPrefix}\``)
                    .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                  await buttonInteraction.update({ embeds: [embed], components: rows })
                  console.log(err.stack || err)
                })
              prefixes = "n"
            } else {
              prefixes = "n"
              const embed = new Discord.MessageEmbed()
                .setColor(errorColor as Discord.HexColorString)
                .setAuthor(getString("moduleName"))
                .setTitle(getString("errors.alreadyThis") + getString("errors.notSaved"))
                .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
              await buttonInteraction.update({ embeds: [embed], components: rows })
            }
          } else {
            const embed = new Discord.MessageEmbed()
              .setColor(errorColor as Discord.HexColorString)
              .setAuthor(getString("moduleName"))
              .setTitle(getString("errors.confirmedNoFlags") + getString("errors.notSaved"))
              .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
            await buttonInteraction.update({ embeds: [embed], components: rows })
          }
        } else if (buttonInteraction.customId === "cancel") {
          components.forEach(buttons => buttons.forEach(button => button.setDisabled(true)))
          prefixes = "n"
          const embed = new Discord.MessageEmbed()
            .setColor(errorColor as Discord.HexColorString)
            .setAuthor(getString("moduleName"))
            .setTitle(getString("errors.cancelled") + getString("errors.notSaved"))
            .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
          await buttonInteraction.update({ embeds: [embed], components: rows })
        } else {
          const clickedEntry = langdb.find(entry => entry.code === buttonInteraction.customId)!
          if (prefixes) prefixes = `${prefixes}-${clickedEntry.emoji}`
          else prefixes = `${clickedEntry.emoji}`
          components.find(button => button.find(b => b.customId === buttonInteraction.customId)?.setDisabled(true).setStyle("SECONDARY"))
          const embed = new Discord.MessageEmbed()
            .setColor(neutralColor as Discord.HexColorString)
            .setAuthor(getString("moduleName"))
            .setTitle(getString("react"))
            .setDescription(getString("reactTimer2", { cooldown: this.cooldown! }))
            .addField(getString("previewT"), `\`[${prefixes}] ${nickNoPrefix}\``)
            .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
          await buttonInteraction.update({ embeds: [embed], components: rows })
        }
      })

      collector.on('end', async () => {
        if (prefixes === "n") return
        components.forEach(buttons => buttons.forEach(button => button.setDisabled(true)))
        if (prefixes.length > 0) {
          if (member.nickname !== (`[${prefixes}] ${nickNoPrefix}`)) {
            member.setNickname(`[${prefixes}] ${nickNoPrefix}`, "Used the prefix command")
              .then(async () => {
                const embed = new Discord.MessageEmbed()
                  .setColor(successColor as Discord.HexColorString)
                  .setAuthor(getString("moduleName"))
                  .setTitle(getString("saved"))
                  .addField(getString("newNickT"), `\`[${prefixes}] ${nickNoPrefix}\``)
                  .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                await interaction.editReply({ embeds: [embed], components: rows })
              })
              .catch(async err => {
                const embed = new Discord.MessageEmbed()
                  .setColor(errorColor as Discord.HexColorString)
                  .setAuthor(getString("moduleName"))
                  .setTitle(getString("errors.error"))
                  .setDescription(err.toString())
                  .addField(getString("previewT"), `\`[${prefixes}] ${nickNoPrefix}\``)
                  .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                await interaction.editReply({ embeds: [embed], components: rows })
                console.log(err.stack || err)
              })
          } else {
            const embed = new Discord.MessageEmbed()
              .setColor(successColor as Discord.HexColorString)
              .setAuthor(getString("moduleName"))
              .setTitle(getString("errors.alreadyThis") + getString("errors.notSaved"))
              .addField(getString("newNickT"), getString("noChanges"))
              .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
            await interaction.editReply({ embeds: [embed], components: rows })
          }
        } else {
          const embed = new Discord.MessageEmbed()
            .setColor(errorColor as Discord.HexColorString)
            .setAuthor(getString("moduleName"))
            .setTitle(getString("errors.timedOut"))
            .setDescription(getString("errors.timeOut") + getString("errors.notSaved"))
            .addField(getString("newNickT"), getString("noChanges"))
            .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
          await interaction.editReply({ embeds: [embed], components: rows })
        }
      })
    }
  }
}

export default command
