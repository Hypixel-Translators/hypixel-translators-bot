import { setTimeout } from "node:timers/promises"

import { ApplicationCommandOptionType, EmbedBuilder, type TextChannel } from "discord.js"

import { colors, ids } from "../../config.json"
import { client } from "../../index"
import { crowdinVerify } from "../../lib/crowdinverify"
import { db, type DbUser } from "../../lib/dbclient"

import type { Command } from "../../lib/imports"

const command: Command = {
	name: "verify",
	description: "Verifies and gives you your corresponding roles",
	options: [
		{
			type: ApplicationCommandOptionType.String,
			name: "url",
			description: 'The URL to your Crowdin profile. Must have your Discord tag in your "About me" section.',
			required: false,
		},
		{
			type: ApplicationCommandOptionType.User,
			name: "user",
			description: "The user to manually verify. Admin only",
			required: false,
		},
	],
	cooldown: 300,
	async execute(interaction) {
		if (!interaction.inCachedGuild()) return
		const verifyLogs = interaction.client.channels.cache.get(ids.channels.verifyLogs) as TextChannel,
			verify = interaction.client.channels.cache.get(ids.channels.verify) as TextChannel,
			profileUrl = interaction.options.getString("url", false),
			memberInput = interaction.options.getMember("user"),
			url = profileUrl?.match(/(?:https?:\/\/)?(?:[a-z]{2,}\.)?crowdin\.com\/profile\/\S{1,}/gi)?.[0],
			collection = db.collection<DbUser>("users")
		await interaction.deferReply({ ephemeral: true })
		if (!interaction.member.roles.cache.has(ids.roles.verified) && interaction.channelId === ids.channels.verify && !url) {
			const fiMessages = (await interaction.channel!.messages.fetch()).filter(msgs => msgs.author.id === interaction.user.id)
			await (interaction.channel as TextChannel).bulkDelete(fiMessages)
			await interaction.member.roles.add(ids.roles.verified, "Manually verified through the command")
			await interaction.member.roles.remove(ids.roles.alerted, "Manually verified through the command")
			await collection.updateOne({ id: interaction.member.id }, { $unset: { unverifiedTimestamp: true } })
			await collection.updateOne({ id: interaction.member.id, profile: { $exists: false } }, { $set: { profile: null } })
			await crowdinVerify(interaction.member, null)
			await verifyLogs.send(`${interaction.user} manually verified themselves through the command`)
			client.cooldowns.get(this.name)!.delete(interaction.user.id)
			await interaction.editReply({
				content:
					"You successfully verified yourself as a regular user! If you're a translator and didn't mean to do this, feel free to run the /verify command and make sure to include your profile URL in the `url` parameter, e.g. `/verify url:https://crowdin.com/profile/atotallyvaliduser`",
			})
		} else if (interaction.member.roles.cache.has(ids.roles.admin) && memberInput) {
			await verifyLogs.send({
				content: `${memberInput} is being reverified (requested by ${interaction.user})`,
				allowedMentions: { users: [memberInput.id] },
			})
			await crowdinVerify(memberInput, url, false)
			await interaction.editReply("Your request has been processed. Check the logs")
		} else {
			const userDb = await client.getUser(interaction.user.id)
			if (userDb.profile || (profileUrl && /(https:\/\/)([a-z]{2,}\.)?crowdin\.com\/profile?\/?\S{1,}/gi.test(profileUrl))) {
				await collection.updateOne({ id: interaction.member.id }, { $unset: { unverifiedTimestamp: true } })
				if (interaction.member.roles.cache.has(ids.roles.verified)) await verifyLogs.send(`${interaction.user} is being reverified.`)
				await crowdinVerify(interaction.member, url, true)
				await interaction.editReply("Your profile has been processed. Check your DMs.")
			} else {
				await interaction.member.roles.remove(ids.roles.verified, "Unverified")
				await collection.updateOne({ id: interaction.member.id }, { $set: { unverifiedTimestamp: Date.now() } })
				const embed = new EmbedBuilder({
					color: colors.error,
					author: { name: "Manual verification" },
					title: "You were successfully unverified!",
					description: `Since we didn't have your profile registered on our database, we'd like to ask you to kindly send it to us on the ${verify} channel. Please make sure your profile is public and that you have your Discord tag (${interaction.user.tag}) in your "About me" section.`,
					footer: { text: "Any messages you send here will be sent to staff upon confirmation." },
				})
				await interaction.user
					.send({ embeds: [embed] })
					.then(async () => {
						await verifyLogs.send(
							`${interaction.user} tried to verify with an invalid profile URL ${url ? `(<${url}>) ` : ""}or there was no profile stored for them.`,
						)
						await interaction.editReply({ content: "Your request has been processed, check your DMs for more info!" })
					})
					.catch(async () => {
						embed
							.setDescription(
								`Since we didn't have your profile registered on our database, we'd like to ask you to kindly send it to us here. Please make sure your profile is public and that you have your Discord tag (${interaction.user.tag}) in your "About me" section.`,
							)
							.setFooter({ text: "" })
						await verifyLogs.send(
							`${interaction.user} tried to verify with an invalid profile URL ${
								url ? `(<${url}>) ` : ""
							}or there was no profile stored for them but they had DMs off so I couldn't tell them.`,
						)
						const msg = await verify.send({ content: `${interaction.user} you had DMs disabled, so here's our message:`, embeds: [embed] })
						await interaction.editReply({ content: `Your request has been processed, check ${verify} for more info!` })
						await setTimeout(30_000)
						await msg.delete().catch(() => null)
					})
				client.cooldowns.get(this.name)!.delete(interaction.user.id)
			}
		}
	},
}

export default command
