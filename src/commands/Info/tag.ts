import { ApplicationCommandOptionType } from "discord.js"

import { getInviteLink } from "../../lib/util"

import type { Command } from "../../lib/imports"

const command: Command = {
	name: "tag",
	description: "Sends a preset message, allowing you to notify a specific member when sending it.",
	options: [
		{
			type: ApplicationCommandOptionType.String,
			name: "tag",
			description: "The tag you want to see",
			choices: [
				{ name: "Invite link to the server", value: "invite" },
				{ name: "Hypixel links", value: "hypixel" },
				{ name: "Hypixel project guidelines", value: "guidelines" },
				{ name: "How to get proofreader on the Hypixel project", value: "proofreader" },
				{ name: "Minecraft Crowdin Project", value: "minecraft" },
				{ name: "Quickplay links", value: "quickplay" },
				{ name: "SkyblockAddons links", value: "skyblockaddons" },
				{ name: "Discord server thread", value: "thread" },
				{ name: "Hypixel Translators Community Twitter", value: "twitter" },
			],
			required: true,
		},
		{
			type: ApplicationCommandOptionType.User,
			name: "target",
			description: "The user to mention with this tag",
			required: false,
		},
	],
	cooldown: 60,
	allowDM: true,
	async execute(interaction) {
		const tag = interaction.options.getString("tag", true) as
				| "invite"
				| "hypixel"
				| "guidelines"
				| "proofreader"
				| "minecraft"
				| "quickplay"
				| "skyblockaddons"
				| "thread"
				| "twitter",
			target = interaction.options.getUser("target", false)

		let response: string

		switch (tag) {
			case "invite":
				response = `You can use this link to invite others to the community: ${await getInviteLink()}`
				break
			case "hypixel":
				response =
					'Click [here](<https://crowdin.com/project/hypixel> "Hypixel Crowdin project") to access the Hypixel Crowdin project.\n' +
					"If you want to check out the official project guide, execute `/tag guide`.\n" +
					'The Hypixel Discord server can be found [here](<https://discord.gg/hypixel> "Hypixel Discord server") (useful for proofreaders).'
				break
			case "guidelines":
				response =
					'You can find the official guide for the Hypixel project [here](<https://hypixel.net/translate/#post-7078208> "Guide to helping translate Hypixel").'
				break
			case "proofreader":
				response =
					'If you\'d like to know how to become a proofreader on the Hypixel project, check out [this link](<https://hypixel.net/translate/post-33017345> "Proofreader Information & FAQ").\n' +
					'In order to check how many words you have translated on the Hypixel project, go [here](<https://crowdin.com/project/hypixel/reports/top-members> "Top Members - Hypixel - Translation Reports") and follow these steps:\n' +
					' - Select your language under the "All languages" dropdown;\n' +
					' - Change the "Date Range" to start from the day the project was created (you can achieve this easily by deleting one of the digits in the first year and clicking out of the box);\n' +
					' - Click on the + button next to the arrows and check the box saying "Winning" - this will display how many of your suggestions have been approved on the project!\n' +
					'To know more about the Top Members tab, check out [this article](<https://support.crowdin.com/project-reports/?q=reports#top-members> "Project Reports - Crowdin Documentation").'
				break
			case "minecraft":
				response =
					'Whenever you find terms in any of the projects that belong to Minecraft itself, you should always use the official translations from the game. You can find the official Minecraft Crowdin project [here](<https://crowdin.com/project/minecraft> "Minecraft Crowdin project") in order to see those.'
				break
			case "quickplay":
				response =
					'Click [here](<https://crowdin.com/project/quickplay> "Quickplay Crowdin project") to access the Quickplay Crowdin project.\n' +
					'Click [here](<https://hypixel.net/threads/1317410/> "Quickplay - Quickly Join Games on the Network") to check out the thread showcasing the mod.\n' +
					'The Quickplay Discord server can be found [here](<https://discord.gg/373EGB4> "Quickplay Discord server").'
				break
			case "skyblockaddons":
				response =
					'Click [here](<https://crowdin.com/project/skyblockaddons> "SkyblockAddons Crowdin project") to access the SkyblockAddons Crowdin project.\n' +
					'Click [here](<https://hypixel.net/threads/2109217/> "SkyblockAddons - Useful features for skyblock!") to check out the thread showcasing the mod.\n' +
					'This project is owned by Biscuit! Join his server [here](<https://discord.gg/zWyr3f5GXz> "Biscuit\'s Bakery").'
				break
			case "thread":
				response =
					'You can find the official thread announcing this Discord server [here](<https://hypixel.net/threads/1970571> "Hypixel Translator Discord thread on the Hypixel forums").'
				break
			case "twitter":
				response =
					'You can visit our official Twitter account [here](<https://twitter.com/HTranslators> "@HTranslators on Twitter"). Feel free to share it with all your friends!'
				break
			default:
				response = "Unknown tag! Please contact the developer about this."
				console.error(`Received unknown tag: ${tag}!`)
				break
		}

		if (target) response = `*Tag suggestion for ${target}:*\n${response}`
		await interaction.reply(response)
	},
}

export default command
