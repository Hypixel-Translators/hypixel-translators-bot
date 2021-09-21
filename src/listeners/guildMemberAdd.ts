import { client } from "../index"
import { db, DbUser, cancelledEvents } from "../lib/dbclient"
import Discord from "discord.js"
import { registerFont, createCanvas, loadImage } from "canvas"
import type { PunishmentLog } from "../lib/util"

// A regular member only actually joins once they accept the membership screening, therefore we need to use this event instead
client.on("guildMemberUpdate", async (oldMember, newMember) => {
	if (!db) {
		cancelledEvents.push({ listener: "guildMemberUpdate", args: [oldMember, newMember] })
		return
	}

	if (newMember.guild.id !== "549503328472530974") return

	if (Boolean(oldMember.pending) !== Boolean(newMember.pending) && !newMember.pending) {
		await (newMember.guild.channels.cache.get("549882021934137354") as Discord.TextChannel).send({ content: `${newMember} just joined. Welcome! 🎉`, files: [await generateWelcomeImage(newMember)] }) //join-leave

		if (!newMember.user.bot) {
			newMember.send(`Hey there and thanks for joining the **${newMember.guild.name}**! In order to get access to the rest of the server, please verify yourself in <#569178590697095168>.`)
				.catch(() => console.log(`Couldn't DM user ${newMember.user.tag}, probably because they have DMs off`))
			await db.collection<DbUser>("users").insertOne({ id: newMember.id, lang: "en" })
		}
		const activePunishments = await db.collection<PunishmentLog>("punishments").find({ id: newMember.id, ended: false }).toArray()
		if (!activePunishments.length) return
		if (activePunishments.some(p => p.type === "MUTE")) await newMember.roles.add(["645208834633367562", "569194996964786178"], "User is muted") //Muted and Verified
		else if (activePunishments.some(p => p.type === "BAN")) await newMember.ban({ reason: activePunishments.find(p => p.type === "BAN")!.reason })
		else
			console.error(
				`There are non-expired punishments that shouldn't have a length for ${newMember.id}. Cases: ${activePunishments
					.filter(p => !p.ended)
					.map(p => p.case)
					.join(", ")}`,
				activePunishments
			)
	}
})

// Bots don't have membership screening, therefore we can use the regular event for them
client.on("guildMemberAdd", async member => {
	if (member.guild.id !== "549503328472530974") return

	if (member.user.bot) {
		await (member.guild.channels.cache.get("549882021934137354") as Discord.TextChannel).send({ content: `${member} just joined. Welcome! 🎉`, files: [await generateWelcomeImage(member)] }) //join-leave
		await member.roles.add("549894155174674432") // Bot
	}
})

export async function generateWelcomeImage(member: Discord.GuildMember) {
	//Define assets and create canvas
	registerFont("assets/Bitter-Regular.ttf", { family: "Bitter" })
	registerFont("assets/Bitter-Bold.ttf", { family: "Bitter-Bold" })
	const canvas = createCanvas(800, 200),
		ctx = canvas.getContext("2d"),
		userName = member.user.username,
		userAvatar = member.user.displayAvatarURL({ format: "png" }),
		memberCount = `${member.guild.members.cache.filter(m => !m.pending).size}`

	//Select appropriate font based on used characters
	/*let usernameFont
	if (/(^[A-zÀ-ÿ0-9 $-/:-?{-~!"^_`\[\]])\w+/gi.test(userName)) usernameFont = "37.5px Bitter-Bold"
	else usernameFont = "37.5px sans-serif"*/

	const bg = await loadImage("assets/joinBackground.png")
	let nameWidth: number

	//GENERAL
	//Add background and set basic styling
	ctx.drawImage(bg, 0, 0, 800, 200)
	ctx.fillStyle = "white"

	//TEXT
	//Measure text widths
	ctx.font = "37.5px Bitter"
	const welcome = ctx.measureText("Welcome ")
	ctx.font = "37.5px sans"
	const name = ctx.measureText(userName)
	if (name.width > (550 - welcome.width)) nameWidth = (550 - welcome.width)
	else nameWidth = name.width

	//Draw 'Welcome ' and '!'
	ctx.font = "37.5px Bitter"
	ctx.fillText("Welcome ", 200, 92.5)
	ctx.fillText("!", (200 + welcome.width + nameWidth), 92.5)

	//Draw username
	ctx.font = "37.5px sans"
	ctx.fillText(userName, (200 + welcome.width), 92.5, (550 - welcome.width))

	//Draw member count
	ctx.font = "30px Bitter"
	ctx.fillText(`You're member #${memberCount}`, 200, 132.5)

	//ICON
	//Draw a circle for the image to go into
	ctx.beginPath()
	ctx.arc(100, 100, 75, 0, 2 * Math.PI)
	ctx.closePath()

	//Put the image in the circle
	const userPic = await loadImage(userAvatar)
	ctx.clip()
	ctx.drawImage(userPic, 25, 25, 150, 150)
	ctx.restore()

	//OUTPUT
	return new Discord.MessageAttachment(canvas.toBuffer(), `${userName.replaceAll('"', "")} join.png`) //Discord doesn't like quotation marks in filenames
}
