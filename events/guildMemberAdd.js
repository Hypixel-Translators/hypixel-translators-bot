const Discord = require("discord.js")
const { registerFont, createCanvas, loadImage } = require("canvas")

module.exports = {
    execute(member) {
        registerFont('./assets/Bitter-Regular.ttf', { family: 'Bitter' })
        registerFont('./assets/Bitter-Bold.ttf', { family: 'Bitter-Bold' })
        const canvas = createCanvas(800, 200)
        const ctx = canvas.getContext("2d")

        let userName = member.user.username
        let userAvatar = member.user.displayAvatarURL({ format: "png" })
        let memberCount = `${member.guild.memberCount}`

        loadImage("./assets/joinBackground.png").then((bg) => {
            let nameWidth

            //GENERAL
            //Add background and set basic styling
            ctx.drawImage(bg, 0, 0, 800, 200)
            ctx.fillStyle = "white"


            //TEXT
            //Measure text widths
            ctx.font = "37.5px Bitter"
            let welcome = ctx.measureText("Welcome ")
            ctx.font = "37.5px Bitter-Bold"
            let name = ctx.measureText(userName)
            if (name.width > (550 - welcome.width)) nameWidth = (550 - welcome.width)
            else nameWidth = name.width

            //Draw 'Welcome ' and '!'
            ctx.font = "37.5px Bitter"
            ctx.fillText("Welcome ", 200, 92.5)
            ctx.fillText("!", (200 + welcome.width + nameWidth), 92.5)

            //Draw username
            ctx.font = "37.5px Bitter-Bold"
            ctx.fillText(userName, (200 + welcome.width), 92.5, (550 - welcome.width))

            //Draw member count
            ctx.font = "30px Bitter"
            ctx.fillText("You're member #" + memberCount, 200, 132.5)


            //ICON
            //Draw a circle for the image to go into
            ctx.beginPath()
            ctx.arc(100, 100, 75, 0, 2 * Math.PI)
            ctx.closePath()

            //Put the image in the circle
            loadImage(userAvatar).then((userPic) => {
                ctx.clip()
                ctx.drawImage(userPic, 25, 25, 150, 150)
                ctx.restore()


                //OUTPUT
                const attachment = new MessageAttachment(canvas.toDataURL())
                member.guild.channels.cache.get("730042612647723058").send(`<@${member.user.id}> just joined! Welcome! 🎉!`, attachment) //join-leave
            })
        })
    }
}