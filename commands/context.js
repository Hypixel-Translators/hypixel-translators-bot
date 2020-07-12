const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");
const ContextModel = require('../models/Context')
const { connect } = require('mongoose')

module.exports = {
    name: "context",
    description: "Does nothing for now!",
    usage: "context <add|string link>",
    cooldown: 3,
    execute(message, args) {

    }
}
