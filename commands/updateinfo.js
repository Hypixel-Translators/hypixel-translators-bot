const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
    name: "updateinfo",
    description: "Updates the #server-info channel.",
    usage: "+updateinfo",
    execute(strings, message) {
        if (!message.member.roles.cache.has("752541221980733571")) return;
        const embed1 = new Discord.MessageEmbed()
            .setColor(neutralColor)
            .setTitle("Channels")
            .setDescription("Each channel has important information pinned in it. We highly recommend checking it out.")
            .addFields(
                { name: "Important ❕", value: "<#549503985501995011> - Important messages about the Discord server, the Crowdin projects and, occasionally, Hypixel news will be posted here.\n<#732587569744838777> - Here bot updates will be posted every now and then.\n<#646096405252800512> - In this channel we will post polls that you will be able to vote on in order influence certain changes on the server.\n<#618909521741348874> - The feed of [our @HTranslators Twitter page](https://twitter.com/HTranslators).\n<#758314105328762912> - Updates from [our bot's GitHub repository](http://bit.ly/htbrepo).\n<#699367003135148063> - All rules are listed here. Follow them, or there'll be consequences.\n<#699367079241056347> - This channel contains information about this server, so you can understand how it works better.\n<#699275092026458122> - A full guide to help you get start translating with Crowdin! Here you'll find all info and some basic tools to help you translate.\n<#549882021934137354> - Displays members who join and leave the server.".substring(0, 1024) },
                { name: "Main Channels 💬", value: "<#621298919535804426> - You can use this channel to talk about anything you want really.\n<#619662798133133312> - A text channel where you can post your favorite memes.\n<#712046319375482910> - Post pics of your or someone else's cute pets here.\n<#644620638878695424> - A special channel for special people that have boosted our server. Thank you!\n<#550951034332381184> - A text channel where you can suggest things you would like to see in the Discord server. If you would like to suggest things for Hypixel, please visit the forums.\n<#549894938712866816> -  A channel for you to use bot commands in.\n<#713084081579098152> - If you can't speak while you're in a voice chat, talk here.\n\n_Make sure to follow channel-specific rules!_".substring(0, 1024) },
                { name: "Language-specific channels", value: "We offer channels where translators and proofreaders for specific languages can interact with one another! You can speak English here, but we encourage you to speak the language you're translating. As we cannot moderate these channels, please let us know if any problems occur." })
        message.client.channels.cache.get("762341271611506708").send("", embed1)
        const embed2 = new Discord.MessageEmbed()
            .setColor(neutralColor)
            .setTitle("Roles")
            .setDescription("Some information will go here.")
            .addFields({ name: "Some header", value: "Some text" })
        message.client.channels.cache.get("762341271611506708").send("", embed2)
        const embed3 = new Discord.MessageEmbed()
            .setColor(neutralColor)
            .setTitle("Bots")
            .setDescription("Some information will go here.")
            .addFields({ name: "Some header", value: "Some text" })
            .setFooter("Need help? Ask your questions in #off-topic | Bot made with lots of care by QkeleQ10#6163")
        message.client.channels.cache.get("762341271611506708").send("", embed3)
    }
}