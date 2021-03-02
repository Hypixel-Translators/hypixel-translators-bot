//Import dependencies and define client
import { HTBClient } from "./lib/dbclient"
export const client = new HTBClient()
require("dotenv").config()

//Import commands and events
import { setup } from "./lib/imports"
setup(client)

//Log in
client.login(process.env.DISCORD_TOKEN)
