const { loadingColor, errorColor, successColor, neutralColor, blurple } = require("../config.json");
const Discord = require("discord.js");

module.exports = {
    name: "update",
    description: "Updates the specified channel.",
    usage: "+update <info|verify>",
    execute(message, strings, args) {
        const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
        if (!message.member.roles.cache.has("620274909700161556")) return; //*

        if (args[0] === "info") {
            info(message)
            const successEmbed = new Discord.MessageEmbed()
                .setColor(successColor)
                .setAuthor(strings.moduleName)
                .setTitle(strings.success.replace("%%channel%%", strings.infoChannel))
                .setFooter(executedBy, message.author.displayAvatarURL())
            message.channel.send(successEmbed)
        } else if (args[0] === "verify") {
            verify(message)
            const successEmbed = new Discord.MessageEmbed()
                .setColor(successColor)
                .setAuthor(strings.moduleName)
                .setTitle(strings.success.replace("%%channel%%", strings.verifyChannel))
                .setFooter(executedBy, message.author.displayAvatarURL())
            message.channel.send(successEmbed)
        } else if (args[0] === "all" || !args[0]) {
            info(message)
            verify(message)
            const successEmbed = new Discord.MessageEmbed()
                .setColor(successColor)
                .setAuthor(strings.moduleName)
                .setTitle(strings.successAll)
                .setFooter(executedBy, message.author.displayAvatarURL())
            message.channel.send(successEmbed)
        } else throw "noChannel"
    }
}

function info(message) {
    message.client.channels.cache.get("762341271611506708").messages.fetch("783125631487574026").then(message => { //server-info and channels message
        const channelsEmbed = new Discord.MessageEmbed()
            .setColor("#0022ff")
            .setTitle("Channels")
            .setDescription("Each channel has important information pinned in it. We highly recommend checking it out.")
            .addFields(
                { name: "**Important ❕**", value: "<#549503985501995011> - Important messages about the Discord server and the Crowdin projects.\n<#732587569744838777> - Here bot updates will be posted every now and then.\n<#646096405252800512> - In this channel we will post polls that you will be able to vote on in order influence certain changes on the server.\n<#618909521741348874> - The feed of our [@HTranslators](https://twitter.com/HTranslators) Twitter page.\n<#758314105328762912> - Updates from our bot's [GitHub repository](https://github.com/Hypixel-Translators/hypixel-translators-bot).\n<#699367003135148063> - All rules are listed here. Follow them, or there'll be consequences.\n<#699367079241056347> - This channel has an overview of this server to help you understand how it works.\n<#699275092026458122> - A full guide to help you translate with Crowdin! Here you'll find basic and advanced tools to help you translate.\n<#549882021934137354> - Displays members who join and leave the server.".substring(0, 1024) },
                { name: "**Main Channels 💬**", value: "<#621298919535804426> - You can use this channel to talk about anything you want really.\n<#619662798133133312> - A text channel where you can post your favorite memes.\n<#712046319375482910> - Post pics of your or someone else's cute pets here.\n<#644620638878695424> - A special channel for special people that have boosted our server. Thank you!\n<#550951034332381184> - A text channel where you can suggest things you would like to see on this Discord server.\n<#549894938712866816> -  A channel for you to use bot commands in.\n<#713084081579098152> - A text channel you can use when you can't speak in a voice chat.".substring(0, 1024) },
                { name: "**Translation Channels 🔠**", value: "We offer channels for each one of the 4 currently supported projects: **Hypixel**, **SkyblockAddons**, **Quickplay** and our **Bot**.\nEach category has 3 text channels: one for translators, one for proofreaders and one with the project's language status that gets updated every 20 minutes. They also have 2 voice channels: one for translators and one for proofreaders. If you have any questions related to your project, they should be sent here!".substring(0, 1024) },
                { name: "**Language-specific channels 🎏**", value: "We offer channels where translators and proofreaders (of the Hypixel and Quickplay projects) for specific languages can interact with one another! You can speak English here, but we encourage you to speak the language you're translating. Please keep in mind these channels are not actively moderated. In case anything happens, please get in touch with an administrator." })
        message.edit("", channelsEmbed)
    })
    message.client.channels.cache.get("762341271611506708").messages.fetch("783125631823118357").then(message => { //server-info and roles message
        const rolesEmbed = new Discord.MessageEmbed()
            .setColor("#0055ff")
            .setTitle("Roles")
            .setDescription("Every role has a meaning behind it. Find out what they all are below!")
            .addFields(
                {
                    name: "**Discord staff**", value: "<@&549885900151193610> - The Discord Owner, <@241926666400563203>!\n<@&549885657749913621> - The Discord Administrator, <@240875059953139714>!\n<@&621071221462663169> - Our beloved Discord Moderators who keep the chats clean.\n<@&621071248079716355> - Our amazing Discord Helpers, they're basically minimods."
                },
                {
                    name: "**Official Hypixel staff members**", value: "They do not moderate the Discord but they can be helpful when it comes to asking things regarding translation or the server. (Please refer to rule 5)\n<@&624880339722174464> - Official Hypixel Administrators.\n<@&551758392021090304> - Official Hypixel Moderators.\n<@&551758392339857418> - Official Hypixel Helpers."
                },
                {
                    name: "**Translators**", value: "Each of the following roles applies to all 4 projects we support: **Hypixel**, **SkyblockAddons**, **Quickplay** and our **Bot**.\n**Managers** - The managers of each project are the ones responsible for new strings, proofreader promotions, amongst other things. Please avoid tagging people with these roles (refer to rule 5).\n**Proofreaders** - The proofreaders of each language are the ones responsible for reviewing and approving strings. If you notice any mistakes, these are the people you should message.\n**Translators** - A translator's job is to suggest and vote on translations, which helps the proofreaders' job a lot.".substring(0, 1024)
                },
                {
                    name: "**Miscellaneous**", value: "<@&549894155174674432> - A role given to all bots in the Discord.\n<@&732586582787358781> - A role given to the current developer(s) of our bot.\n<@&618502156638617640> - A role given to people who have helped create art for this server.\n<@&766339653615484930> - A role given to the person who won the Trick'cord Treat contest in October 2020, <@435546264432803840>\n<@&719263346909773864> - A role given to <@291635552678313985> who gave away 3 MVP+ ranks during an event!\n<@&557090185670557716> - A role given to all users that joined in the first 6 months of this server (August 28, 2019)."
                }
            )
        message.edit("", rolesEmbed)
    })
    message.client.channels.cache.get("762341271611506708").messages.fetch("783125633101987930").then(message => { //server-info and bots message
        const botsEmbed = new Discord.MessageEmbed()
            .setColor("#0077ff")
            .setTitle("Bots")
            .setDescription("Information about all bots on this server can be found here. The character inside the [] in their nickname indicates their prefix. Use [prefix]help in <#549894938712866816> to know more about them.")
            .addFields(
                {
                    name: "**Bots**", value: "<@725703559693205665> - Our personalised bot! It was developed by <@722738307477536778> and has a bunch of useful features.\n<@155149108183695360> - This is Dyno. He is used for moderation purposes and nothing else, so don't mind him.\n<@159985870458322944> - MEE6 is used for leveling. You can gain XP by talking in chats.\n<@235088799074484224> - Rythm can play some good tunes (or memes, you choose) in a voice channel.\n<@472911936951156740> - VoiceMaster allows you to create custom voice channels by joining the channel `Join to Create` and you can use <#549894938712866816> to customise them."
                },
                {
                    name: "**Custom informational commands**", value: "**`+guide`** - Gives you the link to the Hypixel project's guidelines. This is the only command that's allowed in all channels.\n**`+invite`** - Gives you the invite link to this server, please use this when you want to invite someone.\n**`+thread`** - Gives you the link to the thread regarding this Discord server.\n**`+twitter`** - Gives you the link to our Twitter page.\n**`+hypixel`** - Gives you some useful information about the Hypixel Crowdin project.\n**`+quickplay`** - Gives you some useful information about the Quickplay Crowdin project.\n**`+sba`** - Gives you some useful information about the SkyblockAddons Crowdin project."
                }
            )
            .setFooter("Need help? Ask your questions in #off-topic | Bot made with lots of care by QkeleQ10#6163")
        message.edit("", botsEmbed) //server-info
    })
}

