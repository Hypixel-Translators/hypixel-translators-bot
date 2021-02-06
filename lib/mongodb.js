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

function init() {
    client.connect(err => {
        if (err) return console.error(err)
        console.log("Connected to MongoDB!")
        db = client.db(process.env.db_name)
    })
}
function getDb() {
    if (db && client?.topology?.isConnected?.()) return db
    else {
        client.close()
        return client.connect().then(() => db = client.db(process.env.db_name))
    }
}
function getUser(id) {
    let user = getDb().collection("users").findOne({id: id})
    if (!user) {
        getDb().collection("users").insertOne({id: id, lang: "en", profile: "", uuid: ""})
        user = getDb().collection("users").findOne({id: id})
    }
    return user
}
