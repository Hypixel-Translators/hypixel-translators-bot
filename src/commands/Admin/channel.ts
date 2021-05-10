import { successColor, blurple } from "../../config.json"
import Discord from "discord.js"
import { Command } from "../../index"

const command: Command = {
    name: "channel",
    description: "Updates the specified channel.",
    usage: "+channel <rules|info|verify>",
    allowDM: true,
    defaultPermission: false,
    roleWhitelist: ["764442984119795732"], //Discord Administrator
    channelWhitelist: ["624881429834366986", "730042612647723058", "551693960913879071"], // staff-bots bot-development admin-bots
    options: [{
        type: "STRING",
        name: "channel",
        description: "The channel to update",
        required: false,
        choices: [{
            name: "The #rules channel",
            value: "rules",
        },
        {
            name: "The server-info channel",
            value: "info"
        },
        {
            name: "The #verify channel",
            value: "verify"
        },
        {
            name: "Update all channels",
            value: "all"
        }]
    }],
    async execute(interaction: Discord.CommandInteraction) {
        if (interaction.options[0].value === "info") {
            info(interaction)
            const successEmbed = new Discord.MessageEmbed()
                .setColor(successColor)
                .setAuthor("Channel updater")
                .setTitle("Updated the information channel!")
                .setDescription(`Check it out at <#762341271611506708>!`) //server-info
                .setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
            interaction.reply(successEmbed)
        } else if (interaction.options[0].value === "rules") {
            rules(interaction)
            const successEmbed = new Discord.MessageEmbed()
                .setColor(successColor)
                .setAuthor("Channel updater")
                .setTitle("Updated the rules channel!")
                .setDescription(`Check it out at <#796159719617986610>!`) //rules
                .setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
            interaction.reply(successEmbed)
        } else if (interaction.options[0].value === "verify") {
            verify(interaction)
            const successEmbed = new Discord.MessageEmbed()
                .setColor(successColor)
                .setAuthor("Channel updater")
                .setTitle("Updated the verification channel!")
                .setDescription(`Check it out at <#569178590697095168>!`) //verify
                .setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
            interaction.reply(successEmbed)
        } else if (interaction.options[0].value === "all" || !interaction.options[0].value) {
            info(interaction)
            verify(interaction)
            rules(interaction)
            const successEmbed = new Discord.MessageEmbed()
                .setColor(successColor)
                .setAuthor("Channel updater")
                .setTitle("All channels have been updated!")
                .setDescription(`Check them out at <#762341271611506708>, <#796159719617986610> and <#569178590697095168>!`) //server-info, rules and verify
                .setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
            interaction.reply(successEmbed)
        } else throw "noChannel"
    }
}

