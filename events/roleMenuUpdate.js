const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
    execute(client) {
        const m1 = client.channels.cache.get("730042612647723058").messages.fetch("762321578158456853")
        const m2 = client.channels.cache.get("730042612647723058").messages.fetch("762321583317843988")
        const m3 = client.channels.cache.get("730042612647723058").messages.fetch("762321588942274560")
        const embed1 = new Discord.MessageEmbed()
            .setColor(neutralColor)
            .setTitle("Channels")
            .setDescription("Some information will go here.")
            .addFields({ name: "Some header", value: "Some text" })
            .setFooter("Need help? Ask your questions in #off-topic | Bot made with lots of care by QkeleQ10#6163")
        m1.edit(embed1)
        const embed2 = new Discord.MessageEmbed()
            .setColor(neutralColor)
            .setTitle("Roles")
            .setDescription("Some information will go here.")
            .addFields({ name: "Some header", value: "Some text" })
            .setFooter("Need help? Ask your questions in #off-topic | Bot made with lots of care by QkeleQ10#6163")
        m2.edit(embed2)
        const embed3 = new Discord.MessageEmbed()
            .setColor(neutralColor)
            .setTitle("Bots")
            .setDescription("Some information will go here.")
            .addFields({ name: "Some header", value: "Some text" })
            .setFooter("Need help? Ask your questions in #off-topic | Bot made with lots of care by QkeleQ10#6163")
        m3.edit(embed3)
    }
}