function verify(message) {
    message.client.channels.cache.get("569178590697095168").messages.fetch("787366444970541056").then(msg => { //verify-prototype and verify embed
        const verifyEmbed = new Discord.MessageEmbed()
            .setColor(blurple)
            .setAuthor("Welcome!")
            .setThumbnail(message.guild.iconURL())
            .setTitle("The Hypixel Translators Community")
            .setDescription("Hello there and welcome to the __**Unofficial**__ Hypixel Translators Server! In order to verify yourself to have access to other channels, please follow the instructions below. While you wait we also suggest you check out <#699367003135148063> to be more familiar with the server rules once you've joined.")
            .addFields(
                { name: "Translator/Proofreader", value: "If you are a translator or proofreader for either the **Hypixel**, **Quickplay** or **SkyblockAddons** projects, please send us the link to your Crowdin profile (e.g. <https://crowdin.com/profile/ImRodry> **and not** <https://crowdin.com/profile>) in **this channel** so that we can give you the appropriate roles. Keep in mind that in order to be verified, your profile must be **public** and you must include your Discord username and discriminator in your \"About\" section (eg: Rodry#4020). If anyone is caught sending someone else's profile, there will be punishments!"},
                { name: "Not a translator", value: "If you're not a translator for either one of the projects mentioned above and just want to join the server for fun, please run `+verify` in order to receive your roles. If this doesn't work, please mention <@240875059953139714> on this channel saying so."},
                { name: "Need help?", value: "Feel free to send a message on this channel, or DM either <@240875059953139714> or <@241926666400563203> with any questions you might have!"}
            )
            .setFooter("Have fun on our server!")
        msg.edit("**Please do not react before reading the entire message.**", verifyEmbed) //verify-prototype
    })
}