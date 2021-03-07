//Setup dotenv and define client
import "dotenv/config"
import 'source-map-support/register'
import { HTBClient } from "./lib/dbclient"
export const client = new HTBClient()

//Import commands and events
import { setup } from "./lib/imports"
setup(client)

//Log in
client.login(process.env.DISCORD_TOKEN)
