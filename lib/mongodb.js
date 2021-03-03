const { MongoClient } = require('mongodb')
const url = process.env.mongo_URL
const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true })
var db = null

module.exports = {
    mClient: client,
    init,
    getDb,
    getUser
}

async function init() {
    try {
        await client.connect()
        console.log("Connected to MongoDB!")
        db = client.db(process.env.db_name)
    } catch { return process.exit(1) }
    return db
}
function getDb() {
    if (db && client?.isConnected?.()) return db
    else init()
}
async function getUser(id) {
    let user = await getDb().collection("users").findOne({ id: id })
    if (!user) {
        await getDb().collection("users").insertOne({ id: id, lang: "en" })
        user = await getDb().collection("users").findOne({ id: id })
    }
    return user
}
