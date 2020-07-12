const { Schema, model } = require('mongoose')

const Context = Schema({
    id: String,
    photo: { default: "https://lh3.googleusercontent.com/pFSdCfKsllI1iNTSEEGZL99fBk7xYQYWBAwC_bu7h8RxVrwWtIF4UGTshL2OjlFcztu0czIAOCA=w640-h400-e365", type: String },
    context: String,
    chinesesimplified: String,
    chinesetraditional: String,
    czech: String,
    danish: String,
    dutch: String,
    finnish: String,
    french: String,
    german: String,
    greek: String,
    italian: String,
    japanese: String,
    korean: String,
    norwegian: String,
    pirate: String,
    polish: String,
    portuguese: String,
    brazilian: String,
    russian: String,
    spanish: String,
    swedish: String,
    thai: String,
    turkish: String,
    ukrainian: String
})

module.exports = model('Context', Context)