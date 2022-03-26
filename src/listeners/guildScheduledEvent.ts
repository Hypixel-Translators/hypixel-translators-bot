import { ids } from "../config.json"
import { client } from "../index"

import type { VoiceChannel } from "discord.js"

client.on("guildScheduledEventUserAdd", async (event, user) => {
	await event.guild!.members.cache.get(user.id)?.roles.add(ids.roles.event, `Showed interest in event ${event.name}`)
})

client.on("guildScheduledEventUpdate", async (oldEvent, newEvent) => {
	if (oldEvent.status !== newEvent.status) {
		const eventChannel = client.channels.cache.get(ids.channels.event) as VoiceChannel
		if (newEvent.status === "COMPLETED") {
			const role = newEvent.guild!.roles.cache.get(ids.roles.event)!
			role.members.forEach(async m => await m.roles.remove(role.id, `${newEvent.name} event is over`))
			await eventChannel.permissionOverwrites.edit(newEvent.guildId, { CONNECT: false })
		} else if (newEvent.status === "ACTIVE") await eventChannel.permissionOverwrites.edit(newEvent.guildId, { CONNECT: null })
	}
})

client.on("guildScheduledEventUserRemove", async (event, user) => {
	await event.guild!.members.cache.get(user.id)?.roles.remove(ids.roles.event, `Removed interest in event ${event.name}`)
})
