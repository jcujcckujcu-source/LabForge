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

// ─── Global Error Handler ────────────────────────────────────────────────────
app.onError((err, c) => {
  console.error("Global Error:", err);
  return c.json({
    error: `Server Error: ${err.message}`,
  }, 500);
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (c) => c.json({ status: "ok", ts: Date.now() }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.route("/api/auth", auth);
app.route("/api/lab", lab);

export default app;
