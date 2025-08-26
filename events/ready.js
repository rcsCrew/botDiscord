module.exports = {
  name: "clientReady",
  once: true,
  execute(client) {
    console.log(`✅ Bot logado como ${client.user.tag}`);
  },
};
