// /commands/queue.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getQueue } = require("../music/state");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Mostra a fila de músicas"),

  async execute(interaction) {
    const q = getQueue(interaction.guild.id);
    if (!q || (!q.current && q.songs.length === 0)) {
      return interaction.reply("📭 Fila vazia.");
    }

    const now = q.current ? `**Agora:** ${q.current.title}` : "—";
    const upcoming = q.songs.slice(0, 10)
      .map((s, i) => `\`${i + 1}.\` ${s.title}`)
      .join("\n") || "—";

    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle("🎼 Fila de Reprodução")
      .addFields(
        { name: "Tocando agora", value: now },
        { name: "Próximas", value: upcoming },
      )
      .setFooter({ text: `Total na fila: ${q.songs.length + (q.current ? 1 : 0)}` });

    return interaction.reply({ embeds: [embed] });
  },
};
