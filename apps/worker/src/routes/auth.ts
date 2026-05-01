/**
 * Hono auth routes:
 *   POST /api/auth/register — создать пользователя
 *   POST /api/auth/login    — войти / обновить данные
 *   GET  /api/auth/me       — текущий профиль
 */

import { Hono } from "hono";
import { z } from "zod";
import { signJwt } from "../lib/jwt";
import { createUser, getUserByToken } from "../lib/d1";
import { requireAuth, type AuthEnv } from "../middleware/auth";

// JWT живёт 7 дней (согласно новым требованиям)
const JWT_TTL_SECONDS = 60 * 60 * 24 * 7;

// ─── Validation schemas ───────────────────────────────────────────────────────

const RegisterSchema = z.object({
  username: z.string().min(3, "Имя пользователя слишком короткое"),
  apiToken: z.string().min(10, "API-токен слишком короткий"),
  password: z.string().min(4, "Пароль слишком короткий"),
  contactType: z.enum(["telegram", "vk"]).optional(),
  contactLink: z.string().url("Некорректная ссылка").optional().or(z.literal("")),
  referralCode: z.string().optional(),
});

const LoginSchema = z.object({
  username: z.string().optional(),
  password: z.string().optional(),
  apiToken: z.string().optional(),
});

const UpdateTokenSchema = z.object({
  apiToken: z.string().min(10),
});

// ─── Router ───────────────────────────────────────────────────────────────────

const auth = new Hono<AuthEnv>();

// ── POST /api/auth/register ───────────────────────────────────────────────────
auth.post("/register", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.errors[0]?.message ?? "Validation error" }, 400);
  }

  const { username, apiToken, password, contactType, contactLink } = parsed.data;

  // 0. Проверка пароля в telegram_users
  const tgUser = await c.env.DB.prepare(
    "SELECT * FROM telegram_users WHERE username = ? AND password = ? LIMIT 1"
  ).bind(username, password).first<{ chat_id: string }>();

  if (!tgUser) {
    return c.json({ error: "Неверный логин или пароль. Сначала установите пароль в боте: /password" }, 401);
  }

  // 1. Проверка API-ключа в OpenRouter
  const orRes = await fetch("https://openrouter.ai/api/v1/auth/key", {
    headers: { "Authorization": `Bearer ${apiToken}` }
  });

  if (orRes.status === 401) {
    const orText = await orRes.text();
    if (orText.includes("User not found")) {
      return c.json({ error: "OpenRouter: Пользователь не найден. Проверьте баланс или создайте новый токен." }, 401);
    }
    return c.json({ error: "Неверный API-ключ OpenRouter" }, 401);
  }

  // 2. Проверяем — нет ли уже пользователя с этим токеном или этим Telegram ID
  const existingToken = await getUserByToken(c.env.DB, apiToken);
  if (existingToken) {
    return c.json({ error: "Пользователь с таким API-токеном уже существует. Используйте /login." }, 409);
  }

  const existingTg = await c.env.DB.prepare("SELECT id FROM users WHERE telegram_id = ?")
    .bind(tgUser.chat_id).first();
  if (existingTg) {
    return c.json({ error: "К вашему Telegram-аккаунту уже привязан профиль LabForge. Используйте /login." }, 409);
  }

  // 3. Создаем пользователя
  const userData: any = { 
    username, 
    apiToken, 
    password, 
    telegramId: tgUser.chat_id, 
    referralCode: parsed.data.referralCode 
  };
  if (contactType === "telegram") userData.telegram = contactLink;
  if (contactType === "vk") userData.vk = contactLink;

  const user = await createUser(c.env.DB, userData);

  if (!user) {
    return c.json({ error: "Не удалось создать пользователя" }, 500);
  }

  // 4. (Опционально) очистка временных данных не требуется, так как пароль постоянный
  // await c.env.DB.prepare("DELETE FROM registration_codes WHERE code = ?").run();

  const token = await signJwt(
    { sub: user.id, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + JWT_TTL_SECONDS },
    c.env.JWT_SECRET
  );

  return c.json({ token, userId: user.id, generations_left: user.generations_left }, 201);
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
auth.post("/login", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Некорректные данные для входа" }, 400);
  }

  const { apiToken, username, password } = parsed.data;

  let user;
  if (apiToken) {
    user = await getUserByToken(c.env.DB, apiToken);
  } else if (username && password) {
    user = await c.env.DB.prepare("SELECT * FROM users WHERE username = ? AND password = ?")
      .bind(username, password).first() as any;
  }

  if (!user) {
    return c.json({ error: "Пользователь не найден или пароль неверный." }, 404);
  }

  const token = await signJwt(
    { sub: user.id, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + JWT_TTL_SECONDS },
    c.env.JWT_SECRET
  );

  return c.json({ token, userId: user.id, generations_left: user.generations_left });
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
auth.get("/me", requireAuth, async (c) => {
  const userId = c.get("userId");
  const user = await c.env.DB.prepare(
    "SELECT id, telegram, vk, generations_left, referral_code, api_token FROM users WHERE id = ?"
  ).bind(userId).first();
  
  if (!user) return c.json({ error: "Not found" }, 404);
  return c.json(user);
});

// ── POST /api/auth/update-token ───────────────────────────────────────────────
auth.post("/update-token", requireAuth, async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json().catch(() => null);
  const parsed = UpdateTokenSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid token format" }, 400);

  const { apiToken } = parsed.data;

  // Verify key
  const orRes = await fetch("https://openrouter.ai/api/v1/auth/key", {
    headers: { "Authorization": `Bearer ${apiToken}` }
  });
  if (!orRes.ok) return c.json({ error: "Невалидный API-ключ" }, 401);

  await c.env.DB.prepare("UPDATE users SET api_token = ? WHERE id = ?")
    .bind(apiToken, userId)
    .run();

  return c.json({ success: true });
});

export default auth;
