import Discord from "discord.js"
import { Command, GetStringFunction } from "../../index"

const command: Command = {
  name: "mention",
  description: "Mentions a language role with a message.",
  options: [{
    type: "STRING",
    name: "language",
    description: "The language to mention",
    required: true
  },
  {
    type: "STRING",
    name: "role",
    description: "The role to mention",
    choices: [{
      name: "Both roles",
      value: "all"
    },
    {
      name: "Proofreader",
      value: "proofreader"
    },
    {
      name: "Translator",
      value: "translator"
    }],
    required: true
  },
  {
    type: "STRING",
    name: "message",
    description: "The message to send with the mention.",
    required: false
  }],
  cooldown: 120,
  roleWhitelist: ["569839580971401236", "764442984119795732"], //Hypixel Proofreader and Discord Administrator
  channelBlacklist: ["621298919535804426", "619662798133133312", "712046319375482910", "644620638878695424", "550951034332381184", "549894938712866816", "713084081579098152"],
  async execute(interaction, getString: GetStringFunction) {
    const roleType = interaction.options.getString("role", true) as "all" | "proofreader" | "translator",
      lang = interaction.options.getString("language", true).toLowerCase(),
      member = interaction.member as Discord.GuildMember
    let roleName = lang.charAt(0).toUpperCase() + lang.slice(1),
      message = interaction.options.getString("message", false)
    if (!message) message = "<a:bongoping:614477510423478275>"

    const langs: { [key: string]: string } = {
      Chinesesimplified: "Chinese Simplified",
      "Chinese-simplified": "Chinese Simplified",
      Zhcn: "Chinese Simplified",
      Chinesetraditional: "Chinese Traditional",
      "Chinese-traditional": "Chinese Traditional",
      Zhtw: "Chinese Traditional",
      Lolcat: "LOLCAT",
      Lol: "LOLCAT",
      Bg: "Bulgarian",
      Cs: "Czech",
      Da: "Danish",
      Nl: "Dutch",
      Fi: "Finnish",
      Fr: "French",
      De: "German",
      El: "Greek",
      It: "Italian",
      Ja: "Japanese",
      Ko: "Korean",
      Ms: "Malay",
      No: "Norwegian",
      Pl: "Polish",
      Pt: "Portuguese",
      Ptbr: "Portuguese Brazilian",
      Brazilian: "Portuguese Brazilian",
      Ru: "Russian",
      Es: "Spanish",
      Sv: "Swedish",
      Se: "Swedish",
      Th: "Thai",
      Tr: "Turkish",
      Ua: "Ukrainian",
      Enpt: "Pirate English",
      Pirate: "Pirate English"
    }

    if (langs.hasOwnProperty(roleName)) roleName = langs[roleName]
    const role = interaction.guild!.roles.cache.find(x => x.name === (`${roleName} Proofreader`))

    if (!role) throw "falseRole"
    if (roleType === "proofreader") {
      const toPing = interaction.guild!.roles.cache.find(role => role.name === `${roleName} Proofreader`)
      if (member.roles.cache.find(role => role.name === `${roleName} Proofreader` || member.permissions.has("MANAGE_ROLES"))) {
        await interaction.reply(`**${interaction.user}**: ${toPing} ${message}`)
      } else {
        await interaction.reply({ content: `${getString("errorNoPing")}${getString("errorNoPingPr")} ${getString("errorNoPingDisclaimer")}`, ephemeral: true })
      }
    } else if (roleType === "translator") {
      const toPing = interaction.guild!.roles.cache.find(role => role.name === `${roleName} Translator`)
      if (member.roles.cache.find(role => role.name === `${roleName} Proofreader` || member.permissions.has("MANAGE_ROLES"))) {
        await interaction.reply(`**${interaction.user}**: ${toPing} ${message}`)
      } else {
        await interaction.reply({ content: `${getString("errorNoPing")}${getString("errorNoPingTr")} ${getString("errorNoPingDisclaimer")}`, ephemeral: true })
      }
    } else if (roleType === "all") {
      const translatorPing = interaction.guild!.roles.cache.find(role => role.name === `${roleName} Translator`)
      const proofreaderPing = interaction.guild!.roles.cache.find(role => role.name === `${roleName} Proofreader`)
      if (member.roles.cache.find(role => role.name === `${roleName} Proofreader` || member.permissions.has("MANAGE_ROLES"))) {
        await interaction.reply(`**${interaction.user}**: ${translatorPing} ${proofreaderPing} ${message}`)
      } else {
        await interaction.reply({ content: `${getString("errorNoPing")}${getString("errorNoPingAll")} ${getString("errorNoPingDisclaimer")}`, ephemeral: true })
      }
    } else throw "falseRole"
  }
}

export default command
