const { warnRole1, warnRole2, warnRole3 } = require("../config.json");
const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
    name: "removewarns",
    description: "Removes all warnings from a user.",
    aliases: ["removewarn", "unwarn", "pardon"],
    usage: "<user id>",
    execute(message, args) {
      const embed = new Discord.MessageEmbed()
      .setColor(errorColor)
      .setTitle("Unwarn")
      .setDescription("This command is not enabled!")
      .addFields({ name: "Current warnings", value: "Couldn't fetch" })
      .setFooter("Executed by " + message.author.tag);

    message.channel.send(embed)
    }
}
        /*message.delete();
        const embed = new Discord.MessageEmbed()
            .setColor(workingColor)
            .setTitle("Unwarn")
            .setDescription("<@" + args[0] + ">'s warnings are being removed...")
            .addFields({ name: "...", value: "..." })
            .setFooter("Executed by " + message.author.tag);

        message.channel.send(embed).then(msg => {
            if (message.member.hasPermission("KICK_MEMBERS")) {
                const toWarn = message.guild.members.cache.get(args[0]);
                toWarn.roles.remove(warnRole3).then(() => {
                    toWarn.roles.remove(warnRole2).then(() => {
                        toWarn.roles.remove(warnRole1)
                            .then(() => {
                                const embed = new Discord.MessageEmbed()
                                    .setColor(successColor)
                                    .setTitle("Unwarn")
                                    .setDescription("<@" + args[0] + ">'s warnings have been removed.")
                                    .addFields({ name: "Current warnings", value: "No warnings" })
                                    .setFooter("Executed by " + message.author.tag);
                                msg.edit(embed)
                            })
                    })
                })
            }
        })
    }
}*/