/**
 * Hono lab routes (все защищены requireAuth):
 *   POST /api/lab/generate-json  — только генерация JSON через LLM
 *   POST /api/lab/save           — сохранение готового DOCX в R2 и запись в D1
 *   GET  /api/lab/history        — история пользователя
 *   GET  /api/lab/download/:id   — скачать DOCX из R2
 */

import { Hono } from "hono";
import { z } from "zod";
import { requireAuth, type AuthEnv } from "../middleware/auth";
import { generateLabStructure } from "@lab-gen/llm-client";

const lab = new Hono<AuthEnv>();

lab.use("*", requireAuth);

// ── 1. Генерируем только структуру (JSON)
lab.post("/generate-json", async (c) => {
  console.log("[worker] generate-json hit");
  const userId = c.get("userId");
  const body = await c.req.json();
  
  const user = await c.env.DB.prepare(
    "SELECT api_token FROM users WHERE id = ? LIMIT 1"
  ).bind(userId).first<{ api_token: string }>();

  if (!user) return c.json({ error: "User not found" }, 404);

  try {
    const labJson = await generateLabStructure(
      body.topic, 
      user.api_token, 
      body.labNumber || 1, 
      body.model
    );
    return c.json(labJson);
  } catch (err: any) {
    return c.json({ error: err.message }, 502);
  }
});

// ── 2. Сохраняем готовый документ (Base64)
lab.post("/save", async (c) => {
  const userId = c.get("userId");
  const { labJson, docBase64 } = await c.req.json();

  const docBuffer = Uint8Array.from(atob(docBase64), c => c.charCodeAt(0));
  const safeTitle = `${labJson.labNumber}_${labJson.title}`.replace(/[^\w\u0400-\u04FF]/g, "_").slice(0, 60);
  const r2Key = `reports/${userId}/${Date.now()}_${safeTitle}.docx`;

  await c.env.REPORTS_BUCKET.put(r2Key, docBuffer, {
    httpMetadata: { contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
  });

  const record = await c.env.DB.prepare(
    `INSERT INTO lab_reports (user_id, topic, lab_number, lab_json, r2_key)
     VALUES (?, ?, ?, ?, ?)
     RETURNING id, created_at`
  ).bind(userId, labJson.title, labJson.labNumber, JSON.stringify(labJson), r2Key)
   .first();

  return c.json(record);
});

// ── 3. История
lab.get("/history", async (c) => {
  const userId = c.get("userId");
  const { results } = await c.env.DB.prepare(
    "SELECT id, topic, lab_number, created_at FROM lab_reports WHERE user_id = ? ORDER BY created_at DESC"
  ).bind(userId).all();
  return c.json({ reports: results });
});

// ── 4. Скачивание
lab.get("/download/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const report = await c.env.DB.prepare("SELECT r2_key FROM lab_reports WHERE id = ? AND user_id = ?").bind(id, userId).first<{r2_key:string}>();
  if (!report) return c.json({ error: "Not found" }, 404);

  const obj = await c.env.REPORTS_BUCKET.get(report.r2_key);
  if (!obj) return c.json({ error: "File not found" }, 404);

  return new Response(obj.body, {
    headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }
  });
});

export default lab;
