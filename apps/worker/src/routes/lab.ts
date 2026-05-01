import { Hono } from "hono";
import { z } from "zod";
import { requireAuth, type AuthEnv } from "../middleware/auth";
import { generateLabStructure } from "@lab-gen/llm-client";

const lab = new Hono<AuthEnv>();

// Схемы валидации
const GenerateSchema = z.object({
  topic: z.string().min(1).max(2000),
  labNumber: z.any().optional(),
  model: z.any().optional(),
  language: z.any().optional(),
  meta: z.any().optional(),
});

const SaveSchema = z.object({
  labJson: z.any(), // Тут можно было бы описать схему LabStructure, но для краткости оставим any в контексте JSON
  docBase64: z.string(),
});

lab.use("*", requireAuth);

// ── 1. Генерируем только структуру (JSON)
lab.post("/generate-json", async (c) => {
  const userId = c.get("userId");
  const rawBody = await c.req.json();
  console.log("[DEBUG_RAW_BODY]", JSON.stringify(rawBody));
  
  // ВРЕМЕННО ОТКЛЮЧАЕМ ВАЛИДАЦИЮ ДЛЯ ТЕСТА
  const body = rawBody as any;
  
  if (!body.topic) {
    return c.json({ error: "Invalid input data: Topic is required", received: rawBody }, 400);
  }
  
  const user = await c.env.DB.prepare(
    "SELECT api_token, generations_left FROM users WHERE id = ? LIMIT 1"
  ).bind(userId).first<{ api_token: string; generations_left: number }>();

  if (!user) return c.json({ error: "User not found" }, 404);
  if (user.generations_left <= 0) {
    return c.json({ error: "No credits left. Please contact admin." }, 403);
  }

  try {
    const labJson = await generateLabStructure(
      body.topic, 
      user.api_token, 
      body.labNumber || 1, 
      body.model,
      body.meta?.student,
      body.language as any,
      (msg) => console.log(`[LLM_PROGRESS] ${msg}`)
    );

    // Списываем кредит
    await c.env.DB.prepare(
      "UPDATE users SET generations_left = generations_left - 1 WHERE id = ?"
    ).bind(userId).run();

    return c.json(labJson);
  } catch (err: any) {
    console.error("[generate-json] error:", err);
    return c.json({ error: err.message }, 502);
  }
});

// ── 1.5. Использование промокода
lab.post("/redeem-promo", async (c) => {
  const userId = c.get("userId");
  const { code } = await c.req.json() as { code: string };
  
  if (!code) return c.json({ error: "Введите код" }, 400);

  const promo = await c.env.DB.prepare(
    "SELECT * FROM promo_codes WHERE code = ? AND used = 0 LIMIT 1"
  ).bind(code).first<{ code: string; credits: number }>();

  if (!promo) return c.json({ error: "Неверный или использованный код" }, 400);

  try {
    await c.env.DB.batch([
      c.env.DB.prepare("UPDATE users SET generations_left = generations_left + ? WHERE id = ?").bind(promo.credits, userId),
      c.env.DB.prepare("UPDATE promo_codes SET used = 1, used_by = ? WHERE code = ?").bind(userId, code)
    ]);
    return c.json({ success: true, credits: promo.credits });
  } catch (err) {
    return c.json({ error: "Database error" }, 500);
  }
});

// ── 2. Сохраняем готовый документ
lab.post("/save", async (c) => {
  const userId = c.get("userId");
  const parse = SaveSchema.safeParse(await c.req.json());
  if (!parse.success) return c.json({ error: "Invalid data" }, 400);

  const { labJson, docBase64 } = parse.data;
  const docBuffer = Uint8Array.from(atob(docBase64), chr => chr.charCodeAt(0));
  
  const safeTitle = `${labJson.labNumber}_${labJson.title}`.replace(/[^\w\u0400-\u04FF]/g, "_").slice(0, 60);
  const r2Key = `reports/${userId}/${Date.now()}_${safeTitle}.docx`;

  await c.env.REPORTS_BUCKET.put(r2Key, docBuffer, {
    httpMetadata: { contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
  });

  const record = await c.env.DB.prepare(
    `INSERT INTO lab_reports (user_id, topic, lab_number, lab_json, r2_key)
     VALUES (?, ?, ?, ?, ?) RETURNING id, created_at`
  ).bind(userId, labJson.title, labJson.labNumber, JSON.stringify(labJson), r2Key)
   .first<{ id: string, created_at: string }>();

  if (!record) return c.json({ error: "Save failed" }, 500);

  // Уведомление в TG
  const tgUser = await c.env.DB.prepare("SELECT telegram_id FROM users WHERE id = ?").bind(userId).first<{telegram_id: string}>();
  if (tgUser?.telegram_id) {
    const MAIN_BOT_TOKEN = "8608070484:AAFzqPh-XYQnkL6dnDKgpFlA9JxLJrHnkFc";
    const text = `✅ *Ваша работа готова!*\n\n📝 Тема: *${labJson.title}*\n\nСкачать можно на сайте.`;
    c.executionCtx.waitUntil(fetch(`https://api.telegram.org/bot${MAIN_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: tgUser.telegram_id, text, parse_mode: "Markdown" }),
    }));
  }

  return c.json({ reportId: record.id, r2Key });
});

lab.get("/history", async (c) => {
  const userId = c.get("userId");
  const { results } = await c.env.DB.prepare(
    "SELECT id, topic, lab_number, created_at FROM lab_reports WHERE user_id = ? ORDER BY created_at DESC"
  ).bind(userId).all();
  return c.json({ reports: results });
});

lab.get("/download/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  
  const report = await c.env.DB.prepare(
    "SELECT r2_key, topic, lab_number FROM lab_reports WHERE id = ? AND user_id = ?"
  ).bind(id, userId).first<{r2_key: string, topic: string, lab_number: number}>();
  
  if (!report) return c.json({ error: "Not found" }, 404);

  const obj = await c.env.REPORTS_BUCKET.get(report.r2_key);
  if (!obj) return c.json({ error: "File missing" }, 404);

  const safeTopic = report.topic.replace(/[^\w\u0400-\u04FF]/g, "_");
  const filename = `Lab${report.lab_number}_${safeTopic}.docx`;

  return new Response(obj.body, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Access-Control-Expose-Headers": "Content-Disposition",
    }
  });
});

export default lab;
