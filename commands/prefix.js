const {
  workingColor,
  errorColor,
  successColor,
  neutralColor,
  langdb
} = require("../config.json");
const Discord = require("discord.js");

module.exports = {
  name: "prefix",
  description: "Gives the specified user the appropriate prefix for their language(s).",
  aliases: ["langprefix", "languageprefix"],
  usage: "[user]",
  cooldown: 60,
  guildOnly: true,
  execute(message, args) {
    //message.delete();
    const embed = new Discord.MessageEmbed()
      .setColor(workingColor)
      .setTitle("Prefix")
      .setDescription("One second... ")
      .setFooter("Executed by " + message.author.tag);
    message.channel.send(embed)
      .then(msg => {
        var userLangs = []
        var prefixes = ""
        var user = message.member
        if (args[0] != undefined) {
          user = message.guild.members.cache.get(args[0])
        }

        if (user.roles.cache.some(r => r.name.startsWith("Bulgarian"))) { userLangs.push("🇧🇬"); msg.react("🇧🇬") }
        if (user.roles.cache.some(r => r.name.startsWith("Chinese"))) { userLangs.push("🇨🇳"); msg.react("🇨🇳") }
        if (user.roles.cache.some(r => r.name.startsWith("Czech"))) { userLangs.push("🇨🇿"); msg.react("🇨🇿") }
        if (user.roles.cache.some(r => r.name.startsWith("Danish"))) { userLangs.push("🇩🇰"); msg.react("🇩🇰") }
        if (user.roles.cache.some(r => r.name.startsWith("Dutch"))) { userLangs.push("🇳🇱"); msg.react("🇳🇱") }
        if (user.roles.cache.some(r => r.name.startsWith("Finnish"))) { userLangs.push("🇫🇮"); msg.react("🇫🇮") }
        if (user.roles.cache.some(r => r.name.startsWith("French"))) { userLangs.push("🇫🇷"); msg.react("🇫🇷") }
        if (user.roles.cache.some(r => r.name.startsWith("German"))) { userLangs.push("🇩🇪"); msg.react("🇩🇪") }
        if (user.roles.cache.some(r => r.name.startsWith("Greek"))) { userLangs.push("🇬🇷"); msg.react("🇬🇷") }
        if (user.roles.cache.some(r => r.name.startsWith("Italian"))) { userLangs.push("🇮🇹"); msg.react("🇮🇹") }
        if (user.roles.cache.some(r => r.name.startsWith("Japanese"))) { userLangs.push("🇯🇵"); msg.react("🇯🇵") }
        if (user.roles.cache.some(r => r.name.startsWith("Korean"))) { userLangs.push("🇰🇷"); msg.react("🇰🇷") }
        if (user.roles.cache.some(r => r.name.startsWith("Norwegian"))) { userLangs.push("🇳🇴"); msg.react("🇳🇴") }
        if (user.roles.cache.some(r => r.name.startsWith("Polish"))) { userLangs.push("🇵🇱"); msg.react("🇵🇱") }
        if (user.roles.cache.some(r => r.name.startsWith("Portuguese"))) { userLangs.push("🇵🇹"); msg.react("🇵🇹") }
        if (user.roles.cache.some(r => r.name.startsWith("Brazilian"))) { userLangs.push("🇧🇷"); msg.react("🇧🇷") }
        if (user.roles.cache.some(r => r.name.startsWith("Russian"))) { userLangs.push("🇷🇺"); msg.react("🇷🇺") }
        if (user.roles.cache.some(r => r.name.startsWith("Spanish"))) { userLangs.push("🇪🇸"); msg.react("🇪🇸") }
        if (user.roles.cache.some(r => r.name.startsWith("Swedish"))) { userLangs.push("🇸🇪"); msg.react("🇸🇪") }
        if (user.roles.cache.some(r => r.name.startsWith("Thai"))) { userLangs.push("🇹🇭"); msg.react("🇹🇭") }
        if (user.roles.cache.some(r => r.name.startsWith("Turkish"))) { userLangs.push("🇹🇷"); msg.react("🇹🇷") }
        if (user.roles.cache.some(r => r.name.startsWith("Ukrainian"))) { userLangs.push("🇺🇦"); msg.react("🇺🇦") }

        setTimeout(() => {
          msg.react("✅")
        }, 1000)

        if (userLangs.length < 1) {
          const embed = new Discord.MessageEmbed()
            .setColor(errorColor)
            .setTitle("Prefix")
            .setDescription("You don't seem to have any language roles! Please contact <@722738307477536778> if you think this is in error.")
            .setFooter("Executed by " + message.author.tag);
          msg.edit(embed)
        } else {
          const embed = new Discord.MessageEmbed()
            .setColor(neutralColor)
            .setTitle("Prefix")
            .setDescription("React with all flags you want to add to your prefix in order. You have 20 seconds in total. Hit ✅ to stop.")
            .addFields({ name: "Chosen flags", value: "None" })
            .setFooter("Executed by " + message.author.tag);
          msg.edit(embed)

          const filter = (reaction, reacter) => {
            return (userLangs.includes(reaction.emoji.name) || reaction.emoji.name === "✅") && reacter.id === message.author.id;
          };

          const collector = msg.createReactionCollector(filter, { time: 20000 });

          collector.on('collect', (reaction, user) => {
            if (reaction.emoji.name === "✅") {
              msg.reactions.removeAll()
              if (prefixes.length > 0) {
                user.setNickname("[" + prefixes + "] " + user.username)
                  .then(() => {
                    const embed = new Discord.MessageEmbed()
                      .setColor(successColor)
                      .setTitle("Prefix")
                      .setDescription("Your prefix has been saved!")
                      .addFields({ name: "Chosen flags", value: "\`" + prefixes + "\`" })
                      .setFooter("Executed by " + message.author.tag);
                    msg.edit(embed)
                  })
                  .catch(err => {
                    const embed = new Discord.MessageEmbed()
                      .setColor(errorColor)
                      .setTitle("Prefix")
                      .setDescription("Failed to change nickname to " + prefixes + ".\n\nReason:\n> " + err)
                      .addFields({ name: "Chosen flags", value: "\`" + prefixes + "\`" })
                      .setFooter("Executed by " + message.author.tag);
                    msg.edit(embed)
                    console.log(err)
                  })
              } else {
                const embed = new Discord.MessageEmbed()
                  .setColor(errorColor)
                  .setTitle("Prefix")
                  .setDescription("You didn't react to any flags, so your prefix wasn't saved.")
                  .addFields({ name: "Chosen flags", value: "None" })
                  .setFooter("Executed by " + message.author.tag);
                msg.edit(embed)
              }
            } else {
              reaction.remove()
              const valueToRemove = reaction.emoji.name
              userLangs = userLangs.filter(item => item !== valueToRemove)
              console.log(`Collected ${reaction.emoji.name} from ${user.tag}`);
              if (prefixes.length > 0) { prefixes = (prefixes + "-") }
              prefixes = (prefixes + reaction.emoji.name)
              const embed = new Discord.MessageEmbed()
                .setColor(neutralColor)
                .setTitle("Prefix")
                .setDescription("React with all flags you want to add to your prefix in order. You have 20 seconds in total. Hit ✅ to stop.")
                .addFields({ name: "Chosen flags", value: "\`" + prefixes + "\`" })
                .setFooter("Executed by " + message.author.tag);
              msg.edit(embed)
              if (msg.reactions.length < 2) {
                msg.reactions.removeAll()
                if (prefixes.length > 0) {
                  user.setNickname("[" + prefixes + "] " + user.user.username)
                    .then(() => {
                      const embed = new Discord.MessageEmbed()
                        .setColor(successColor)
                        .setTitle("Prefix")
                        .setDescription("Your prefix has been saved!")
                        .addFields({ name: "Chosen flags", value: "\`" + prefixes + "\`" })
                        .setFooter("Executed by " + message.author.tag);
                      msg.edit(embed)
                    })
                    .catch(err => {
                      const embed = new Discord.MessageEmbed()
                        .setColor(errorColor)
                        .setTitle("Prefix")
                        .setDescription("Failed to change nickname to " + prefixes + ".\n\nReason:\n> " + err)
                        .addFields({ name: "Chosen flags", value: "\`" + prefixes + "\`" })
                        .setFooter("Executed by " + message.author.tag);
                      msg.edit(embed)
                      console.log(err)
                    })
                } else {
                  const embed = new Discord.MessageEmbed()
                    .setColor(errorColor)
                    .setTitle("Prefix")
                    .setDescription("You didn't react to any flags, so your prefix wasn't saved.")
                    .addFields({ name: "Chosen flags", value: "None" })
                    .setFooter("Executed by " + message.author.tag);
                  msg.edit(embed)
                }
              }
            }
          });

          collector.on('end', collected => {
            msg.reactions.removeAll()
            if (prefixes.length > 0) {
              user.setNickname("[" + prefixes + "] " + user.user.username)
                .then(() => {
                  const embed = new Discord.MessageEmbed()
                    .setColor(successColor)
                    .setTitle("Prefix")
                    .setDescription("Your prefix has been saved!")
                    .addFields({ name: "Chosen flags", value: "\`" + prefixes + "\`" })
                    .setFooter("Executed by " + message.author.tag);
                  msg.edit(embed)
                })
                .catch(err => {
                  const embed = new Discord.MessageEmbed()
                    .setColor(errorColor)
                    .setTitle("Prefix")
                    .setDescription("Failed to change nickname to " + prefixes + ".\n\nReason:\n> " + err)
                    .addFields({ name: "Chosen flags", value: "\`" + prefixes + "\`" })
                    .setFooter("Executed by " + message.author.tag);
                  msg.edit(embed)
                  console.log(err)
                })
            } else {
              const embed = new Discord.MessageEmbed()
                .setColor(errorColor)
                .setTitle("Prefix")
                .setDescription("You didn't react to any flags, so your prefix wasn't saved.")
                .addFields({ name: "Chosen flags", value: "None" })
                .setFooter("Executed by " + message.author.tag);
              msg.edit(embed)
            }
          });
        }
      })

  }
}