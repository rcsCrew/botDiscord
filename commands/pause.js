// /commands/pause.js
const { SlashCommandBuilder } = require("discord.js");
const { getQueue } = require("../music/state");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pause")
    .setDescription("Pausa a música atual"),

  async execute(interaction) {
    const q = getQueue(interaction.guild.id);
    if (!q || !q.current) return interaction.reply("ℹ️ Nada tocando.");
    const ok = q.player.pause(true);
    return interaction.reply(ok ? "⏸️ Pausado." : "ℹ️ Já está pausado.");
  },
};
