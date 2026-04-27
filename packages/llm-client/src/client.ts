import { LabStructureSchema, type LabStructure } from "./schema";

// Экономная и быстрая модель (free-tier OpenRouter).
// Смени здесь если нужна другая: "google/gemini-2.5-pro", "anthropic/claude-haiku-4-5"
const DEFAULT_MODEL = "google/gemini-2.0-flash-001";

const SYSTEM_PROMPT = `Ты — генератор лабораторных работ по программированию на C#.
Возвращай ТОЛЬКО валидный JSON без markdown-обёрток, без пояснений, без \`\`\`.

СТРОГО следуй всем ПРАВИЛАМ ГЕНЕРАЦИИ:

1. НИКАКОГО отдельного раздела «Пример программы» — если его нет в ТЗ, не добавляешь.
2. ТЕОРИЯ — НЕ отдельным разделом, а ТОЛЬКО в развёрнутых ответах на контрольные вопросы (theoryQuestions[].answer).
3. Для КАЖДОГО задания выдаётся отдельный скриншот кода в IDE (минимум 5 заданий).
4. Для заданий с вводом/выводом — укажи hasConsoleOutput: true, иначе false.
5. Если ТЗ содержит таблицу вариантов — явно выбери вариант, укажи chosenVariant: N и в коде напиши комментарий «// Я выбрала вариант №N».
6. Контрольных вопросов строго столько, сколько в ТЗ (обычно 5-10). Не сокращать!
7. В конце отчёта ОБЯЗАТЕЛЕН раздел «Вывод» (conclusion) — 2-3 предложения о том, что было изучено и освоено.
8. Титульный лист: всегда указывай поля «Дата выполнения» и «Оценка» (пустыми для заполнения преподавателем).

JSON-схема:
{
  "labNumber": <число>,
  "title": "Тема лабораторной",
  "objective": "Цель работы — 2 предложения",
  "tasks": [
    {
      "number": 1,
      "title": "Задание 1",
      "description": "Условие задания",
      "code": "Полный рабочий код C# с комментариями",
      "output": "Пример вывода",
      "hasConsoleOutput": true,
      "chosenVariant": null
    }
  ],
  "theoryQuestions": [
    { "question": "Вопрос?", "answer": "Развёрнутый ответ с теорией (3-5 предложений)" }
  ],
  "conclusion": "Вывод по лабораторной работе — 2-3 предложения"
}
Дополнительные правила:
- tasks: ровно 5 заданий, код 15-25 строк
- Код C# должен быть рабочим, с using, namespace, class Program, static void Main
- Весь текст на русском языке
- chosenVariant: null если вариант не применяется`;

export async function generateLabStructure(
  topic: string,
  apiKey: string,
  labNumber = 1,
  model = DEFAULT_MODEL
): Promise<LabStructure> {
  const userPrompt = `Создай лабораторную работу №${labNumber} по C# на тему: "${topic}".
Строго верни JSON по схеме. Без лишнего текста.
Помни: теория ТОЛЬКО в ответах на контрольные вопросы, 5 заданий, раздел «Вывод» обязателен.`;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
      max_tokens: 4500,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter API error ${res.status}: ${errText}`);
  }

  const data = await res.json() as {
    choices: Array<{ message: { content: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Пустой ответ LLM");

  let parsed: unknown;
  try {
    const clean = content
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();
    parsed = JSON.parse(clean);
  } catch {
    throw new Error(`LLM вернул невалидный JSON: ${content.slice(0, 300)}`);
  }

  return LabStructureSchema.parse(parsed);
}
