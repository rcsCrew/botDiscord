// /commands/skip.js
const { SlashCommandBuilder } = require("discord.js");
const { getQueue } = require("../music/state");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Pula a música atual"),

  async execute(interaction) {
    const q = getQueue(interaction.guild.id);
    if (!q || (!q.current && q.songs.length === 0)) {
      return interaction.reply("ℹ️ Não tem nada tocando.");
    }
    const skipped = q.current?.title || "(desconhecida)";
    q.player.stop(true); // dispara Idle -> playSong continua
    return interaction.reply(`⏭️ Pulando: **${skipped}**`);
  },
};