function info(interaction: Discord.CommandInteraction) {
    const serverInfo = interaction.client.channels.cache.get("762341271611506708") as Discord.TextChannel
    serverInfo.messages.fetch("800415708851732491").then(msg => { //server-info and channels message
        const channelsEmbed = new Discord.MessageEmbed()
            .setColor("#0022ff")
            .setTitle("Channels")
            .setDescription("Each channel has important information pinned in it. We highly recommend checking it out.")
            .addFields(
                { name: "**Important ❕**", value: "<#549503985501995011> - Important messages from the server's admins.\n<#787050912005881876> - The channel where giveaways are hosted.\n<#732587569744838777> - Here, updates to <@620364412649209864> will be posted every now and then.\n<#646096405252800512> - In this channel we will post polls that you will be able to vote on in order to influence certain changes on the server.\n<#618909521741348874> - The feed of our [@HTranslators](https://twitter.com/HTranslators) Twitter page.\n<#758314105328762912> - Updates from our bot's [GitHub repository](https://github.com/Hypixel-Translators/hypixel-translators-bot).\n<#796159719617986610> - All rules are listed here. Follow them, or there'll be consequences.\n<#762341271611506708> - This channel has an overview of the server to help you understand how it works.\n<#699275092026458122> - A full guide on Crowdin available to all translators! Here you'll find basic and advanced tools to help you translate.\n<#549882021934137354> - Displays members who join and leave the server." },
                { name: "**Main Channels 💬**", value: "<#621298919535804426> - You can use this channel to talk about anything you want really.\n<#619662798133133312> - A text channel where you can post your favorite memes.\n<#712046319375482910> - Post pics of your or someone else's cute pets here.\n<#644620638878695424> - A special channel for special people that have boosted our server. Thank you!\n<#550951034332381184> - A text channel where you can suggest things you would like to see on this Discord server.\n<#549894938712866816> -  A channel for you to use bot commands in.\n<#782267779008823326> - A channel for you to use music commands in.\n<#713084081579098152> - A text channel you can use when you can't speak in a voice chat." },
                { name: "**Translation Channels 🔠**", value: "We offer channels for each one of the currently supported projects: **Hypixel**, **SkyblockAddons**, **Quickplay** and our **Bot**.\nEach category has 3 text channels: one for translators, one for proofreaders and one with the project's language status that gets updated every 20 minutes. They also have 2 voice channels: one for translators and one for proofreaders. If you have any questions related to your project, they should be sent here!" },
                { name: "**Language-specific channels 🎏**", value: "We offer channels where translators and proofreaders (of the Hypixel and Quickplay projects) for specific languages can interact with one another! You can speak in English there, but we encourage you to speak the language you're translating. Please keep in mind these channels are not actively moderated. In case you need to report something that occured in these channels, please contact an administrator." })
        msg.edit("", channelsEmbed)
    })
    serverInfo.messages.fetch("800415710508744744").then(msg => { //server-info and roles message
        const botsEmbed = new Discord.MessageEmbed()
            .setColor("#0055ff")
            .setTitle("Bots")
            .setDescription("Information about all bots on this server can be found here. The character inside the [] in their nickname indicates their prefix. Use [prefix]help in <#549894938712866816> to know more about them.")
            .addFields(
                { name: "**Bots**", value: "<@620364412649209864> - Our personalised bot! It is currently maintained by <@240875059953139714> and has a bunch of useful features.\n<@155149108183695360> - This is Dyno. He is used for moderation purposes and nothing else, so don't mind him.\n<@294882584201003009> - This is the bot that runs our giveaways in <#787050912005881876>.\n<@235088799074484224> - Rythm can play some good tunes (or memes, you choose) in a voice channel.\n<@472911936951156740> - VoiceMaster allows you to create custom voice channels by joining the channel `Join to Create` and you can use <#549894938712866816> to customise them." },
                { name: "**Custom informational commands**", value: "**`+guide`** - Gives you the link to the Hypixel project's guidelines. This is the only command that's allowed in all channels.\n**`+invite`** - Gives you the invite link to this server, please use this when you want to invite someone.\n**`+thread`** - Gives you the link to the thread regarding this Discord server.\n**`+twitter`** - Gives you the link to our Twitter page.\n**`+hypixel`** - Gives you some useful information about the Hypixel Crowdin project.\n**`+quickplay`** - Gives you some useful information about the Quickplay Crowdin project.\n**`+sba`** - Gives you some useful information about the SkyblockAddons Crowdin project." }
            )
        msg.edit("", botsEmbed)
    })
    serverInfo.messages.fetch("800415711864029204").then(msg => { //server-info and bots message
        const rolesEmbed = new Discord.MessageEmbed()
            .setColor("#0077ff")
            .setTitle("Roles")
            .setDescription("Every role has a meaning behind it. Find out what they all are below!")
            .addFields(
                { name: "**Discord staff**", value: "<@&549885900151193610> - The Discord Owner, <@241926666400563203>, and Co-Owner, <@240875059953139714>!\n<@&764442984119795732> - The Discord Administrator, <@435546264432803840>!\n<@&621071221462663169> - Our beloved Discord Moderators who keep the chats clean.\n<@&621071248079716355> - Our amazing Discord Helpers, they're basically minimods." },
                { name: "**Official Hypixel staff members**", value: "They do not moderate the Discord but they can be helpful when it comes to asking things regarding translation or the server. (Please refer to rule 5)\n<@&624880339722174464> - Official Hypixel Administrators.\n<@&551758392021090304> - Official Hypixel Moderators.\n<@&551758392339857418> - Official Hypixel Helpers." },
                { name: "**Translators**", value: "Each of the following roles applies to all 4 projects we support: **Hypixel**, **SkyblockAddons**, **Quickplay** and our **Bot**.\n**Managers** - The managers of each project are the ones responsible for new strings, proofreader promotions, amongst other things. Please avoid tagging people with these roles (refer to rule 5).\n**Proofreaders** - The proofreaders of each language are the ones responsible for reviewing and approving strings. If you notice any mistakes, these are the people you should message.\n**Translators** - A translator's job is to suggest and vote on translations, which helps the proofreaders' job a lot." },
                { name: "**Miscellaneous**", value: "<@&549894155174674432> - A role given to all bots in the Discord.\n<@&732586582787358781> - A role given to the current developer(s) of our bot.\n<@&618502156638617640> - A role given to people who have helped create art for this server.\n<@&766339653615484930> - A role given to the person who won the Trick'cord Treat contest in October 2020, <@435546264432803840>\n<@&719263346909773864> - A role given to all of the people who've hosted giveaways in <#787050912005881876>!\n<@&557090185670557716> - A role given to all users that joined in the first 6 months of this server (August 28, 2019)." },
                { name: "**Reaction Roles**", value: `You can react to this message to receive the roles below, here's what they do:\n<@&646098170794868757> - React with 📊 to be notified whenever a new poll is posted on <#646096405252800512>\n<@&732615152246980628> - React with 🤖 to be notified whenever a new major update to <@${interaction.client.user!.id}> is posted on <#732587569744838777>\n<@&801052623745974272> - React with 🎉 to be notified of future giveaways in <#787050912005881876>!` }
            )
            .setFooter("Need help? Ask your questions in #off-topic | Bot made with lots of care by QkeleQ10#6163")
        msg.edit("", rolesEmbed)
    })
}

