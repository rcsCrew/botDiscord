// /commands/play.js
const { SlashCommandBuilder } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioResource,
  demuxProbe,
  AudioPlayerStatus,
} = require("@discordjs/voice");
const playdl = require("play-dl");
const ytdl = require("@distube/ytdl-core");
const ffmpeg = require("ffmpeg-static");
const { ensureQueue, getQueue } = require("../music/state");

// FFmpeg path (Windows-friendly)
if (ffmpeg && !process.env.FFMPEG_PATH) {
  process.env.FFMPEG_PATH = ffmpeg;
  console.log("🎛️ FFMPEG_PATH configurado via ffmpeg-static");
}

// === Config global de cookie/UA ===
const YT_COOKIE = process.env.YT_COOKIE || "";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

if (YT_COOKIE) {
  try {
    playdl.setToken({ youtube: { cookie: YT_COOKIE } });
    console.log("🍪 YT_COOKIE aplicado no play-dl");
  } catch (e) {
    console.warn("⚠️ Falha ao setar YT_COOKIE no play-dl:", e?.message);
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Toca música do YouTube")
    .addStringOption((option) =>
      option.setName("query").setDescription("URL ou nome da música").setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const query = interaction.options.getString("query");
    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel) return interaction.editReply("❌ Você precisa estar em um canal de voz!");

    const url = await resolveUrl(query);
    if (!url) return interaction.editReply("⚠️ Não encontrei resultado. Tente outro link ou termo.");

    let title = url;
    try {
      const info = await playdl.video_basic_info(url);
      title = info?.video_details?.title || title;
    } catch {}

    const q = ensureQueue(interaction.guild.id);
    q.textChannelId = interaction.channelId;
    q.songs.push({ url, title });

    if (!q.connection) {
      q.connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });
      q.connection.subscribe(q.player);
      void playSong(interaction.guild.id, interaction);
    }

    return interaction.editReply(`🎶 Adicionado: **${title}**`);
  },
};

// ===== Helpers =====

async function playSong(guildId, interaction) {
  const q = getQueue(guildId);
  if (!q) return;

  if (q.songs.length === 0) {
    try { q.connection?.destroy(); } catch {}
    q.current = null;
    return;
  }

  const next = q.songs.shift();
  if (!next?.url) return playSong(guildId, interaction);

  const { url, title } = next;

  try {
    // 1) play-dl via info
    try {
      const info = await playdl.video_info(url);
      const s1 = await playdl.stream_from_info(info, { quality: 2 });
      console.log("▶️ Usando play-dl (via info)");
      return startPlayback(q, createAudioResource(s1.stream, { inputType: s1.type }), { url, title }, guildId, interaction);
    } catch (e) {
      console.warn("⚠️ play-dl (via info) falhou:", e?.message);
    }

    // 2) play-dl direto
    try {
      const s2 = await playdl.stream(url, { quality: 2 });
      console.log("▶️ Usando play-dl (direto)");
      return startPlayback(q, createAudioResource(s2.stream, { inputType: s2.type }), { url, title }, guildId, interaction);
    } catch (e) {
      console.warn("⚠️ play-dl (direto) falhou:", e?.message);
    }

    // 3) ytdl-core com cookie + UA
    if (!ytdl.validateURL(url)) throw new Error("URL inválida pro ytdl-core");

    const ytdlStream = ytdl(url, {
      filter: "audioonly",
      quality: "highestaudio",
      highWaterMark: 1 << 25,
      dlChunkSize: 0,
      requestOptions: {
        headers: {
          "User-Agent": UA,
          "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
          "Referer": "https://www.youtube.com",
          "Cookie": YT_COOKIE,
        },
      },
    });

    const probe = await demuxProbe(ytdlStream);
    console.log("▶️ Usando ytdl-core");
    return startPlayback(q, createAudioResource(probe.stream, { inputType: probe.type }), { url, title }, guildId, interaction);

  } catch (err) {
    console.error("❌ Erro geral ao tocar:", err);
    await interaction.followUp("⚠️ Não consegui tocar essa música. Pulando…").catch(() => {});
    return playSong(guildId, interaction);
  }
}

function startPlayback(q, resource, track, guildId, interaction) {
  q.current = track;
  q.player.play(resource);

  const onPlaying = () => {
    interaction.followUp(`▶ Tocando agora: **${track.title}**`).catch(() => {});
    q.player.off(AudioPlayerStatus.Playing, onPlaying);
  };
  q.player.on(AudioPlayerStatus.Playing, onPlaying);

  const onIdle = () => {
    q.player.off(AudioPlayerStatus.Idle, onIdle);
    playSong(guildId, interaction);
  };
  q.player.on(AudioPlayerStatus.Idle, onIdle);
}

async function resolveUrl(query) {
  try {
    const kind = playdl.yt_validate(query);
    if (kind === "video") return query;

    if (kind === "playlist") {
      const pl = await playdl.playlist_info(query, { incomplete: true });
      return pl?.videos?.[0]?.url || null;
    }

    const results = await playdl.search(query, { source: { youtube: "video" }, limit: 1 });
    return results?.[0]?.url || null;
  } catch (e) {
    console.error("resolveUrl falhou:", e?.message, "query:", query);
    return null;
  }
}
