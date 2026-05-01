"use client";

import { generateTaskScreenshots, initializeResvg } from "@lab-gen/image-gen";
import { buildLabReport, DEFAULT_META } from "@lab-gen/doc-gen";
import { SUPPORTED_LANGUAGES } from "@lab-gen/llm-client";

/**
 * Клиент для работы с LabForge Worker API.
 */

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL ?? "http://localhost:8787";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuthPayload {
  token: string;
  userId: string;
}

export interface RegisterBody {
  username: string;
  apiToken: string;
  password: string;
  telegram?: string;
  vk?: string;
  referralCode?: string;
}

export interface LabReport {
  id: string;
  topic: string;
  lab_number: number;
  r2_key: string | null;
  created_at: string;
}

export interface GenerateBody {
  topic: string;
  labNumber: number;
  language?: string;
  model?: string;
  meta?: {
    university?: string;
    department?: string;
    student?: string;
    group?: string;
    teacher?: string;
    city?: string;
  };
}

export interface GenerateResult {
  reportId: string;
  title: string;
  r2Key: string;
  createdAt: string;
}

// ─── Token storage ────────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("labgen_user");
  if (!stored) return null;
  try {
    const user = JSON.parse(stored);
    return user.token;
  } catch {
    return null;
  }
}

export function setToken(token: string, userId?: string): void {
  const stored = localStorage.getItem("labgen_user");
  let user = stored ? JSON.parse(stored) : {};
  user = { ...user, token, userId: userId ?? user.userId };
  localStorage.setItem("labgen_user", JSON.stringify(user));
}

export function clearToken(): void {
  localStorage.removeItem("labgen_user");
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  withAuth = true
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (withAuth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${WORKER_URL}${path}`, { ...options, headers });
  const data = await res.json() as Record<string, unknown>;

  if (!res.ok) {
    const errorMsg = (data["error"] as string | undefined) ?? `HTTP ${res.status}`;
    const details = data["details"] ? JSON.stringify(data["details"]) : "";
    const error = new Error(errorMsg);
    (error as any).details = data["details"];
    throw error;
  }

  return data as T;
}

// ─── Auth endpoints ───────────────────────────────────────────────────────────

export async function register(body: RegisterBody): Promise<AuthPayload> {
  return apiFetch<AuthPayload>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  }, false);
}

export async function login(credentials: { apiToken?: string; username?: string; password?: string }): Promise<AuthPayload> {
  return apiFetch<AuthPayload>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  }, false);
}

export async function getProfile(): Promise<{ id: string; generations_left: number; referral_code: string; api_token: string }> {
  return apiFetch<{ id: string; generations_left: number; referral_code: string; api_token: string }>("/api/auth/me");
}

export async function updateApiToken(apiToken: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>("/api/auth/update-token", {
    method: "POST",
    body: JSON.stringify({ apiToken }),
  });
}

export async function redeemPromo(code: string): Promise<{ success: boolean; credits: number }> {
  return apiFetch<{ success: boolean; credits: number }>("/api/lab/redeem-promo", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

// ─── Base64 Helper (Safe for large files) ─────────────────────────────────────

function bufferToBase64(buffer: Buffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// ─── Lab endpoints ────────────────────────────────────────────────────────────

export async function generateJson(
  body: GenerateBody,
  onLog?: (msg: string) => void
): Promise<any> {
  const log = (msg: string) => onLog?.(msg);
  log("Запрос к LLM: генерация структуры лабораторной...");
  return apiFetch<any>("/api/lab/generate-json", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function finalizeLab(
  labJson: any,
  meta: GenerateBody["meta"],
  onLog?: (msg: string) => void
): Promise<GenerateResult> {
  const log = (msg: string) => onLog?.(msg);
  log("Инициализация графического движка...");

  // 2. Инициализируем WASM и шрифт на клиенте
  const [wasmRes, fontRes] = await Promise.all([
    fetch("/assets/resvg.wasm"),
    fetch("/assets/JetBrainsMono-Regular.ttf"),
  ]);
  
  await initializeResvg(await wasmRes.arrayBuffer());
  const fontData = await fontRes.arrayBuffer();

  // 3. Генерируем скриншоты и DOCX прямо в браузере
  log(`Рендеринг скриншотов для ${labJson.tasks.length} заданий...`);
  
  // Определяем расширение для рендера
  const langId = (labJson.languageId || "csharp") as any;
  const extension = SUPPORTED_LANGUAGES.find(l => l.id === langId)?.ext || "cs";

  const screenshots = await generateTaskScreenshots(labJson.tasks as any, fontData, extension);
  
  log("Сборка документа DOCX по ГОСТу...");
  const docBuffer = await buildLabReport(labJson, screenshots, { ...DEFAULT_META, ...meta });
  
  const base64 = bufferToBase64(docBuffer);

  log("Синхронизация с сервером и сохранение в R2...");
  return apiFetch<GenerateResult>("/api/lab/save", {
    method: "POST",
    body: JSON.stringify({
      labJson,
      docBase64: base64
    }),
  });
}

export async function generateLab(
  body: GenerateBody,
  onLog?: (msg: string) => void
): Promise<GenerateResult> {
  const labJson = await generateJson(body, onLog);
  return finalizeLab(labJson, body.meta, onLog);
}

export async function getHistory(): Promise<{ reports: LabReport[] }> {
  return apiFetch<{ reports: LabReport[] }>("/api/lab/history");
}

export async function downloadLab(reportId: string): Promise<void> {
  const token = getToken();
  try {
    const res = await fetch(`${WORKER_URL}/api/lab/download/${reportId}`, {
      headers: { Authorization: `Bearer ${token ?? ""}` },
    });

    if (!res.ok) {
      let errorMessage = `HTTP ${res.status}`;
      try {
        const data = await res.json() as { error?: string };
        errorMessage = data.error || errorMessage;
      } catch { /* ignore parse error */ }
      throw new Error(errorMessage);
    }

    const blob = await res.blob();
    const disp = res.headers.get("Content-Disposition") ?? "";
    const m = disp.match(/filename\*?=(?:UTF-8'')?([^;]+)/i);
    const filename = m ? decodeURIComponent(m[1].replace(/['"]/g, "")) : "lab.docx";

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err: any) {
    console.error("Download failed:", err);
    throw new Error(`Ошибка при скачивании: ${err.message}`);
  }
}
