const { blurple } = require("../../config.json")
const Discord = require("discord.js")

module.exports = {
    name: "members",
    description: "Lists all the members in a role",
    aliases: ["listmembers"],
    usage: "+members <role>",
    roleWhitelist: ["764442984119795732"], //Discord Administrator
    channelWhitelist: ["624881429834366986", "730042612647723058", "551693960913879071"], //staff-bots bot-development admin-bots
    execute(message, args) {
        let role = args.join(" ").replace(/[\\<>@#&!]/g, "").toLowerCase()
        if (!role) throw "noRole"
        role = message.guild.roles.cache.find(r => r.id === role || r.name.toLowerCase() === role)
        if (!role) role = message.guild.roles.cache.find(r.name.toLowerCase().includes(role))
        if (!role) throw "falseRole"

        let tags = []
        role.members.forEach(member => tags.push(`<@!${member.user.id}>`))

        const arr = []
        let p = 0
        while (p < tags.length) {
            arr.push(tags.slice(p, p += 85)) //89 is max for now
        }

        let color = role.hexColor
        if (color === "#000000") color = blurple
        const embed = new Discord.MessageEmbed()
            .setColor(color)
            .setAuthor("Members list")
            .setTitle(`Here are all the ${tags.length} members with the ${role.name} role on the server at the moment.`)
        if (arr.length > 1) {
            arr.forEach(arg => {
                embed.setDescription(arg.join(", "))
                message.channel.send(embed)
                embed
                    .setAuthor("")
                    .setTitle("")
                    .setFooter("")
            })
        } else embed.setDescription(arr[0].join(", "))
        embed.setFooter(`Executed by ${message.author.tag}`, message.author.displayAvatarURL({ format: "png", dynamic: true }))
        message.channel.send(embed)
    }
}