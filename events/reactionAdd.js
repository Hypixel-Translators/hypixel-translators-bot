const fs = require("fs");
const Discord = require("discord.js");
const { prefix, token, workingColor, errorColor, successColor, neutralColor } = require("./config.json");

const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });


client.on('messageReactionAdd', async (reaction, user) => {
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.log('Something went wrong when fetching the message: ', error);
            return;
        }
    }

    if (reaction.message.id === "733036798736990309") {
        const role = reaction.message.guild.roles.cache.get("732615152246980628") //Bot Updates
        user.roles.add(role)
            .then(() => {
                const receivedEmbed = message.embeds[0];
                const embed = new Discord.MessageEmbed(receivedEmbed)
                    .setFooter('Given ' + user.username + " the Bot Updates role!")
                    .setColor(successColor)
                reaction.message.edit(embed)
                setInterval(() => {
                    embed
                        .setFooter("If this text doesn't change to a confirming message after you've reacted, please contact QkeleQ10#6046.")
                        .setColor(neutralColor)
                    reaction.message.edit(embed)
                }, 5000)
            })
            .catch(err => {
                const receivedEmbed = message.embeds[0];
                const embed = new Discord.MessageEmbed(receivedEmbed)
                    .setFooter("Something went wrong, please contact QkeleQ10#6046")
                    .setColor(errorColor)
                reaction.message.edit(embed)
                setInterval(() => {
                    embed
                        .setFooter("If this text doesn't change to a confirming message after you've reacted, please contact QkeleQ10#6046.")
                        .setColor(neutralColor)
                    reaction.message.edit(embed)
                }, 5000)
            })
    }
});

client.on('messageReactionRemove', async (reaction, user) => {
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.log('Something went wrong when fetching the message: ', error);
            return;
        }
    }

    if (reaction.message.id === "733036798736990309") {
        const role = reaction.message.guild.roles.cache.get("732615152246980628") //Bot Updates
        user.roles.remove(role)
            .then(() => {
                const receivedEmbed = message.embeds[0];
                const embed = new Discord.MessageEmbed(receivedEmbed)
                    .setFooter('Removed ' + user.username + "'s Bot Updates role!")
                    .setColor(successColor)
                reaction.message.edit(embed)
                setInterval(() => {
                    embed
                        .setFooter("If this text doesn't change to a confirming message after you've reacted, please contact QkeleQ10#6046.")
                        .setColor(neutralColor)
                    reaction.message.edit(embed)
                }, 5000)
            })
            .catch(err => {
                const receivedEmbed = message.embeds[0];
                const embed = new Discord.MessageEmbed(receivedEmbed)
                    .setFooter("Something went wrong, please contact QkeleQ10#6046")
                    .setColor(errorColor)
                reaction.message.edit(embed)
                setInterval(() => {
                    embed
                        .setFooter("If this text doesn't change to a confirming message after you've reacted, please contact QkeleQ10#6046.")
                        .setColor(neutralColor)
                    reaction.message.edit(embed)
                }, 5000)
            })
    }
});