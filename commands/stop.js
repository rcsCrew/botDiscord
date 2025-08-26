// /commands/stop.js
const { SlashCommandBuilder } = require("discord.js");
const { getQueue, clearQueue } = require("../music/state");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Para a reprodução e limpa a fila"),

  async execute(interaction) {
    const q = getQueue(interaction.guild.id);
    if (!q) return interaction.reply("ℹ️ Já está parado.");
    clearQueue(interaction.guild.id);
    return interaction.reply("⏹️ Parei tudo e limpei a fila.");
  },
};
