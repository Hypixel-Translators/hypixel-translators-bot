import { errorColor, neutralColor } from "../../config.json"
import Discord from "discord.js"
import fs from "fs"
import { Command, client, GetStringFunction } from "../../index"
import { db, DbUser } from "../../lib/dbclient"

const command: Command = {
  name: "help",
  description: "Shows you all available commands and general info about the bot.",
  options: [{
    type: "STRING",
    name: "command",
    description: "The command to get information for",
    required: false
  },
  {
    type: "INTEGER",
    name: "page",
    description: "The help page to open",
    required: false
  }],
  cooldown: 60,
  channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058"], //bots staff-bots bot-dev 
  allowDM: true,
  async execute(interaction: Discord.CommandInteraction, getString: GetStringFunction) {
    const executedBy = getString("executedBy", { user: interaction.user.tag }, "global"),
      madeBy = getString("madeBy", { developer: "QkeleQ10#8482" })

    // Define categories to get commands from and all pages
    const categories = ["Utility", "Info", "Projects"],
      pages = [
        { number: 0 },
        { number: 1, badge: "🛠", titleString: "utilityHelp" },
        { number: 2, badge: "ℹ", titleString: "infoHelp" },
        { number: 3, badge: "<:crowdin:820381256016723988>", titleString: "projectsHelp" }
      ] as Page[]
    let pageIndex = 1
    categories.forEach(category => {
      const categoryCommands: string[] = []
      fs.readdirSync(`./src/commands/${category}/`).forEach(command => categoryCommands.push(command.split(".").shift()!))
      categoryCommands.forEach(cmd => {
        if (client.commands.get(cmd)!.dev) categoryCommands.splice(categoryCommands.indexOf(cmd), 1)
        else if (!client.commands.get(cmd)!.allowDM && (interaction.channel as Discord.TextChannel | Discord.DMChannel).type === "dm") categoryCommands.splice(categoryCommands.indexOf(cmd), 1)
      })
      pages[pageIndex].commands = categoryCommands
      pageIndex++
    })

    const commandInput = interaction.options.get("command")?.value as string | undefined,
      pageInput = interaction.options.get("page")?.value as number | undefined

    if (!commandInput) {
      if (Number(pageInput) > pages.length || Number(pageInput) < 1) {
        const embed = new Discord.MessageEmbed()
          .setColor(errorColor as Discord.HexColorString)
          .setAuthor(getString("moduleName"))
          .setTitle(getString("page1Title"))
          .setDescription(getString("pageNotExist"))
          .setFooter(`${executedBy} | ${madeBy}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
        return await interaction.reply({ embeds: [embed], ephemeral: true })
      }

      //Determine which page to use
      const page1 = new Discord.MessageEmbed()
        .setColor(neutralColor as Discord.HexColorString)
        .setAuthor(getString("moduleName"))
        .setTitle(getString("page1Title"))
        .setDescription(getString("commandsListTooltip", { developer: client.users.cache.get("240875059953139714")!.toString(), github: "(https://github.com/Hypixel-Translators/hypixel-translators-bot)" }))
        .addFields(
          { name: getString("pageNumber", { number: 2, total: pages.length }), value: `🛠 ${getString("utilityHelp")}`, inline: true },
          { name: getString("pageNumber", { number: 3, total: pages.length }), value: `ℹ ${getString("infoHelp")}`, inline: true },
          { name: getString("pageNumber", { number: 4, total: pages.length }), value: `<:crowdin:820381256016723988> ${getString("projectsHelp")}`, inline: true })
        .setFooter(`${executedBy} | ${madeBy}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))

      pages[0].embed = page1

      let page = 0
      if (pageInput) page = pageInput - 1

      let pageEmbed = fetchPage(page, pages, getString, executedBy, interaction) as Discord.MessageEmbed,
        controlButtons = new Discord.MessageActionRow()
          .addComponents(
            new Discord.MessageButton()
              .setEmoji("⏮️")
              .setCustomId("first")
              .setLabel(getString("pagination.first", "global")),
            new Discord.MessageButton()
              .setEmoji("◀️")
              .setCustomId("previous")
              .setLabel(getString("pagination.previous", "global")),
            new Discord.MessageButton()
              .setEmoji("▶️")
              .setCustomId("next")
              .setLabel(getString("pagination.next", "global")),
            new Discord.MessageButton()
              .setEmoji("⏭️")
              .setCustomId("last")
              .setLabel(getString("pagination.last", "global"))
          )
      controlButtons = updateButtonColors(controlButtons, page, pages)

      await interaction.reply({ embeds: [pageEmbed], components: [controlButtons] })
      const msg = (await interaction.fetchReply()) as Discord.Message,
        collector = msg.createMessageComponentCollector({ time: this.cooldown! * 1000 })

      collector.on("collect", async buttonInteraction => {
        const userDb: DbUser = await client.getUser(buttonInteraction.user.id)
        if (interaction.user.id !== buttonInteraction.user.id) return await buttonInteraction.reply({ content: getString("pagination.notYours", { command: `/${this.name}` }, "global", userDb.lang), ephemeral: true })
        else if (buttonInteraction.customId === "first") page = 0
        else if (buttonInteraction.customId === "last") page = pages.length - 1
        else if (buttonInteraction.customId === "previous") {
          page--
          if (page < 0) page = 0
        }
        else if (buttonInteraction.customId === "next") {
          page++
          if (page > pages.length - 1) page = pages.length - 1
        }
        controlButtons = updateButtonColors(controlButtons, page, pages)
        pageEmbed = fetchPage(page, pages, getString, executedBy, interaction) as Discord.MessageEmbed
        await buttonInteraction.update({ embeds: [pageEmbed], components: [controlButtons] })
      })

      collector.on("end", async () => {
        controlButtons.components.forEach(button => button.setDisabled(true))
        await interaction.editReply({ content: getString("pagination.timeOut", { command: `\`/${this.name}\`` }, "global"), embeds: [pageEmbed], components: [controlButtons] })
      })

    } else {

      const command = client.commands.get(commandInput)
      if (!command || !command.name) throw "noCommand"

      let cmdDesc
      if (command.category !== "Admin" && command.category !== "Staff") {
        cmdDesc = getString(`${command.name}.description`)
      } else if (command.category === "Staff" && (interaction.member as Discord.GuildMember | null)?.roles.cache.has("768435276191891456") || command.category === "Admin" && (interaction.member as Discord.GuildMember | null)?.roles.cache.has("764442984119795732")) {
        cmdDesc = command.description
      }

      if (command.dev && !(interaction.member as Discord.GuildMember | null)?.roles.cache.has("768435276191891456")) cmdDesc = getString("inDev") // Discord Staff

      const embed = new Discord.MessageEmbed()
        .setColor(neutralColor as Discord.HexColorString)
        .setAuthor(getString("moduleName"))
        .setTitle(getString("commandInfoFor") + `\`/${command.name}\``)
        .setDescription(cmdDesc || getString("staffOnly"))
        .setFooter(`${executedBy} | ${madeBy}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
      if (cmdDesc !== getString("inDev")) {
        if (command.cooldown) {
          if (command.cooldown >= 120) embed.addField(getString("cooldownField"), `${command.cooldown / 60} ${getString("minutes")}`, true)
          else if (command.cooldown === 1) embed.addField(getString("cooldownField"), `${command.cooldown} ${getString("second")}`, true)
          else embed.addField(getString("cooldownField"), `${command.cooldown} ${getString("seconds")}`, true)
        }
      }
      await interaction.reply({ embeds: [embed] })
    }
  }
}

function fetchPage(page: number, pages: Page[], getString: GetStringFunction, executedBy: string, interaction: Discord.CommandInteraction) {
  if (page > pages.length - 1) page = pages.length - 1
  if (page < 0) page = 0
  let pageEmbed: Discord.MessageEmbed

  if (pages[page]) {
    if (pages[page].embed) pageEmbed = pages[page].embed!
    else if (pages[page].commands) {
      pageEmbed = new Discord.MessageEmbed()
        .setColor(neutralColor as Discord.HexColorString)
        .setAuthor(getString("moduleName"))
        .setTitle(`${pages[page].badge} ${getString(pages[page].titleString!)}`)
        .setFooter(`${getString("pagination.page", { number: page + 1, total: pages.length }, "global")} | ${executedBy}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
      pages[page].commands!.forEach(command => pageEmbed!.addField(`\`/${command}\``, getString(`${command}.description`)))
    } else return console.error(`Help page ${page} has no embed fields specified!`)
  } else return console.error(`Tried accessing help page ${page} but it doesn't exist in the pages array!`)

  return pageEmbed
}

export function updateButtonColors(row: Discord.MessageActionRow, page: number, pages: any[]) {
  if (page == 0) {
    row.components.forEach(button => {
      if (button.customId === "first" || button.customId === "previous") (button as Discord.MessageButton)
        .setStyle("SECONDARY")
        .setDisabled(true)
      else (button as Discord.MessageButton)
        .setStyle("SUCCESS")
        .setDisabled(false)
    })
  } else if (page == pages.length - 1) {
    row.components.forEach(button => {
      if (button.customId === "last" || button.customId === "next") (button as Discord.MessageButton)
        .setStyle("SECONDARY")
        .setDisabled(true)
      else (button as Discord.MessageButton)
        .setStyle("SUCCESS")
        .setDisabled(false)
    })
  } else {
    row.components.forEach(button => (button as Discord.MessageButton)
      .setStyle("SUCCESS")
      .setDisabled(false)
    )
  }
  return row
}
interface Page {
  number: number
  commands?: string[]
  badge?: string
  titleString?: string
  embed?: Discord.MessageEmbed
}

export default command
