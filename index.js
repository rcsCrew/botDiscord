// /bot/index.js
require("dotenv").config();
const { Client, GatewayIntentBits, Collection, REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");

// ===== CLIENT CONFIG =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.commands = new Collection();

// ===== LOAD COMMANDS =====
const commands = [];
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
    console.log(`🔹 Carregado comando: ${command.data.name}`);
  } else {
    console.warn(`⚠️ Comando ${file} ignorado (faltando data ou execute).`);
  }
}

// ===== REGISTER SLASH COMMANDS =====
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("🔄 Registrando comandos slash...");

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, "1405589788798746775"),
      { body: commands }
    );

    console.log("✅ Slash registrados com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao registrar slash:", error);
  }
})();

// ===== LOAD EVENTS =====
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));

for (const file of eventFiles) {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

// ===== LOGIN =====
if (!process.env.TOKEN) {
  console.error("❌ Nenhum token encontrado no .env!");
  process.exit(1);
}

client.login(process.env.TOKEN);
