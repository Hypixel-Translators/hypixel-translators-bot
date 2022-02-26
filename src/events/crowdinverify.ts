import { ids } from "../config.json"
import { client } from "../index"
import { crowdinVerify } from "../lib/crowdinverify"
import { db, type DbUser } from "../lib/dbclient"

export default async function updateVerified(limit = 0) {
	const verifiedUsers = await db
		.collection<DbUser>("users")
		.find({ profile: { $type: "string" } })
		.limit(limit)
		.toArray()

	async function verifyUser(n: number) {
		const user = verifiedUsers[n],
			member = client.guilds.cache.get(ids.guilds.main)!.members.cache.get(user.id)
		if (!member) console.error(`Could not find guild member with ID ${user.id}`)
		else if (user.profile) await crowdinVerify(member, user.profile, false, false)
		if (n + 1 < verifiedUsers.length) await verifyUser(n + 1)
	}
	await verifyUser(0)
}
