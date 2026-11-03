import "dotenv/config";
import connectPgSimple from "connect-pg-simple";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import session from "express-session";
import { Pool } from "pg";
import helmet from "helmet";
import { authRouter } from "./routes/auth.js";
import { cargosRouter } from "./routes/cargos.js";
import { tripsRouter } from "./routes/trips.js";
import { trucksRouter } from "./routes/trucks.js";
import { errorHandler } from "./middleware/errors.js";

const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret || sessionSecret.length < 32) {
  throw new Error("SESSION_SECRET must be configured with at least 32 characters.");
}
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be configured.");
}

const pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
const PgSessionStore = connectPgSimple(session);
const app = express();

app.disable("x-powered-by");
app.set("trust proxy", process.env.NODE_ENV === "production" ? 1 : false);
app.use(helmet());
app.use(cors({ origin: clientOrigin, credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use((request, response, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    next();
    return;
  }
  const origin = request.get("origin");
  if (origin && origin !== clientOrigin) {
    response.status(403).json({ error: "So'rov manbasi ruxsat etilmagan." });
    return;
  }
  next();
});
app.use(session({
  name: "yukbor.sid",
  secret: sessionSecret,
  store: new PgSessionStore({
    pool: pgPool,
    tableName: "user_sessions",
    createTableIfMissing: true,
    pruneSessionInterval: 15 * 60,
  }),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
}));

app.get("/api/v1/health", (_request, response) => {
  response.json({ status: "ok" });
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Urinishlar soni oshdi. Birozdan so'ng qayta urinib ko'ring." },
});
app.use("/api/v1/auth/login", loginLimiter);
app.use("/api/v1/auth/register", loginLimiter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/cargos", cargosRouter);
app.use("/api/v1/trucks", trucksRouter);
app.use("/api/v1/trips", tripsRouter);
app.use((_request, response) => {
  response.status(404).json({ error: "API manzili topilmadi." });
});
app.use(errorHandler);

export { app, pgPool };
