const fs = require("fs");
const path = require("path");

const stateFile = path.join(__dirname, "guesses.json");

function loadState() {
  if (fs.existsSync(stateFile)) {
    return JSON.parse(fs.readFileSync(stateFile, "utf8"));
  }
  return {};
}

function saveState(data) {
  fs.writeFileSync(stateFile, JSON.stringify(data, null, 2));
}

function getUserState(userId) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const state = loadState();

  if (!state[userId] || state[userId].date !== today) {
    // reset para novo dia
    state[userId] = { date: today, guesses: [] };
    saveState(state);
  }

  return state[userId];
}

function addGuess(userId, guess, result) {
  const state = loadState();
  const today = new Date().toISOString().slice(0, 10);

  if (!state[userId] || state[userId].date !== today) {
    state[userId] = { date: today, guesses: [] };
  }

  state[userId].guesses.push({ guess, result });
  saveState(state);

  return state[userId];
}
function getUserState(userId) {
  const today = new Date().toISOString().slice(0, 10);
  const state = loadState();

  if (!state[userId] || state[userId].date !== today) {
    // reset para novo dia
    state[userId] = { date: today, guesses: [], streak: state[userId]?.streak || 0, lastWin: null };
    saveState(state);
  }

  return state[userId];
}

function markWin(userId) {
  const today = new Date().toISOString().slice(0, 10);
  const state = loadState();

  if (!state[userId]) state[userId] = { date: today, guesses: [], streak: 0, lastWin: null };

  // se não ganhou ontem, streak reseta
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (state[userId].lastWin !== yesterday) {
    state[userId].streak = 0;
  }

  state[userId].streak += 1;
  state[userId].lastWin = today;

  saveState(state);
  return state[userId].streak;
}



module.exports = { getUserState, addGuess };
