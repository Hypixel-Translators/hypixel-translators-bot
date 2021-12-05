import { client } from "../index"
import { ids } from "../config.json"

client.on("guildScheduledEventUserAdd", async (event, user) => {
    const member = event.guild!.members.cache.get(user.id)
    await member?.roles.add(ids.roles.event, `Showed interest in event ${event.name}`)
})

client.on("guildScheduledEventUpdate", (oldEvent, newEvent) => {
    if (oldEvent.status !== newEvent.status && newEvent.status === "COMPLETED") {
        const role = newEvent.guild!.roles.cache.get(ids.roles.event)!
        role.members.forEach(async m => await m.roles.remove(role.id, `Event ${newEvent.name} is over`))
    }
})

client.on("guildScheduledEventUserRemove", async (event, user) => {
    const member = event.guild!.members.cache.get(user.id)
    await member?.roles.remove(ids.roles.event, `Removed interest in event ${event.name}`)
})
