// /bot/commands/ping.js
const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Responde com Pong e mostra a latência!"),
  async execute(interaction) {
    const sent = await interaction.reply({ content: "🏓 Pong!", fetchReply: true });
    const ping = interaction.client.ws.ping;
    const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
    
    await interaction.editReply(
      `🏓 Pong!\n⏱️ Ping: ${ping}ms\n📶 Latência: ${roundtrip}ms`
    );
  },
};
