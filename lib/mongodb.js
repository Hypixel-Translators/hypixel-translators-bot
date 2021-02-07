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
    } catch (err) { return console.error(err) }
    return db
}
function getDb() {
    if (db && client?.isConnected?.()) return db
    else init()
}
function getUser(id) {
    let user = getDb().collection("users").findOne({ id: id })
    if (!user) {
        getDb().collection("users").insertOne({ id: id, lang: "en", profile: "", uuid: "" })
        user = getDb().collection("users").findOne({ id: id })
    }
    return user
}
