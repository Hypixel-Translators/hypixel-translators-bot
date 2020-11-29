const Discord = require("discord.js")

module.exports = {
  name: "eval",
  description: "Evals the specified code.",
  usage: "+eval <code>",
  aliases: ["evaluate"],
  cooldown: 60,
  channelWhiteList: ["624881429834366986", "730042612647723058", "551693960913879071"], // staff-bots bot-development admin-bots
  execute(strings, message) {
    if (!message.member.hasPermission("ADMINISTRATOR")) return

    const me = message.member
    const guild = message.guild
    const client = message.client

    let evaled
    try {
      evaled = await eval(args.join(' '))
      message.channel.send(inspect(evaled))
      console.log(inspect(evaled))
    } catch (error) {
      console.error(error)
      message.channel.send('Something went wrong. Details can be found in the console.')
    }
  }
}