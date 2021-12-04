import { client } from "../index"
import { ids } from "../config.json"

client.on("guildScheduledEventDelete", event => {
    const role = event.guild!.roles.cache.get(ids.roles.event)!
    role.members.forEach(async m => await m.roles.remove(role.id, `Event ${event.name} is over`))
})

client.on("guildScheduledEventUserAdd", async (event, user) => {
    const member = event.guild!.members.cache.get(user.id)
    await member?.roles.add(ids.roles.event, `Showed interest in event ${event.name}`)
})

client.on("guildScheduledEventUserRemove", async (event, user) => {
    const member = event.guild!.members.cache.get(user.id)
    await member?.roles.remove(ids.roles.event, `Removed interest in event ${event.name}`)
})
