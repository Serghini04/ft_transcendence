// app.js
import Fastify from "fastify";
import gameRoutes from "./routes/game.routes.js";

const app = Fastify({
  logger: true,
});

app.register(gameRoutes, { prefix: "/api-games" });

export default app;
