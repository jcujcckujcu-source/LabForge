/**
 * Hono auth routes:
 *   POST /api/auth/register — создать пользователя
 *   POST /api/auth/login    — войти / обновить данные
 */

import { Hono } from "hono";
import { z } from "zod";
import { signJwt } from "../lib/jwt";
import { createUser, getUserByToken } from "../lib/d1";
import type { CloudflareEnv } from "../index";

// JWT живёт 7 дней (согласно новым требованиям)
const JWT_TTL_SECONDS = 60 * 60 * 24 * 7;

// ─── Validation schemas ───────────────────────────────────────────────────────

const RegisterSchema = z.object({
  apiToken: z.string().min(10, "API-токен слишком короткий"),
  contactType: z.enum(["telegram", "vk"]).optional(),
  contactLink: z.string().url("Некорректная ссылка").optional().or(z.literal("")),
});

const LoginSchema = z.object({
  apiToken: z.string().min(10),
});

// ─── Router ───────────────────────────────────────────────────────────────────

type Env = { Bindings: CloudflareEnv };
const auth = new Hono<Env>();

// ── POST /api/auth/register ───────────────────────────────────────────────────
auth.post("/register", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.errors[0]?.message ?? "Validation error" }, 400);
  }

  const { apiToken, contactType, contactLink } = parsed.data;

  // 1. Проверка API-ключа в OpenRouter
  const orRes = await fetch("https://openrouter.ai/api/v1/auth/key", {
    headers: { "Authorization": `Bearer ${apiToken}` }
  });

  if (orRes.status === 401) {
    return c.json({ error: "Неверный API-ключ" }, 401);
  }

  // 2. Проверяем — нет ли уже пользователя с этим токеном
  const existing = await getUserByToken(c.env.DB, apiToken);
  if (existing) {
    return c.json({ error: "Пользователь с таким API-токеном уже существует. Используйте /login." }, 409);
  }

  // 3. Создаем пользователя
  const userData: any = { apiToken };
  if (contactType === "telegram") userData.telegram = contactLink;
  if (contactType === "vk") userData.vk = contactLink;

  const user = await createUser(c.env.DB, userData);

  if (!user) {
    return c.json({ error: "Не удалось создать пользователя" }, 500);
  }

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
    return c.json({ error: "Некорректный API-токен" }, 400);
  }

  const { apiToken } = parsed.data;

  const user = await getUserByToken(c.env.DB, apiToken);

  if (!user) {
    return c.json({ error: "Пользователь не найден. Сначала зарегистрируйтесь." }, 404);
  }

  const token = await signJwt(
    { sub: user.id, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + JWT_TTL_SECONDS },
    c.env.JWT_SECRET
  );

  return c.json({ token, userId: user.id, generations_left: user.generations_left });
});

export default auth;
