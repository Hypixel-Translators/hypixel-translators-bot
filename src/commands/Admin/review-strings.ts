import { ids } from "../../config.json"
import { db } from "../../lib/dbclient"

import type { CategoryChannel } from "discord.js"
import type { Command } from "../../lib/imports"
import type { LangDbEntry } from "../../lib/util"

const command: Command = {
    name: "review-strings",
    description: "Creates a new review strings channel for the desired language",
    options: [{
        type: "STRING",
        name: "language",
        description: "The code of the language to create the review strings channel for",
        required: true
    }],
    roleWhitelist: [ids.roles.admin],
    async execute(interaction) {
        if (!interaction.inCachedGuild()) return
        await interaction.deferReply()
        const language = interaction.options.getString("language", true),
            langDbEntry = await db.collection<LangDbEntry>("langdb").findOne({ code: language })
        if (!langDbEntry) throw "Couldn't find the language you were looking for! Make sure to pass its code in the language option."

        const category = interaction.guild.channels.cache.find(c => c.name.endsWith(langDbEntry.emoji) && c.type === "GUILD_CATEGORY") as CategoryChannel,
            pfRole = interaction.guild.roles.cache.find(r => r.name === `${langDbEntry.name} Proofreader`)!
        if (category.children.some(c => c.name.endsWith("-review-strings"))) throw "This language already has a review strings channel!"

        const reviewStrings = await category.createChannel(`${langDbEntry.code}-review-strings`, {
            reason: `Requested by ${interaction.user.tag}`
        })
        await reviewStrings.permissionOverwrites.edit(
            pfRole.id,
            { MANAGE_MESSAGES: null },
            { reason: "Removing permission to manage messages from proofreaders" }
        )
        await reviewStrings.setPosition(1, { reason: "Fixing the position" })
        await reviewStrings.send(
            "Welcome to the review-strings channel! Here you will be able to send string URLs for proofreaders to review. Proofreaders will, then, react with either <:vote_yes:732298639749152769>, <:vote_maybe:839262179416211477> or <:vote_no:732298639736570007> depending on whether they accept your suggestion, want more details, or deny it. If you have any questions or if you notice something isn't working, please let the staff team know!"
        )
        await interaction.editReply(`Successfully created the ${reviewStrings} channel. Check it out!`)
    }
}

export default command
