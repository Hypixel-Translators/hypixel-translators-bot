module.exports = {
    name: "language",
    description: "Saves your language preference.",
    aliases: ["lang"],
    usage: "language [language code]",
    channelWhiteList: ["549894938712866816", "624881429834366986", "730042612647723058"],
    allowDM: true,
    cooldown: 10,
    execute(message, args) {
        client.channels.cache.get("748968125663543407").messages.fetch({ limit: 500 }) //languages database
            .then(messages => {
                fiMessages = messages.filter(msg => msg.content.startsWith(message.author.id))
                if (fiMessages) {
                    fiMessages.forEach(element => {
                        element.delete()
                    });
                }
                client.channels.cache.get("748968125663543407").send(message.author.id + " " + args[0])
            })
    }
}