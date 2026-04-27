import { z } from "zod";

export const TaskSchema = z.object({
  number: z.number().int().positive(),
  title: z.string(),
  description: z.string(),
  /** Полный рабочий код задания на C# */
  code: z.string(),
  /** Пример вывода в консоль */
  output: z.string(),
  /** true — задание предполагает ввод/вывод, нужен скриншот консоли */
  hasConsoleOutput: z.boolean().default(true),
  /** Если ТЗ содержит таблицу вариантов, здесь указывается номер выбранного */
  chosenVariant: z.number().int().positive().nullable().optional(),
});

export const LabStructureSchema = z.object({
  labNumber: z.number().int().positive().default(1),
  title: z.string().min(1),
  /** Цель работы — 2 предложения */
  objective: z.string().min(1),
  /** Задания с решениями (min 5) */
  tasks: z.array(TaskSchema).min(5),
  /** Контрольные вопросы — строго столько, сколько указано в ТЗ */
  theoryQuestions: z.array(
    z.object({
      question: z.string().min(1),
      /** Развёрнутый ответ с теоретическим объяснением */
      answer: z.string().min(1),
    })
  ).min(1),
  /** Обязательный раздел «Вывод» в конце отчёта */
  conclusion: z.string().min(1),
});

export type LabTask = z.infer<typeof TaskSchema>;
export type LabStructure = z.infer<typeof LabStructureSchema>;
