const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getWordOfDay, checkGuess } = require("../utils/wordle");
const { getUserState, addGuess } = require("../utils/gameState");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("jogar")
    .setDescription("Tente adivinhar a palavra do dia (5 letras)")
    .addStringOption(opt =>
      opt.setName("chute")
        .setDescription("Sua palavra de 5 letras")
        .setRequired(true)
    ),
  async execute(interaction) {
    const userId = interaction.user.id;
    const guess = interaction.options.getString("chute");

    if (guess.length !== 5) {
      return interaction.reply({
        content: "❌ A palavra precisa ter 5 letras!",
        ephemeral: true
      });
    }

    const word = await getWordOfDay();
    const userState = getUserState(userId);

    if (userState.guesses.length >= 6) {
      return interaction.reply({
        content: "❌ Você já usou suas 6 tentativas hoje!",
        ephemeral: true
      });
    }

    const result = checkGuess(guess, word, false); // mostra letras
    const updatedState = addGuess(userId, guess, result);

    const grid = updatedState.guesses.map(g => g.result).join("\n");

    // Monta Embed
    const embed = new EmbedBuilder()
      .setTitle("🎮 Termo do Dia")
      .setColor(guess.toLowerCase() === word ? 0x00ff00 : 0xffcc00) // verde se acertou
      .setDescription(
        `👤 Jogador: <@${userId}>\n` +
        `📅 Tentativa **${updatedState.guesses.length}/6**\n\n` +
        "```" + grid + "```"
      )
      .setFooter({ text: "Use /jogar para tentar adivinhar a palavra!" });

    if (guess.toLowerCase() === word) {
      embed.addFields({ name: "✅ Vitória!", value: `A palavra era **${word.toUpperCase()}** 🎉` });
    }

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
