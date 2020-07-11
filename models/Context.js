const { Schema, model } = require('mongoose')

const Context = Schema({
    id: String,
    photo: String,
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