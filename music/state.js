// /music/state.js
const { createAudioPlayer, NoSubscriberBehavior, AudioPlayerStatus } = require("@discordjs/voice");

// Mapa de filas por guild
const queues = new Map();

/**
 * Cria (se precisar) e retorna a fila da guild.
 * Estrutura: { connection, player, songs: [{url,title}], current: {url,title} | null, textChannelId?: string }
 */
function ensureQueue(guildId) {
  let q = queues.get(guildId);
  if (!q) {
    const player = createAudioPlayer({
      behaviors: { noSubscriber: NoSubscriberBehavior.Pause },
    });
    player.on("error", (err) => console.error("🎧 Player error:", err));

    q = { connection: null, player, songs: [], current: null, textChannelId: null };
    queues.set(guildId, q);
  }
  return q;
}

function getQueue(guildId) {
  return queues.get(guildId) || null;
}

function clearQueue(guildId) {
  const q = queues.get(guildId);
  if (q) {
    try { q.player.stop(true); } catch {}
    try { q.connection?.destroy(); } catch {}
    queues.delete(guildId);
  }
}

module.exports = { queues, ensureQueue, getQueue, clearQueue, AudioPlayerStatus };
