// /commands/resume.js
const { SlashCommandBuilder } = require("discord.js");
const { getQueue } = require("../music/state");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("resume")
    .setDescription("Retoma a reprodução"),

  async execute(interaction) {
    const q = getQueue(interaction.guild.id);
    if (!q || !q.current) return interaction.reply("ℹ️ Nada para retomar.");
    const ok = q.player.unpause();
    return interaction.reply(ok ? "▶️ Retomado." : "ℹ️ Já estava tocando.");
  },
};
