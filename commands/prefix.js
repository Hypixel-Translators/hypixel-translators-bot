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
        var user = message.guild.members.cache.get(message.member.id)
        if (args) {
          user = message.guild.members.cache.get(args[0])
        }

        checkUserLangs()

        const filter = (reaction, reacter) => {
          return userLangs.includes(reaction.emoji.name) && reacter.id === message.author.id;
        };

        const collector = msg.createReactionCollector(filter, { time: 20000 });

        collector.on('collect', (reaction, user) => {
          console.log(`Collected ${reaction.emoji.name} from ${user.tag}`);
        });

        collector.on('end', collected => {
          console.log(`Collected ${collected.size} items`);
        });


        /*const embed = new Discord.MessageEmbed()
          .setColor(workingColor)
          .setTitle("Prefix")
          .setDescription("Changing username with prefix(es) \`" + prefixes + "\`...")
          .setFooter("Executed by " + message.author.tag);
        msg.edit(embed)
        console.log(prefixes)
        user.setNickname("[" + prefixes + "] " + user.user.username)
          .then(() => {
            const embed = new Discord.MessageEmbed()
              .setColor(successColor)
              .setTitle("Prefix")
              .setDescription("Changed username with prefix(es) \`" + prefixes + "\`.")
              .setFooter("Executed by " + message.author.tag);
            msg.edit(embed)
          })
          .catch(err => {
            const embed = new Discord.MessageEmbed()
              .setColor(errorColor)
              .setTitle("Prefix")
              .setDescription("Failed to change nickname to" + prefixes + ".\n\nReason:\n> " + err)
              .setFooter("Executed by " + message.author.tag);
            msg.edit(embed)
            console.log(err)
          })*/
      })
  }
}


async function checkUserLangs() {
  if (user.roles.cache.some(r => r.name.startsWith("Bulgarian"))) { await userLangs.push("🇧🇬"); await msg.react("🇧🇬") }
  if (user.roles.cache.some(r => r.name.startsWith("Chinese"))) { await userLangs.push("🇨🇳"); await msg.react("🇨🇳") }
  if (user.roles.cache.some(r => r.name.startsWith("Czech"))) { await userLangs.push("🇨🇿"); await msg.react("🇨🇿") }
  if (user.roles.cache.some(r => r.name.startsWith("Danish"))) { await userLangs.push("🇩🇰"); await msg.react("🇩🇰") }
  if (user.roles.cache.some(r => r.name.startsWith("Dutch"))) { await userLangs.push("🇳🇱"); await msg.react("🇳🇱") }
  if (user.roles.cache.some(r => r.name.startsWith("Finnish"))) { await userLangs.push("🇫🇮"); await msg.react("🇫🇮") }
  if (user.roles.cache.some(r => r.name.startsWith("French"))) { await userLangs.push("🇫🇷"); await msg.react("🇫🇷") }
  if (user.roles.cache.some(r => r.name.startsWith("German"))) { await userLangs.push("🇩🇪"); await msg.react("🇩🇪") }
  if (user.roles.cache.some(r => r.name.startsWith("Greek"))) { await userLangs.push("🇬🇷"); await msg.react("🇬🇷") }
  if (user.roles.cache.some(r => r.name.startsWith("Italian"))) { await userLangs.push("🇮🇹"); await msg.react("🇮🇹") }
  if (user.roles.cache.some(r => r.name.startsWith("Japanese"))) { await userLangs.push("🇯🇵"); await msg.react("🇯🇵") }
  if (user.roles.cache.some(r => r.name.startsWith("Korean"))) { await userLangs.push("🇰🇷"); await msg.react("🇰🇷") }
  if (user.roles.cache.some(r => r.name.startsWith("Norwegian"))) { await userLangs.push("🇳🇴"); await msg.react("🇳🇴") }
  if (user.roles.cache.some(r => r.name.startsWith("Polish"))) { await userLangs.push("🇵🇱"); await msg.react("🇵🇱") }
  if (user.roles.cache.some(r => r.name.startsWith("Portuguese"))) { await userLangs.push("🇵🇹"); await msg.react("🇵🇹") }
  if (user.roles.cache.some(r => r.name.startsWith("Brazilian"))) { await userLangs.push("🇧🇷"); await msg.react("🇧🇷") }
  if (user.roles.cache.some(r => r.name.startsWith("Russian"))) { await userLangs.push("🇷🇺"); await msg.react("🇷🇺") }
  if (user.roles.cache.some(r => r.name.startsWith("Spanish"))) { await userLangs.push("🇪🇸"); await msg.react("🇪🇸") }
  if (user.roles.cache.some(r => r.name.startsWith("Swedish"))) { await userLangs.push("🇸🇪"); await msg.react("🇸🇪") }
  if (user.roles.cache.some(r => r.name.startsWith("Thai"))) { await userLangs.push("🇹🇭"); await msg.react("🇹🇭") }
  if (user.roles.cache.some(r => r.name.startsWith("Turkish"))) { await userLangs.push("🇹🇷"); await msg.react("🇹🇷") }
  if (user.roles.cache.some(r => r.name.startsWith("Ukrainian"))) { await userLangs.push("🇺🇦"); await msg.react("🇺🇦") }
}