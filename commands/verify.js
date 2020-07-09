const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");
const mongoose = require('mongoose');

module.exports = {
    name: "verify",
    description: "Verifies the user on the Hypixel project.",
    usage: "verify <mention> <language> <pf|tr> <profile>",
    cooldown: 3,
    execute(message, args) {
        if (message.member.hasPermission("ADMINISTRATOR")) {
            var userToSend = args[0].replace(/[\\<>@#&!]/g, "");
            var type = args[2]
            const lowerArg = args[1].toLowerCase()
            var toLook = lowerArg.charAt(0).toUpperCase() + lowerArg.slice(1)
            if (toLook === "Chinesesimplified" || toLook === "Chinese-simplified") {
                toLook = "Chinese (Simplified)"
            }
            if (toLook === "Chinesetraditional" || toLook === "Chinese-traditional") {
                toLook = "Chinese (Traditional)"
            }
            if (type === "pf" || type === "pr" || type === "proofreader" || type === "Proofreader") {
                type = " Proofreader"
            }
            if (type === "tr" || type === "translator" || type === "Translator") {
                type = " Translator"
            }
            const role = message.guild.roles.cache.find(x => x.name == (toLook + type))
            const projectRole = message.guild.roles.cache.find(x => x.name == ("Hypixel" + type))
            console.log(toLook)
            console.log(type)
            console.log(role)
            console.log(projectRole)
            if (!role) {
                message.channel.send("The role you entered doesn't exist. Make sure not to use abbreviations. For Chinese (Simplified/Traditional), use \`Chinese-simplified/traditional\`.");
                return;
            }
            if (!projectRole) {
                message.channel.send("The role you entered doesn't exist. Make sure not to use abbreviations. For Chinese (Simplified/Traditional), use \`Chinese-simplified/traditional\`.");
                return;
            }

            //message.delete();
            const embed = new Discord.MessageEmbed()
                .setColor(workingColor)
                .setTitle("Verify")
                .setDescription("One second... ")
                .addFields(
                    { name: "Role", value: role },
                    { name: "User", value: "<@" + userToSend + ">" }
                )
                .setFooter("Executed by " + message.author.tag);
            message.channel.send(embed)
                .then(msg => {
                    const recipient = msg.client.users.cache.get(userToSend)
                    recipient.addRole(role)
                    recipient.addRole(projectRole)
                    recipient.addRole("569194996964786178")
                    const embed = new Discord.MessageEmbed()
                        .setColor(successColor)
                        .setTitle("Verify")
                        .setDescription("The mentioned user was verified! This is their Crowdin profile:\n> " + args[3])
                        .addFields(
                            { name: "Role", value: role },
                            { name: "User", value: "<@" + userToSend + ">" }
                        )
                        .setFooter("Executed by " + message.author.tag);
                })
        }
    }
};