import Discord from "discord.js"
import type { Command } from "../../index"
import { generateTip } from "../../lib/util"

const command: Command = {
    name: "role",
    description: "Gives information about any given role",
    options: [{
        type: "ROLE",
        name: "role",
        description: "The role to get information for",
        required: true
    }],
    roleWhitelist: ["764442984119795732"], //Discord Administrator
    channelWhitelist: ["730042612647723058", "551693960913879071"], //bot-dev admin-bots
    async execute(interaction) {
        const role = interaction.options.getRole("role", true) as Discord.Role,
            createdAt = Math.round(role.createdTimestamp / 1000),
            permissions = role.permissions.toArray(),
            member = interaction.member as Discord.GuildMember

        let tags: Discord.EmbedFieldData | null = null
        if (role.tags) {
            if (role.tags.botId) tags = { name: "This role is managed by", value: `<@!${role.tags.botId}>`, inline: true }
            else if (role.tags.integrationId)
                tags = {
                    name: "Managed by integration",
                    value: await role.guild.fetchIntegrations()
                        .then(integrations => integrations.get(role.tags!.integrationId!)!.name),
                    inline: true
                }
            else if (role.tags.premiumSubscriberRole) tags = { name: "Premium Subscriber Role", value: "True", inline: true }
        }
        const embed = new Discord.MessageEmbed()
            .setColor(role.color || "BLURPLE")
            .setThumbnail(role.iconURL({ format: "png", size: 4096 }) ?? "")
            .setAuthor("Role information")
            .setTitle(`${role.name} ${role.unicodeEmoji ?? ""}`)
            .setDescription(`${role} (ID: ${role.id})`)
            .addFields(
                { name: "Mentionable", value: role.mentionable ? "Yes" : "No", inline: true },
                { name: "Hoisted", value: role.hoist ? "Yes" : "No", inline: true },
                { name: "Created at", value: `<t:${createdAt}:F> (<t:${createdAt}:R>)`, inline: true },

                { name: "Members", value: `${role.members.size}`, inline: true },
                { name: "Position", value: `${role.position}`, inline: true },
                { name: "HEX color", value: role.hexColor, inline: true },

                { name: "Permissions", value: permissions.includes("ADMINISTRATOR") ? "ADMINISTRATOR" : permissions.join(", ") }
            )
            .setFooter(generateTip(), member.displayAvatarURL({ format: "png", dynamic: true }))
        if (tags) embed.spliceFields(5, 1, tags)

        await interaction.reply({ embeds: [embed] })
    }
}

export default command
