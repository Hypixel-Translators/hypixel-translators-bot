const { loadingColor, errorColor, successColor, neutralColor, listeningStatuses, watchingStatuses, playingStatuses, ids } = require("../../config.json")
const axios = require("axios")
const { flag, code, name, countries } = require("country-emoji")
const fs = require("fs")
const country = require("countryjs")
const { updateButtonColors, getUUID, updateRoles, getXpNeeded } = require("../../lib/util")
const { crowdinVerify } = require("../../lib/crowdinverify")
const { leveling } = require("../../lib/leveling")
const { generateWelcomeImage } = require("../../listeners/guildMemberAdd")
import { db as mongoDb } from "../../lib/dbclient"
import { transpile, getParsedCommandLineOfConfigFile, sys } from "typescript"
import discord from "discord.js"
import { inspect } from "node:util"
import { Command, client as Client, GetStringFunction } from "../../index"
import { generateTip as randomTip } from "../../lib/util"

const command: Command = {
	name: "eval",
	description: "Evals the specified code.",
	roleWhitelist: [ids.roles.star],
	channelWhitelist: [ids.channels.staffBots, ids.channels.botDev, ids.channels.adminBots],
	options: [{
		type: "STRING",
		name: "code",
		description: "The code to run",
		required: true
	}],
	async execute(interaction, getString: GetStringFunction) {
		const me = interaction.member as discord.GuildMember,
			guild = interaction.guild!,
			channel = interaction.channel as discord.TextChannel,
			db = mongoDb,
			Discord = discord,
			client = Client,
			generateTip = randomTip

		await interaction.deferReply()
		let evaled,
			codeToRun = interaction.options.getString("code", true).replaceAll(/[“”]/gim, '"')
		if (codeToRun.includes("await ")) codeToRun = `(async () => {\n${codeToRun}\n})()`

		// this is stupid - https://github.com/microsoft/TypeScript/issues/45856
		const options = getParsedCommandLineOfConfigFile(
			"tsconfig.json",
			{},
			{
				...sys,
				onUnRecoverableConfigFileDiagnostic: console.error
			})!.options
		options.sourceMap = false
		options.alwaysStrict = false

		const compiledCode = transpile(codeToRun, options)
		try {
			evaled = await eval(compiledCode)
			const inspected = inspect(evaled, { depth: 1, getters: true }),
				embed = new discord.MessageEmbed()
					.setColor(successColor)
					.setAuthor("Evaluation")
					.setTitle("The code was executed successfully! Here's the output")
					.addFields(
						{ name: "Input", value: discord.Formatters.codeBlock("ts", codeToRun.substring(0, 1015)) },
						{ name: "Compiled code", value: discord.Formatters.codeBlock("js", compiledCode.replaceAll(";", "").substring(0, 1015)) },
						{ name: "Output", value: discord.Formatters.codeBlock("js", inspected.substring(0, 1015)) },

						{
							name: "Output type",
							value:
								evaled?.constructor.name === "Array"
									? `${evaled.constructor.name}<${evaled[0]?.constructor.name}>`
									: evaled?.constructor.name ?? typeof evaled,
							inline: true
						},
						{ name: "Output length", value: `${inspected.length}`, inline: true },
						{ name: "Time taken", value: `${(Date.now() - interaction.createdTimestamp).toLocaleString()}ms`, inline: true }
					)
					.setFooter(generateTip(), me.displayAvatarURL({ format: "png", dynamic: true }))
			await interaction.editReply({ embeds: [embed] })
			console.log(evaled)
		} catch (error) {
			const embed = new discord.MessageEmbed()
				.setColor(errorColor)
				.setAuthor("Evaluation")
				.setTitle("An error occured while executing that code. Here's the error stack")
				.addFields(
					{ name: "Input", value: discord.Formatters.codeBlock("ts", codeToRun.substring(0, 1015)) },
					{ name: "Compiled code", value: discord.Formatters.codeBlock("js", compiledCode.replaceAll(";", "").substring(0, 1015)) },
					{ name: "Error", value: discord.Formatters.codeBlock(error.stack.substring(0, 1017)) },

					{ name: "Error Type", value: error.name, inline: true },
					{ name: "Error length", value: `${error.stack.length}`, inline: true },
					{ name: "Time taken", value: `${(Date.now() - interaction.createdTimestamp).toLocaleString()}ms`, inline: true }
				)
				.setFooter(generateTip(), me.displayAvatarURL({ format: "png", dynamic: true }))
			console.error(error)
			await interaction.editReply({ embeds: [embed] })
		}
	}
}

export default command
