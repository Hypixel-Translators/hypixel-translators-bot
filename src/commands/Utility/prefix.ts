import { loadingColor, errorColor, successColor, neutralColor } from "../../config.json"
import Discord from "discord.js"
import { flag } from "country-emoji"
import { db } from "../../lib/dbclient"
import { client, Command } from "../../index"
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
  async execute(interaction: Discord.CommandInteraction, getString: (path: string, variables?: { [key: string]: string | number } | string, cmd?: string, lang?: string) => any) {
    const executedBy = getString("executedBy", { user: interaction.user.tag }, "global"),
      member = interaction.member as Discord.GuildMember,
      nickNoPrefix = member.displayName.replace(/\[[^\s]*\] ?/g, "").trim(),
      langdb: LangDbEntry[] = await db.collection("langdb").find().toArray()

    if (interaction.options.get("flags")?.value && !member.roles.cache.has("569839517444341771") && !member.roles.cache.has("569839580971401236")) { //Hypixel Translator and Proofreader
      const flagEmojis: (string | undefined)[] = [];
      (interaction.options.get("flags")!.value as string).split(" ").forEach(emoji => {
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
        .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true })),
        confirmButtons = new Discord.MessageActionRow()
          .addComponents(
            new Discord.MessageButton()
              .setCustomID("confirm")
              .setStyle("SUCCESS")
              .setLabel(getString("confirm"))
              .setEmoji("✅"),
            new Discord.MessageButton()
              .setCustomID("cancel")
              .setStyle("DANGER")
              .setEmoji("❎")
              .setLabel(getString("cancel"))
          )
      await interaction.reply({ embeds: [embed], components: [confirmButtons] })
      const msg = await interaction.fetchReply() as Discord.Message

      const collector = msg.createMessageComponentInteractionCollector((interaction: Discord.MessageComponentInteraction) => interaction.customID === "confirm" || interaction.customID === "cancel", { time: this.cooldown! * 1000 })

      collector.on("collect", async buttonInteraction => {
        if (interaction.user.id !== buttonInteraction.user.id) return await buttonInteraction.reply({ content: getString("pagination.notYours", { command: `/${this.name}` }, "global"), ephemeral: true })
        if (buttonInteraction.customID === "confirm") {
          if (member.nickname !== (`[${prefix}] ${nickNoPrefix}`)) {
            await member.setNickname(`[${prefix}] ${nickNoPrefix}`, "Used the prefix command")
              .then(async () => {
                const embed = new Discord.MessageEmbed()
                  .setColor(successColor)
                  .setAuthor(getString("moduleName"))
                  .setTitle(getString("saved"))
                  .addField(getString("newNickT"), `\`[${prefix}] ${nickNoPrefix}\``)
                  .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                await interaction.editReply({ embeds: [embed], components: [] })
                const staffAlert = new Discord.MessageEmbed()
                  .setColor(loadingColor)
                  .setAuthor("Prefix")
                  .setTitle("A user manually changed their prefix")
                  .setDescription(`${interaction.user} manually changed their prefix to include the following flag: ${prefix}\nMake sure they have the appropriate roles for this prefix and, if not, follow the appropriate procedure`)
                  .setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                await (interaction.client.channels.cache.get("624881429834366986") as Discord.TextChannel).send({ embeds: [staffAlert] }) //staff-bots
              })
              .catch(async err => {
                const embed = new Discord.MessageEmbed()
                  .setColor(errorColor)
                  .setAuthor(getString("moduleName"))
                  .setTitle(getString("errors.error"))
                  .setDescription(err.toString())
                  .addField(getString("previewT"), `\`[${prefix}] ${nickNoPrefix}\``)
                  .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                await interaction.editReply({ embeds: [embed], components: [] })
                console.log(err.stack || err)
              })
          } else {
            const embed = new Discord.MessageEmbed()
              .setColor(successColor)
              .setAuthor(getString("moduleName"))
              .setTitle(getString("errors.alreadyThis") + getString("errors.notSaved"))
              .addField(getString("newNickT"), getString("noChanges"))
              .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
            await interaction.editReply({ embeds: [embed], components: [] })
          }
          prefix = "n"
        } else if (buttonInteraction.customID === "cancel") {
          prefix = "n"
          const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setAuthor(getString("moduleName"))
            .setTitle(getString("errors.cancelled") + getString("errors.notSaved"))
            .addField(getString("newNickT"), getString("noChanges"))
            .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
          await interaction.editReply({ embeds: [embed], components: [] })
        }
      })
      collector.on('end', async () => {
        if (prefix === "n") return
        if (prefix) {
          if (member.nickname !== (`[${prefix}] ${nickNoPrefix}`)) {
            member.setNickname(`[${prefix}] ${nickNoPrefix}`, "Used the prefix command")
              .then(async () => {
                const embed = new Discord.MessageEmbed()
                  .setColor(successColor)
                  .setAuthor(getString("moduleName"))
                  .setTitle(getString("saved"))
                  .addField(getString("newNickT"), `\`[${prefix}] ${nickNoPrefix}\``)
                  .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                await interaction.editReply({ embeds: [embed], components: [] })
              })
              .catch(async err => {
                const embed = new Discord.MessageEmbed()
                  .setColor(errorColor)
                  .setAuthor(getString("moduleName"))
                  .setTitle(getString("errors.error"))
                  .setDescription(err.toString())
                  .addField(getString("previewT"), `\`[${prefix}] ${nickNoPrefix}\``)
                  .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                await interaction.editReply({ embeds: [embed], components: [] })
                console.log(err.stack || err)
              })
          } else {
            const embed = new Discord.MessageEmbed()
              .setColor(successColor)
              .setAuthor(getString("moduleName"))
              .setTitle(getString("errors.alreadyThis") + getString("errors.notSaved"))
              .addField(getString("newNickT"), getString("noChanges"))
              .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
            await interaction.editReply({ embeds: [embed], components: [] })
          }
        } else {
          const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setAuthor(getString("moduleName"))
            .setTitle(getString("errors.timedOut"))
            .setDescription(getString("errors.timeOutCustom") + getString("errors.notSaved"))
            .addField(getString("newNickT"), getString("noChanges"))
            .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
          await interaction.editReply({ embeds: [embed], components: [] })
        }
      })
    } else {
      const loadingEmbed = new Discord.MessageEmbed()
        .setColor(loadingColor)
        .setAuthor(getString("moduleName"))
        .setTitle(getString("loading"))
        .setDescription(getString("loadingRoles"))
        .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
      await interaction.defer()
      let userLangs: LangDbEntry[] = []
      let prefixes = ""

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
          .setStyle("SECONDARY")
          .setCustomID(entry.code)
          .setEmoji(entry.emoji)
        prefixButtons.push(button)
      })
      const controlButtons: Discord.MessageButton[] = [
        new Discord.MessageButton()
          .setCustomID("confirm")
          .setStyle("SUCCESS")
          .setDisabled(true)
          .setEmoji("✅")
          .setLabel(getString("confirm")),
        new Discord.MessageButton()
          .setCustomID("cancel")
          .setStyle("DANGER")
          .setEmoji("❎")
          .setLabel(getString("cancel"))
      ]
      const components: Discord.MessageButton[][] = []
      let p = 0
      while (p < prefixButtons.length) components.push(prefixButtons.slice(p, p += 5))
      components.push(controlButtons)

      if (!userLangs.length) {
        if (member.roles.cache.find(role => role.name.startsWith("Bot ") && role.id !== "732615152246980628") || member.roles.cache.find(role => role.name.startsWith("SkyblockAddons "))) { //Bot updates
          const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setAuthor(getString("moduleName"))
            .setTitle(getString("errors.trNoRoles"))
            .setDescription(getString("customPrefix"))
            .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
          client.cooldowns.get(this.name)!.delete(interaction.user.id)
          return await interaction.editReply({ embeds: [embed], components: [] })
        } else {
          const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setAuthor(getString("moduleName"))
            .setTitle(getString("errors.noLanguages"))
            .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
          client.cooldowns.get(this.name)!.delete(interaction.user.id)
          return await interaction.editReply({ embeds: [embed], components: [] })
        }
      }
      const noChangesEmbed = new Discord.MessageEmbed()
        .setColor(neutralColor)
        .setAuthor(getString("moduleName"))
        .setTitle(getString("react"))
        .setDescription(getString("reactTimer", { cooldown: this.cooldown! }))
        .addField(getString("previewT"), getString("noChanges"))
        .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
      await interaction.editReply({ embeds: [noChangesEmbed], components: components })
      const msg = await interaction.fetchReply() as Discord.Message

      const collector = msg.createMessageComponentInteractionCollector((buttonInteraction: Discord.MessageComponentInteraction) => userLangs.includes(langdb.find(entry => entry.code === buttonInteraction.customID)!) || buttonInteraction.customID === "confirm" || buttonInteraction.customID === "cancel", { time: this.cooldown! * 1000 })

      collector.on('collect', async buttonInteraction => {
        if (interaction.user.id !== buttonInteraction.user.id) return await buttonInteraction.reply({ content: getString("pagination.notYours", { command: `/${this.name}` }, "global"), ephemeral: true })
        if (buttonInteraction.customID !== "cancel") components.find(button => button.find(b => b.customID === "confirm")!.setDisabled(false))
        if (buttonInteraction.customID === "confirm") {
          if (prefixes) {
            if (member.nickname !== (`[${prefixes}] ${nickNoPrefix}`)) {
              await member.setNickname(`[${prefixes}] ${nickNoPrefix}`, "Used the prefix command")
                .then(async () => {
                  const embed = new Discord.MessageEmbed()
                    .setColor(successColor)
                    .setAuthor(getString("moduleName"))
                    .setTitle(getString("saved"))
                    .addField(getString("newNickT"), `\`[${prefixes}] ${nickNoPrefix}\``)
                    .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                  await buttonInteraction.update({ embeds: [embed], components: [] })
                })
                .catch(async err => {
                  const embed = new Discord.MessageEmbed()
                    .setColor(errorColor)
                    .setAuthor(getString("moduleName"))
                    .setTitle(getString("errors.error"))
                    .setDescription(err.toString())
                    .addField(getString("previewT"), `\`[${prefixes}] ${nickNoPrefix}\``)
                    .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                  await buttonInteraction.update({ embeds: [embed], components: [] })
                  console.log(err.stack || err)
                })
              prefixes = "n"
            } else {
              prefixes = "n"
              const embed = new Discord.MessageEmbed()
                .setColor(errorColor)
                .setAuthor(getString("moduleName"))
                .setTitle(getString("errors.alreadyThis") + getString("errors.notSaved"))
                .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
              await buttonInteraction.update({ embeds: [embed], components: [] })
            }
          } else {
            const embed = new Discord.MessageEmbed()
              .setColor(errorColor)
              .setAuthor(getString("moduleName"))
              .setTitle(getString("errors.confirmedNoFlags") + getString("errors.notSaved"))
              .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
            await buttonInteraction.update({ embeds: [embed], components: [] })
          }
        } else if (buttonInteraction.customID === "cancel") {
          prefixes = "n"
          const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setAuthor(getString("moduleName"))
            .setTitle(getString("errors.cancelled") + getString("errors.notSaved"))
            .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
          await buttonInteraction.update({ embeds: [embed], components: [] })
        } else {
          const clickedEntry = langdb.find(entry => entry.code === buttonInteraction.customID)!
          if (prefixes) prefixes = `${prefixes}-${clickedEntry.emoji}`
          else prefixes = `${clickedEntry.emoji}`
          components.find(button => button.find(b => b.customID === buttonInteraction.customID)!.setDisabled(false))
          const embed = new Discord.MessageEmbed()
            .setColor(neutralColor)
            .setAuthor(getString("moduleName"))
            .setTitle(getString("react"))
            .setDescription(getString("reactTimer2", { cooldown: this.cooldown! }))
            .addField(getString("previewT"), `\`[${prefixes}] ${nickNoPrefix}\``)
            .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
          await buttonInteraction.update({ embeds: [embed], components: components })
        }
      })

      collector.on('end', async () => {
        if (prefixes === "n") return
        if (prefixes.length > 0) {
          if (member.nickname !== (`[${prefixes}] ${nickNoPrefix}`)) {
            member.setNickname(`[${prefixes}] ${nickNoPrefix}`, "Used the prefix command")
              .then(async () => {
                const embed = new Discord.MessageEmbed()
                  .setColor(successColor)
                  .setAuthor(getString("moduleName"))
                  .setTitle(getString("saved"))
                  .addField(getString("newNickT"), `\`[${prefixes}] ${nickNoPrefix}\``)
                  .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                await interaction.editReply({ embeds: [embed], components: [] })
              })
              .catch(async err => {
                const embed = new Discord.MessageEmbed()
                  .setColor(errorColor)
                  .setAuthor(getString("moduleName"))
                  .setTitle(getString("errors.error"))
                  .setDescription(err.toString())
                  .addField(getString("previewT"), `\`[${prefixes}] ${nickNoPrefix}\``)
                  .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
                await interaction.editReply({ embeds: [embed], components: [] })
                console.log(err.stack || err)
              })
          } else {
            const embed = new Discord.MessageEmbed()
              .setColor(successColor)
              .setAuthor(getString("moduleName"))
              .setTitle(getString("errors.alreadyThis") + getString("errors.notSaved"))
              .addField(getString("newNickT"), getString("noChanges"))
              .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
            await interaction.editReply({ embeds: [embed], components: [] })
          }
        } else {
          const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setAuthor(getString("moduleName"))
            .setTitle(getString("errors.timedOut"))
            .setDescription(getString("errors.timeOut") + getString("errors.notSaved"))
            .addField(getString("newNickT"), getString("noChanges"))
            .setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
          await interaction.editReply({ embeds: [embed], components: [] })
        }
      })
    }
  }
}

export default command
