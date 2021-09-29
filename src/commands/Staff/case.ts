import Discord from "discord.js"
import { client, Command } from "../../index"
import { db } from "../../lib/dbclient"
import { generateTip, PunishmentLog, updateModlogFields } from "../../lib/util"

const command: Command = {
	name: "case",
	description: "Gives you information about any given case.",
	options: [{
		type: "INTEGER",
		name: "case",
		description: "Case number",
		required: true
	}],
	roleWhitelist: ["768435276191891456"], //Discord Staff
	channelWhitelist: ["624881429834366986", "551693960913879071"], //staff-bots admin-bots
	async execute(interaction) {
		const caseNumber = interaction.options.getInteger("case", true),
			collection = db.collection<PunishmentLog>("punishments"),
			modLog = await collection.findOne({ case: caseNumber }),
			member = interaction.member as Discord.GuildMember

		if (!modLog) throw `Couldn't find that case number! You must enter a number between 1 and ${await collection.estimatedDocumentCount()}`

		const offender = interaction.guild!.members.cache.get(modLog.id) ?? await client.users.fetch(modLog.id),
			embed = new Discord.MessageEmbed()
				.setColor("BLURPLE")
				.setAuthor("Punishment case")
				.setTitle(`Here's case #${caseNumber}`)
				.setDescription(`Offender: ${offender instanceof Discord.GuildMember ? offender : offender.tag}`)
				.setFooter(generateTip(), member.displayAvatarURL({ format: "png", dynamic: true }))
		updateModlogFields(embed, modLog)
		await interaction.reply({ embeds: [embed] })
	}
}

export default command
