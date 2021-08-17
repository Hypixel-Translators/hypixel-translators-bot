import Discord from "discord.js"
import { Command } from "../../index"

const command: Command = {
	name: "loa",
	description: "Report the time you're gonna be away for",
	options: [{
		type: "INTEGER",
		name: "startday",
		description: "The day in which your LOA will start",
		required: true
	},
	{
		type: "INTEGER",
		name: "startmonth",
		description: "The month in which your LOA will start",
		choices: [
			{ name: "January", value: 1 },
			{ name: "February", value: 2 },
			{ name: "March", value: 3 },
			{ name: "April", value: 4 },
			{ name: "May", value: 5 },
			{ name: "June", value: 6 },
			{ name: "July", value: 7 },
			{ name: "August", value: 8 },
			{ name: "September", value: 9 },
			{ name: "October", value: 10 },
			{ name: "November", value: 11 },
			{ name: "December", value: 12 }
		],
		required: true
	},
	{
		type: "INTEGER",
		name: "startyear",
		description: "The year in which your LOA will start",
		required: true
	},
	{
		type: "INTEGER",
		name: "endday",
		description: "The day in which your LOA will end",
		required: true
	},
	{
		type: "INTEGER",
		name: "endmonth",
		description: "The month in which your LOA will end",
		choices: [
			{ name: "January", value: 1 },
			{ name: "February", value: 2 },
			{ name: "March", value: 3 },
			{ name: "April", value: 4 },
			{ name: "May", value: 5 },
			{ name: "June", value: 6 },
			{ name: "July", value: 7 },
			{ name: "August", value: 8 },
			{ name: "September", value: 9 },
			{ name: "October", value: 10 },
			{ name: "November", value: 11 },
			{ name: "December", value: 12 }
		],
		required: true
	},
	{
		type: "INTEGER",
		name: "endyear",
		description: "The year in which your LOA will end",
		required: true
	},
	{
		type: "STRING",
		name: "reason",
		description: "The reason why you're gonna be away",
		required: true
	},
	{
		type: "STRING",
		name: "extrainfo",
		description: "More info you'd like to add",
		required: false
	}],
	cooldown: 600,
	channelWhitelist: ["624881429834366986"], //staff-bots
	roleWhitelist: ["768435276191891456"], //Discord Staff
	async execute(interaction) {
		const loaChannel = interaction.client.channels.cache.get("836748153122324481") as Discord.TextChannel,
			startDay = interaction.options.getInteger("startday", true),
			startMonth = interaction.options.getInteger("startmonth", true),
			startYear = interaction.options.getInteger("startyear", true),
			endDay = interaction.options.getInteger("endday", true),
			endMonth = interaction.options.getInteger("endmonth", true),
			endYear = interaction.options.getInteger("endyear", true),
			reason = interaction.options.getString("reason", true),
			extraInfo = interaction.options.getString("extrainfo", false),
			startDate = new Date(startYear, startMonth - 1, startDay),
			endDate = new Date(endYear, endMonth - 1, endDay),
			today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())

		if (startDay > 31 || endDay > 31)
			return await interaction.reply({ content: "You must input a valid day!", ephemeral: true })
		else if (startYear < new Date().getFullYear() || startYear > new Date().getFullYear() + 1)
			return await interaction.reply({ content: "You must input a valid year!", ephemeral: true })
		else if (endDate.getTime() < startDate.getTime())
			return await interaction.reply({ content: "The ending date must be after the starting date!", ephemeral: true })
		else if (endDate.getTime() <= today.getTime() || startDate.getTime() <= today.getTime())
			return await interaction.reply({ content: "The end and start date must both be after today!", ephemeral: true })

		const embed = new Discord.MessageEmbed()
			.setColor("BLURPLE")
			.setTitle(`${interaction.user.tag} is going away for some time!`)
			.addFields(
				{ name: "From", value: `${startDay}/${startMonth}/${startYear}` },
				{ name: "To", value: `${endDay}/${endMonth}/${endYear}` },
				{ name: "Reason", value: reason }
			)
			.setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
		if (extraInfo) embed.addField("Extra info", extraInfo)
		const doneRow = new Discord.MessageActionRow()
			.addComponents(
				new Discord.MessageButton()
					.setStyle("SUCCESS")
					.setLabel("End LOA")
					.setEmoji("✅")
					.setCustomId("done")
			)
		await loaChannel.send({ content: interaction.user.toString(), embeds: [embed], components: [doneRow] })
		await interaction.reply({ content: `Successfully reported your LOA in ${loaChannel}! Once it's over, please delete it by clicking the button on the message.`, ephemeral: true })
	}
}

export default command