import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, Colors, EmbedBuilder, type TextChannel } from "discord.js"

import { ids } from "../../config.json"

import type { Command } from "../../lib/imports"

const command: Command = {
	name: "loa",
	description: "Report the time you're gonna be away for",
	options: [
		{
			type: ApplicationCommandOptionType.Integer,
			name: "startday",
			description: "The day in which your LOA will start",
			required: true,
			minValue: 1,
			maxValue: 31,
		},
		{
			type: ApplicationCommandOptionType.Integer,
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
				{ name: "December", value: 12 },
			],
			required: true,
		},
		{
			type: ApplicationCommandOptionType.Integer,
			name: "startyear",
			description: "The year in which your LOA will start",
			required: true,
			minValue: new Date().getFullYear(),
			maxValue: new Date().getFullYear() + 1,
		},
		{
			type: ApplicationCommandOptionType.Integer,
			name: "endday",
			description: "The day in which your LOA will end",
			required: true,
			minValue: 1,
			maxValue: 31,
		},
		{
			type: ApplicationCommandOptionType.Integer,
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
				{ name: "December", value: 12 },
			],
			required: true,
		},
		{
			type: ApplicationCommandOptionType.Integer,
			name: "endyear",
			description: "The year in which your LOA will end",
			required: true,
			minValue: new Date().getFullYear(),
			maxValue: new Date().getFullYear() + 1,
		},
		{
			type: ApplicationCommandOptionType.String,
			name: "reason",
			description: "The reason why you're gonna be away",
			required: true,
		},
		{
			type: ApplicationCommandOptionType.String,
			name: "extrainfo",
			description: "More info you'd like to add",
			required: false,
		},
	],
	cooldown: 600,
	channelWhitelist: [ids.channels.staffBots],
	roleWhitelist: [ids.roles.staff],
	async execute(interaction) {
		if (!interaction.inCachedGuild()) return
		const loaChannel = interaction.client.channels.cache.get(ids.channels.loa) as TextChannel,
			startDay = interaction.options.getInteger("startday", true),
			startMonth = interaction.options.getInteger("startmonth", true),
			startYear = interaction.options.getInteger("startyear", true),
			endDay = interaction.options.getInteger("endday", true),
			endMonth = interaction.options.getInteger("endmonth", true),
			endYear = interaction.options.getInteger("endyear", true),
			extraInfo = interaction.options.getString("extrainfo", false),
			startDate = new Date(startYear, startMonth - 1, startDay),
			endDate = new Date(endYear, endMonth - 1, endDay),
			// I promise this makes sense
			yesterday = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 1)

		if (startDay > 31 || endDay > 31) return await interaction.reply({ content: "You must input a valid day!", ephemeral: true })
		else if (startYear < new Date().getFullYear() || startYear > new Date().getFullYear() + 1)
			return await interaction.reply({ content: "You must input a valid year!", ephemeral: true })
		else if (endDate.getTime() < startDate.getTime())
			return await interaction.reply({ content: "The ending date must be after the starting date!", ephemeral: true })
		else if (endDate.getTime() <= yesterday.getTime() || startDate.getTime() <= yesterday.getTime())
			return await interaction.reply({ content: "The end and start date must both be after yesterday!", ephemeral: true })

		const embed = new EmbedBuilder({
			color: Colors.Blurple,
			author: { name: interaction.user.tag, iconURL: interaction.member.displayAvatarURL() },
			title: `${interaction.member.displayName} is going away for some time!`,
			fields: [
				{ name: "From", value: `${startDay}/${startMonth}/${startYear}` },
				{ name: "To", value: `${endDay}/${endMonth}/${endYear}` },
				{ name: "Reason", value: interaction.options.getString("reason", true) },
			],
		})
		if (extraInfo) embed.addFields({ name: "Extra info", value: extraInfo })
		const doneRow = new ActionRowBuilder<ButtonBuilder>({
			components: [
				new ButtonBuilder({
					style: ButtonStyle.Success,
					label: "End LOA",
					emoji: { name: "✅" },
					customId: "done",
				}),
			],
		})
		await loaChannel.send({ content: interaction.user.toString(), embeds: [embed], components: [doneRow] })
		await interaction.reply({
			content: `Successfully reported your LOA in ${loaChannel}! Once it's over, please delete it by clicking the button on the message.`,
			ephemeral: true,
		})
	},
}

export default command
