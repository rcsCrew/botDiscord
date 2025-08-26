// /bot/events/clientReady.js
module.exports = {
  name: "clientReady", // v15+ safe
  once: true,
  execute(client) {
    console.log(`✅ Bot logado como ${client.user.tag}`);
  },
};
