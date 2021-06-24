import Discord from "discord.js"
import { blurple } from "../../config.json"
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
    }],
    cooldown: Infinity,
    channelWhitelist: ["624881429834366986"], //staff-bots
    roleWhitelist: ["768435276191891456"], //Discord Staff
    async execute(interaction: Discord.CommandInteraction) {
        const loaChannel = interaction.client.channels.cache.get("836748153122324481") as Discord.TextChannel,
            startDay = interaction.options.get("startday")!.value as number,
            startMonth = interaction.options.get("startmonth")!.value as number,
            startYear = interaction.options.get("startyear")!.value as number,
            endDay = interaction.options.get("endday")!.value as number,
            endMonth = interaction.options.get("endmonth")!.value as number,
            endYear = interaction.options.get("endyear")!.value as number,
            reason = interaction.options.get("reason")!.value as string,
            startDate = new Date(startYear, startMonth - 1, startDay),
            endDate = new Date(endYear, endMonth - 1, endDay),
            today = new Date(new Date().getFullYear(), new Date().getMonth() - 1, new Date().getDay())

        if (startDay > 31 || endDay > 31)
            return await interaction.reply({ content: "You must input a valid day!", ephemeral: true })
        else if (startMonth > 12 || endMonth > 12)
            return await interaction.reply({ content: "You must input a valid month!", ephemeral: true })
        else if (startYear < new Date().getFullYear() || startYear > new Date().getFullYear() + 1)
            return await interaction.reply({ content: "You must input a valid year!", ephemeral: true })
        else if (endDate.getTime() < startDate.getTime())
            return await interaction.reply({ content: "The ending date must be after the starting date!", ephemeral: true })
        else if (endDate.getTime() <= today.getTime() || startDate.getTime() <= today.getTime())
            return await interaction.reply({ content: "The end and start date must both be after today!" })

        const embed = new Discord.MessageEmbed()
            .setColor(blurple)
            .setTitle(`${interaction.user.tag} is going away for some time!`)
            .addFields(
                { name: "From", value: `${startDay}/${startMonth}/${startYear}` },
                { name: "To", value: `${endDay}/${endMonth}/${endYear}` },
                { name: "Reason", value: reason }
            )
            .setFooter(`Executed by ${interaction.user.tag}`, interaction.user.displayAvatarURL({ format: "png", dynamic: true })),
            doneButton = new Discord.MessageButton()
                .setStyle("SUCCESS")
                .setLabel("End LOA")
                .setEmoji("✅")
                .setCustomID("done")
        await loaChannel.send({ content: interaction.user.toString(), embeds: [embed], components: [[doneButton]] })
        await interaction.reply({ content: `Successfully reported your LOA in ${loaChannel}! Once it's over, please delete it by clicking the button on the message.`, ephemeral: true })
    }
}

export default command