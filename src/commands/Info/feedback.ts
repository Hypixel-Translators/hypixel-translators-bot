import { successColor } from "../../config.json"
import Discord from "discord.js"
import { Command, GetStringFunction } from "../../index"

const command: Command = {
	name: "feedback",
	description: "Gives you instructions on how to give feedback towards the bot",
	cooldown: 120,
	allowDM: true,
	channelWhitelist: ["549894938712866816", "624881429834366986", "730042612647723058"], //bots staff-bots bot-dev 
	async execute(interaction, getString: GetStringFunction) {
		const executedBy = getString("executedBy", { user: interaction.user.tag }, "global")
		const embed = new Discord.MessageEmbed()
			.setColor(successColor as Discord.HexColorString)
			.setAuthor(getString("moduleName"))
			.setTitle(getString("bugT"))
			.setDescription(getString("bugD"))
			.addField(getString("urgentT"), getString("urgentD"))
			.setFooter(executedBy, interaction.user.displayAvatarURL({ format: "png", dynamic: true }))
		const row = new Discord.MessageActionRow()
			.addComponents(
				new Discord.MessageButton()
					.setLabel(getString("link"))
					.setStyle("LINK")
					.setURL("https://github.com/Hypixel-Translators/hypixel-translators-bot/issues")
			)
		await interaction.reply({ components: [row], embeds: [embed] })
	}
}

export default command