function rules(interaction: Discord.CommandInteraction) {
    const rules = interaction.client.channels.cache.get("796159719617986610") as Discord.TextChannel
    rules.messages.fetch("800412977220026398").then(msg => {
        const rulesEmbed = new Discord.MessageEmbed()
            .setColor(blurple)
            .setTitle("Server Rules")
            .setDescription("Welcome  to the rules channel! In this channel, you will find every rule on this discord server. Please do not break any of the rules listed below or there will be consequences.")
            .addFields(
                { name: "1 - Do not say anything that might be offensive to someone else.", value: "This includes racial slurs and sexist terms, etc." },
                { name: "2 - Do not impersonate anyone.", value: "This is currently mentioned specifically when you first join the discord but it also applies to other situations after you've been verified so please refrain from doing it." },
                { name: "3 - Do not encourage self-harm or even threaten to kill anybody.", value: "These offenses will result in a permanent ban from the discord and a report to Discord's ToS team." },
                { name: "4 - Nicks", value: "Your nickname must not contain zalgo or a prefix for a language you do not translate (e.g. `[PT]` or `[🇵🇹]`). It should also obey the remaining rules." },
                { name: "5 - Do not excessively tag Discord and Hypixel Staff members/project managers.", value: "You are allowed to tag staff but please keep it to a minimum and only do so if you need an important question answered. Otherwise, please refrain from doing it. Please do not tag project managers unless they allow you to." },
                { name: "6 - Always try to speak in English.", value: "If you make a reference in another language on a public channel, please explain to the people who don't speak that language what it means." },
                { name: "7 - Follow all Hypixel rules.", value: "If you are not familiar with those, check them out [here](https://hypixel.net/rules)." },
                { name: "8- Follow Discord's ToS and Community Guidelines", value: "This includes not using modified Discord clients, self bots and more. Click [here](https://discord.com/terms) to read the ToS, or [here](https://discord.com/guidelines) to read the Community Guidelines" },
                { name: "And most importantly have fun!", value: "If you see something against the rules or something that makes you feel unsafe, please let staff know. We want this server to be a welcoming space for everyone!" }
            )
            .setFooter("Have any questions? Ask any staff member, they're here to help!")
        msg.edit("", rulesEmbed)
    })
}

function verify(interaction: Discord.CommandInteraction) {
    const verify = interaction.client.channels.cache.get("569178590697095168") as Discord.TextChannel
    verify.messages.fetch("787366444970541056").then(msg => { //verify-prototype and verify embed
        const verifyEmbed = new Discord.MessageEmbed()
            .setColor(blurple)
            .setAuthor("Welcome!")
            .setThumbnail(interaction.guild!.iconURL()!)
            .setTitle("The Hypixel Translators Community")
            .setDescription("Hello there and welcome to the __**Unofficial**__ Hypixel Translators Server! In order to verify yourself to have access to other channels, please follow the instructions below. While you wait we also suggest you check out <#796159719617986610> to be more familiar with the server rules once you've joined.")
            .addFields(
                { name: "Translator/Proofreader", value: "If you are a translator or proofreader for either the **Hypixel**, **Quickplay** or **SkyblockAddons** projects, please send us the link to your Crowdin profile (e.g. <https://crowdin.com/profile/ImRodry> **and not** <https://crowdin.com/profile>) in **this channel** so that you can be automatically verified. Keep in mind that in order to be verified, your profile must be **public** and you must include your Discord username and discriminator in your \"About\" section (eg: Rodry#4020). If you don't receive your roles within 1 minute, please contact <@!240875059953139714>." },
                { name: "Not a translator", value: "If you're not a translator for either one of the projects mentioned above and just want to join the server for fun, please run `+verify` in order to receive your roles. If this doesn't work, please mention <@240875059953139714> on this channel saying so." },
                { name: "Need help?", value: "Feel free to send a message on this channel, or DM either <@240875059953139714>, <@241926666400563203> or <@435546264432803840> with any questions you might have!" }
            )
            .setFooter("Have fun on our server!")
        msg.edit("**Please do not run the command before reading the entire interaction.**", verifyEmbed) //verify-prototype
    })
}

export default command
