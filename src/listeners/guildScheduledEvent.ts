import { GuildScheduledEventStatus, type VoiceChannel } from "discord.js"

import { ids } from "../config.json"
import { client } from "../index"

client.on("guildScheduledEventUserAdd", async (event, user) => {
	await event.guild!.members.cache.get(user.id)?.roles.add(ids.roles.event, `Showed interest in event ${event.name}`)
})

client.on("guildScheduledEventUpdate", async (oldEvent, newEvent) => {
	if (oldEvent?.status !== newEvent.status && newEvent.channelId === ids.channels.event) {
		const eventChannel = client.channels.cache.get(ids.channels.event) as VoiceChannel
		if (newEvent.status === GuildScheduledEventStatus.Completed) {
			const role = newEvent.guild!.roles.cache.get(ids.roles.event)!
			role.members.forEach(async m => await m.roles.remove(role.id, `${newEvent.name} event is over`))
			await eventChannel.permissionOverwrites.edit(newEvent.guildId, { Connect: false })
		} else if (newEvent.status === GuildScheduledEventStatus.Active)
			await eventChannel.permissionOverwrites.edit(newEvent.guildId, { Connect: null })
	}
})

client.on("guildScheduledEventUserRemove", async (event, user) => {
	await event.guild!.members.cache.get(user.id)?.roles.remove(ids.roles.event, `Removed interest in event ${event.name}`)
})
