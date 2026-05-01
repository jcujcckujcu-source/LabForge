import { z } from "zod";

export const TaskSchema = z.object({
  number: z.number().int().positive(),
  title: z.string(),
  description: z.string(),
  /** Полный рабочий код задания */
  code: z.string(),
  /** Опциональная диаграмма в формате Mermaid */
  diagram: z.string().nullable().optional(),
  /** Пример вывода в консоль */
  output: z.string(),
  /** true — задание предполагает ввод/вывод, нужен скриншот консоли */
  hasConsoleOutput: z.boolean().default(true),
  /** Если ТЗ содержит таблицу вариантов, здесь указывается номер выбранного */
  chosenVariant: z.union([z.number(), z.string()]).nullable().optional(),
});

export const LabStructureSchema = z.object({
  labNumber: z.number(),
  title: z.string(),
  /** Цель работы */
  objective: z.string(),
  language: z.string().optional(),
  /** Задания с решениями */
  tasks: z.array(TaskSchema).min(1),
  /** Контрольные вопросы */
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
