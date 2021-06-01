import { crowdinVerify } from "../lib/crowdinverify";
import { db, DbUser, HTBClient } from "../lib/dbclient";

export default async function updateVerified(client: HTBClient, manual: boolean) {
    const d = new Date()
    const h = d.getUTCHours()
    const m = d.getUTCMinutes()
    if ((h == 3 && m == 0) || manual) {
        const verifiedUsers: DbUser[] = await db.collection("users").find({ profile: { $exists: true } }).toArray()

        async function verifyUser(n: number) {
            const user = verifiedUsers[n]
            const member = client.guilds.cache.get("549503328472530974")!.members.cache.get(user.id)
            if (!member) return console.error(`Could not find guild member with ID ${user.id}`)
            await crowdinVerify(member, user.profile, false, false)
            if (n + 1 < verifiedUsers.length) await verifyUser(n + 1)
        }
        await verifyUser(0)
    }
}