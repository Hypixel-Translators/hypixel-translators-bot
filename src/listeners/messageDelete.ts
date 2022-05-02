import { ids } from "../config.json"
import { client } from "../index"

client.on("messageDelete", message => {
	if (message.channelId === ids.channels.suggestions) message.thread?.delete()
})
