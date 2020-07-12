const { Schema, model } = require('mongoose')

const Context = Schema({
    id: String,
    photo: { default: "https://lh3.googleusercontent.com/pFSdCfKsllI1iNTSEEGZL99fBk7xYQYWBAwC_bu7h8RxVrwWtIF4UGTshL2OjlFcztu0czIAOCA=w640-h400-e365", type: String },
    context: { default: "", type: String },
    chinesesimplified: { default: "", type: String },
    chinesetraditional: { default: "", type: String },
    czech: { default: "", type: String },
    danish: { default: "", type: String },
    dutch: { default: "", type: String },
    finnish: { default: "", type: String },
    french: { default: "", type: String },
    german: { default: "", type: String },
    greek: { default: "", type: String },
    italian: { default: "", type: String },
    japanese: { default: "", type: String },
    korean: { default: "", type: String },
    norwegian: { default: "", type: String },
    pirate: { default: "", type: String },
    polish: { default: "", type: String },
    portuguese: { default: "", type: String },
    brazilian: { default: "", type: String },
    russian: { default: "", type: String },
    spanish: { default: "", type: String },
    swedish: { default: "", type: String },
    thai: { default: "", type: String },
    turkish: { default: "", type: String },
    ukrainian: { default: "", type: String }
})

module.exports = model('Context', Context)