const { MongoClient } = require('mongodb')
const url = process.env.mongo_URL
const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true })
var db = null

module.exports.mClient = client

module.exports = {
    init() {
        client.connect(err => {
            if (err) return console.error(err)
            console.log("Connected to MongoDB!")
            return db = client.db(process.env.db_name)
        })
    },
    getDb() {
        if (db && client?.topology?.isConnected?.()) return db
        else {
            client.close()
            return client.connect().then(() => db = client.db(process.env.db_name))
        }
    }
}
