import { Command, GetStringFunction } from "../../index"

const command: Command = {
  name: "guidelines",
  description: "Gives you the link to the translations guide on Hypixel.",
  cooldown: 120,
  allowDM: true,
  categoryBlacklist: ["613015467984158742", "748267955552518175", "748585307825242322", "763131996163407902", "646083561769926668", "619190456911134750"], // Important, Verification, Sba, Bot, Quickplay, Archived Channels
  channelBlacklist: ["621298919535804426", "619662798133133312", "712046319375482910", "550951034332381184", "713084081579098152", "621072293832949767"], //off-topic, memes, pets, suggestions, no-mic, staff-general
  async execute(interaction, getString: GetStringFunction) {
    await interaction.reply(getString("guide", { guide: "https://hypixel.net/translate/#post-7078208" }))
  }
}

export default command
