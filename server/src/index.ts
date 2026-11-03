import { app, pgPool } from "./app.js";
import { prisma } from "./db.js";

const port = Number(process.env.PORT ?? 4000);
const server = app.listen(port, () => {
  console.log(`YUKBOR API listening on http://localhost:${port}`);
});

async function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    await pgPool.end();
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
