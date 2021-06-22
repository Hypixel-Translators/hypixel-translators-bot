import { client } from "../index"
import { mongoClient } from "../lib/dbclient"

//Code sent on dev env
process.on("SIGINT", async () => {
    client.destroy()
    await mongoClient.close()
    process.exit()
})

//Code sent on production env
process.on("SIGTERM", async () => {
    client.destroy()
    await mongoClient.close()
    process.exit()
})
