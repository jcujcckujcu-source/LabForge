# LabGen — Генератор лабораторных работ по C#

Платформа для автоматической генерации лабораторных работ по C# в формате DOCX (ГОСТ) с кодом, скриншотами IDE и консоли, контрольными вопросами.

## Быстрый старт

### 1. Установить зависимости

```bash
npm install
```

### 2. Добавить API-ключ

Открой `apps/web/.env.local` и вставь ключ OpenRouter:

```env
OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxxxxxxxxxx
```

Ключ получить на: https://openrouter.ai/keys  
Модель по умолчанию: `google/gemini-2.5-pro`

### 3. Запустить

```bash
npm run dev
```

Открыть: http://localhost:3000

---

## Структура проекта

```
lab-gen/
├── apps/
│   └── web/                    # Next.js 16 (фронт + API routes)
│       ├── app/
│       │   ├── page.tsx         # Главная страница (UI)
│       │   ├── layout.tsx       # Root layout + SEO
│       │   ├── globals.css      # Глобальные стили
│       │   └── api/generate/
│       │       └── route.ts     # POST /api/generate (основной пайплайн)
│       └── next.config.ts
├── packages/
│   ├── llm-client/             # Клиент OpenRouter + Zod-валидация
│   │   └── src/
│   │       ├── schema.ts        # LabStructureSchema (Zod)
│   │       ├── client.ts        # generateLabStructure()
│   │       └── index.ts
│   ├── image-gen/              # Генерация скриншотов без браузера
│   │   ├── fonts/
│   │   │   └── JetBrainsMono-Regular.ttf
│   │   └── src/
│   │       ├── highlight.ts     # Shiki → TokenLine[]
│   │       ├── ide-template.ts  # React.createElement → VS2022 editor
│   │       ├── console-template.ts  # React.createElement → CMD window
│   │       ├── render.ts        # Satori → SVG → Resvg → PNG buffer
│   │       ├── generate-screenshots.ts  # Фабрика
│   │       └── index.ts
│   └── doc-gen/                # Сборщик .docx
│       └── src/
│           ├── build-docx.ts   # buildLabReport() → Buffer
│           └── index.ts
└── package.json                # npm workspaces
```

## Пайплайн генерации

```
POST /api/generate { topic, meta? }
        │
        ▼
  LLM (OpenRouter)           ← google/gemini-2.5-pro
  generateLabStructure()
        │
        ├─ lab.code           → Shiki tokenize
        │                     → Satori (IDE template JSX)
        │                     → Resvg → idePng (Buffer)
        │
        └─ lab.consoleOutput  → Satori (Console template JSX)
                              → Resvg → consolePng (Buffer)
                                    │
                                    ▼
                             docx.Document builder
                             Packer.toBuffer()
                                    │
                                    ▼
                     Response: application/vnd...docx
```

## Кастомизация

### Данные титульного листа

В форме есть аккордеон "Данные титульного листа" — можно заполнить вуз, кафедру, студента, группу, преподавателя и город.

### Модель LLM

В `packages/llm-client/src/client.ts` поменяй `model`:

```ts
model: "anthropic/claude-sonnet-4"   // или
model: "google/gemini-2.5-pro"
model: "openai/gpt-4o"
```

### Шрифт рендера

Файл `packages/image-gen/fonts/JetBrainsMono-Regular.ttf` — можно заменить любым TTF.

## Деплой на Vercel

```bash
# 1. Push в GitHub
# 2. Import в Vercel
# 3. Root Directory: apps/web
# 4. Environment variables: OPENROUTER_API_KEY=...
```

> ⚠️ На Vercel лимит выполнения функции — 60s (Pro) / 25s (Hobby).  
> Gemini-2.5-pro обычно отвечает за 5-15 секунд, рендер PNG — 2-4 сек.

## Зависимости (ключевые)

| Пакет | Роль |
|-------|------|
| `shiki` | Подсветка синтаксиса C# → токены |
| `satori` | React-элементы → SVG (без DOM) |
| `@resvg/resvg-js` | SVG → PNG buffer (нативный, Node.js) |
| `docx` | Сборка .docx с изображениями |
| `zod` | Валидация JSON-ответа LLM |
| `next` 16 | App Router + API routes |
