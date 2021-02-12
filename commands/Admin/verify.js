module.exports = {
    name: "verify",
    description: "Verifies the user who executes the command",
    usage: "+verify [profile]",
    cooldown: 5,
    roleBlacklist: ["569194996964786178"], //Verified
    channelWhitelist: ["569178590697095168", "730042612647723058",], // verify bot-development
    async execute(message, args) {
        await message.delete()
        if (!args[0]) {
            message.channel.messages.fetch()
            .then(messages => {
                const fiMessages = messages.filter(msgs => msgs.author === message.author)
                message.channel.bulkDelete(fiMessages)
            })
            message.member.roles.add("569194996964786178", "Manually verified through the command").then(() => message.member.roles.remove("756199836470214848", "Manually verified through the command")) //Add Verified and remove Alerted
            message.guild.channels.cache.get("662660931838410754").send(`${message.author} manually verified themselves through the command`) //verify-logs
        } else {
            message.channel.send(`${message.author} please run \`+verify\` with no aditional arguments in order to be verified. If you wish to be verified as a translator, please paste the link to your Crowdin profile on this channel.`)
            .then(msg => {
                setTimeout(() => {
                    if (!msg.deleted) msg.delete()
                }, 10000)
            })
        }
    }
}
