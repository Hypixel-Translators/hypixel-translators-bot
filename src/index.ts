//Setup dotenv and define client
require("dotenv").config()
import { HTBClient } from "./lib/dbclient"
export const client = new HTBClient()

//Import commands and events
import { setup } from "./lib/imports"
setup(client)

//Log in
client.login(process.env.DISCORD_TOKEN)
