const fs = require("fs");
const path = require("path");

const dataFile = path.join(__dirname, "wordOfDay.json");

// Função para carregar/salvar
function loadData() {
  if (fs.existsSync(dataFile)) {
    return JSON.parse(fs.readFileSync(dataFile, "utf8"));
  }
  return {};
}

function saveData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

function removeAccents(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

async function getWordOfDay() {
  const today = new Date().toISOString().slice(0, 10); 
  let data = loadData();

  if (data.date === today) {
    return data.word;
  }

  const res = await fetch("https://www.ime.usp.br/~pf/dicios/br-utf8.txt");
  const text = await res.text();
  const words = text
    .split("\n")
    .map(w => w.trim().toLowerCase())
    .filter(w => w.length === 5);

  // sorteia a palavra COM acento
  const word = words[Math.floor(Math.random() * words.length)];

  data = { date: today, word };
  saveData(data);

  return word;
}

function checkGuess(guess, word, hideLetters = false) {
  const plainGuess = removeAccents(guess.toLowerCase());
  const plainWord  = removeAccents(word.toLowerCase());

  let result = [];

  for (let i = 0; i < plainGuess.length; i++) {
    const letter = guess[i].toUpperCase(); // mantém a letra original

    if (plainGuess[i] === plainWord[i]) {
      result.push(hideLetters ? "🟩" : `🟩${letter}🟩`);
    } else if (plainWord.includes(plainGuess[i])) {
      result.push(hideLetters ? "🟨" : `🟨${letter}🟨`);
    } else {
      result.push(hideLetters ? "⬛" : `⬛${letter}⬛`);
    }
  }

  return hideLetters ? result.join("") : result.join(" ");
}


module.exports = { getWordOfDay, checkGuess };
