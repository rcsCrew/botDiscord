// /commands/ranking.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { checkGuess, getWordOfDay } = require("../utils/wordle");
const fs = require("fs");
const path = require("path");

const stateFile = path.join(__dirname, "../utils/guesses.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ranking")
    .setDescription("Mostra o ranking de tentativas do dia"),
  async execute(interaction) {
    if (!fs.existsSync(stateFile)) {
      return interaction.reply("❌ Ainda não tem jogadas hoje!");
    }

    const states = JSON.parse(fs.readFileSync(stateFile, "utf8"));
    const today = new Date().toISOString().slice(0, 10);

    // pega a palavra do dia (pra comparação)
    const word = await getWordOfDay();

    const players = Object.entries(states)
      .filter(([_, data]) => data.date === today)
      .map(([userId, data]) => {
        // gera grid só com blocos (sem letras)
        const guessesGrid = data.guesses
          .map(g => checkGuess(g.guess, word, true)) // hideLetters = true
          .join("\n");

        return {
          userId,
          guesses: guessesGrid,
          streak: data.streak || 0,
        };
      });

    if (players.length === 0) {
      return interaction.reply("❌ Ninguém jogou ainda hoje!");
    }

    // monta descrição do ranking
    let desc = players
      .map(
        (p) =>
          `<@${p.userId}>\n${p.guesses}\n🔥 Streak: ${p.streak} dias`
      )
      .join("\n\n");

    const embed = new EmbedBuilder()
      .setTitle("🏆 Ranking do Termo")
      .setColor(0x3498db)
      .setDescription(desc)
      .setFooter({
        text: "Cada tentativa mostra apenas blocos coloridos (sem spoilers de letras)",
      });

    return interaction.reply({ embeds: [embed] });
  },
};
