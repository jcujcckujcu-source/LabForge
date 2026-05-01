import { Hono } from "hono";
import { cors } from "hono/cors";
import auth from "./routes/auth";
import lab from "./routes/lab";

export interface CloudflareEnv {
  DB: D1Database;
  REPORTS_BUCKET: R2Bucket;
  JWT_SECRET: string;
  FRONTEND_URL: string;
}

type Env = { Bindings: CloudflareEnv };

const app = new Hono<Env>();

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use("*", cors({
  origin: (origin) => origin,
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "OPTIONS"],
  maxAge: 86400,
  credentials: true,
}));

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use("*", async (c, next) => {
  if (!c.env.JWT_SECRET) {
    c.env.JWT_SECRET = "local-dev-fallback-secret-key-that-is-long-enough";
  }
  await next();
});

import auth from "./routes/auth";
import lab from "./routes/lab";
import bot from "./routes/bot";
import promoBot from "./routes/promo-bot";

app.route("/api/auth", auth);
app.route("/api/lab", lab);
app.route("/api/bot", bot);
app.route("/api/promo-bot", promoBot);

export default app;
