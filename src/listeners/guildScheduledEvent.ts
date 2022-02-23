import { GuildScheduledEventStatus } from "discord.js"

import { ids } from "../config.json"
import { client } from "../index"

client.on("guildScheduledEventUserAdd", async (event, user) => {
	await event.guild!.members.cache.get(user.id)?.roles.add(ids.roles.event, `Showed interest in event ${event.name}`)
})

client.on("guildScheduledEventUpdate", (oldEvent, newEvent) => {
	if (oldEvent.status !== newEvent.status && newEvent.status === GuildScheduledEventStatus.Completed) {
		const role = newEvent.guild!.roles.cache.get(ids.roles.event)!
		role.members.forEach(async m => await m.roles.remove(role.id, `Event ${newEvent.name} is over`))
	}
})

client.on("guildScheduledEventUserRemove", async (event, user) => {
	await event.guild!.members.cache.get(user.id)?.roles.remove(ids.roles.event, `Removed interest in event ${event.name}`)
})
