import { LabStructureSchema, type LabStructure } from "./schema";

// Доступные модели
export const AVAILABLE_MODELS = [
  { id: "google/gemini-2.0-flash", name: "Gemini 2.0 Flash (DIRECT)", description: "Самая быстрая и современная" },
  { id: "google/gemini-1.5-pro", name: "Gemini 1.5 Pro (DIRECT)", description: "Максимальное качество" },
  { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", description: "Самый мощный интеллект (v2)" },
  { id: "openai/gpt-4o", name: "GPT-4o", description: "Флагманская модель OpenAI" },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", description: "Быстрая и надежная" },
  { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B", description: "Мощная открытая модель" },
] as const;

const DEFAULT_MODEL = AVAILABLE_MODELS[0].id;

// Доступные языки и дисциплины
export const SUPPORTED_LANGUAGES = [
  { id: "csharp", name: "C#", label: "C#", ext: "cs" },
  { id: "python", name: "Python", label: "Python", ext: "py" },
  { id: "java", name: "Java", label: "Java", ext: "java" },
  { id: "cpp", name: "C++", label: "C++", ext: "cpp" },
  { id: "networks", name: "Компьютерные системы (Сети)", label: "Комп. системы", ext: "txt" },
] as const;

export type LanguageId = typeof SUPPORTED_LANGUAGES[number]["id"];

const SYSTEM_PROMPT = `Ты — экспертный преподаватель и системный архитектор в области компьютерных сетей и ИТ-инфраструктуры.
Твоя задача — генерировать безупречные отчеты по лабораторным и практическим работам.

### ПРОФИЛИ ГЕНЕРАЦИИ:

1. **ПРОГРАММИРОВАНИЕ (C#, Python и др.):**
   - Современные стандарты, интерактивный код (ввод/вывод).
   - Поле "output" — лог работы программы.

2. **КОМПЬЮТЕРНЫЕ СЕТИ И СИСТЕМЫ:**
   - **Классификация**: Обязательно классифицируй сеть по масштабу, функционалу, топологии, среде и технологиям.
   - **Стандарты**: Используй реальные спецификации (1000BASE-T, Wi-Fi 6, Cat 6).
   - **Топология (Поле "diagram")**: ВСЕГДА рисуй схему на Mermaid.js. Используй 'graph TD' или 'graph LR'. Обязательно подписывай узлы: Router[Маршрутизатор], Switch[Коммутатор], PC[Рабочая станция].
   - **Техническое решение (Поле "code")**: Пиши конфиги оборудования или таблицы IP-адресов.
   - **Сводный анализ**: Делай сводные таблицы классификации и рекомендации по улучшению.

### ОБЩИЕ ПРАВИЛА:
- Стиль: Профессиональный, технический, без «воды».
- Язык: Русский.
- Контрольные вопросы: Развернутые ответы (минимум 3 предложения).
- Заключение (conclusion): Резюме о достижении целей.

### JSON-СХЕМА:
{
  "labNumber": <число>,
  "title": "Тема",
  "objective": "Цель",
  "language": "название дисциплины",
  "tasks": [
    {
      "number": 1,
      "title": "Задание",
      "description": "Условие и обоснование",
      "code": "Решение/Конфиг",
      "diagram": "Mermaid код",
      "output": "Результат",
      "hasConsoleOutput": true,
      "chosenVariant": null
    }
  ],
  "theoryQuestions": [
    { "question": "Вопрос", "answer": "Ответ" }
  ],
  "conclusion": "Вывод"
}

Минимум 5 заданий и 5 контрольных вопросов.`;

const SYSTEM_TOKEN_GOOGLE = "AIzaSyCpooKXAp4ezfM5Z5AQEFC034vDWdXJtXc";

export async function generateLabStructure(
  topic: string,
  apiKey: string,
  labNumber = 1,
  model = DEFAULT_MODEL,
  studentName?: string,
  language: LanguageId = "csharp",
  onProgress?: (msg: string) => void
): Promise<LabStructure> {
  const langLabel = SUPPORTED_LANGUAGES.find(l => l.id === language)?.label ?? language;
  
  const userPrompt = `Сгенерируй лабораторную работу №${labNumber} на языке ${langLabel} по теме: "${topic}".
${studentName ? `Студент: ${studentName}. ` : ""}
Убедись, что код ${langLabel} интерактивный и содержит комментарии.
В конце каждого фрагмента кода добавь комментарий с фамилией студента${studentName ? `: ${studentName}` : ""}.
Сгенерируй 5 разнообразных заданий и 5 контрольных вопросов.`;

  // Список моделей для попыток
  const modelsToTry = [
    model,
    ...AVAILABLE_MODELS.map(m => m.id).filter(id => id !== model)
  ];

  let lastError: Error | null = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const currentModel = modelsToTry[i];
    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount < maxRetries) {
      try {
        console.log(`[llm-client] Attempting generation with model: ${currentModel} (Retry: ${retryCount})`);
        
        // ВЫБОР ДВИЖКА (Google Direct vs OpenRouter)
        const isGoogleModel = currentModel.startsWith("google/");
        const effectiveApiKey = (apiKey.startsWith("AIzaSy") || (isGoogleModel && !apiKey.startsWith("sk-or"))) 
          ? (apiKey.startsWith("AIzaSy") ? apiKey : SYSTEM_TOKEN_GOOGLE)
          : apiKey;

        const isDirectGoogle = effectiveApiKey.startsWith("AIzaSy");
        
        let res: Response;
        
        if (isDirectGoogle) {
          // Прямой запрос к Google AI Studio
          const modelName = currentModel.split("/")[1] || "gemini-1.5-pro";
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${effectiveApiKey}`;
          
          res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: userPrompt }] }],
              systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 8000,
                responseMimeType: "application/json"
              }
            })
          });
        } else {
          // Запрос через OpenRouter
          res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${effectiveApiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://lab-gen.pages.dev",
              "X-Title": "LabForge",
            },
            body: JSON.stringify({
              model: currentModel,
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userPrompt },
              ],
              response_format: currentModel.includes("claude") ? undefined : { type: "json_object" },
              temperature: 0.7,
              max_tokens: 4500,
            }),
          });
        }

        if (res.status === 429) {
          retryCount++;
          await new Promise(r => setTimeout(r, retryCount * 2000));
          continue;
        }

        const resText = await res.text();

        if (!res.ok) {
          console.error(`[llm-client] Failed with ${res.status}: ${resText}`);
          throw new Error(`API Error (${res.status})`);
        }

        let content = "";
        if (isDirectGoogle) {
          const data = JSON.parse(resText);
          content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        } else {
          const data = JSON.parse(resText);
          content = data.choices?.[0]?.message?.content || "";
        }

        if (!content) throw new Error("Пустой ответ от ИИ");

        let parsed: any;
        try {
          const clean = content
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/```\s*$/, "")
            .trim();
          parsed = JSON.parse(clean);
          parsed.language = parsed.language || langLabel;
          parsed.languageId = language;
        } catch {
          throw new Error(`Невалидный JSON от ${currentModel}`);
        }

        return LabStructureSchema.parse(parsed);

      } catch (err: any) {
        lastError = err;
        console.error(`[llm-client] Error with ${currentModel}: ${err.message}`);
        break; // Пробуем следующую модель
      }
    }
  }

  throw lastError || new Error("Все модели недоступны.");
}
