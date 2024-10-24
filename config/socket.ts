export default ({ env }) => ({
  enabled: true,
  config: {
    port: env.int("SOCKET_PORT", 1337),
    cors: {
      origin: env("SOCKET_CORS_ORIGIN", "*"),
      methods: ["GET", "POST"],
    },
  },
});
