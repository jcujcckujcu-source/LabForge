import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  PageBreak,
  Paragraph,
  ShadingType,
  TextRun,
  WidthType,
  convertInchesToTwip,
} from "docx";
import type { LabStructure } from "@lab-gen/llm-client";
import type { TaskScreenshot } from "@lab-gen/image-gen";

// ─── Typography helpers ───────────────────────────────────────────────────────

const FONT = "Times New Roman";
const MONO = "Courier New";
const SIZE_BODY = 28;    // 14pt
const SIZE_CODE = 20;    // 10pt
const SIZE_CAPTION = 24; // 12pt

function center(text: string, opts?: { bold?: boolean; size?: number; spacing?: { before?: number; after?: number } }): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: opts?.spacing ?? { after: 100 },
    children: [new TextRun({ text, font: FONT, size: opts?.size ?? SIZE_BODY, bold: opts?.bold ?? false })],
  });
}

function right(text: string, opts?: { spacing?: { before?: number; after?: number } }): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: opts?.spacing ?? { after: 100 },
    children: [new TextRun({ text, font: FONT, size: SIZE_BODY })],
  });
}

function body(text: string, opts?: { bold?: boolean; indent?: boolean }): Paragraph {
  return new Paragraph({
    spacing: { before: 80, after: 80, line: 360 },
    indent: opts?.indent !== false ? { firstLine: convertInchesToTwip(0.5) } : undefined,
    children: [new TextRun({ text, font: FONT, size: SIZE_BODY, bold: opts?.bold ?? false })],
  });
}

function heading(text: string, level = HeadingLevel.HEADING_1): Paragraph {
  return new Paragraph({
    heading: level,
    spacing: { before: 300, after: 160 },
    children: [new TextRun({ text, font: FONT, size: SIZE_BODY, bold: true })],
  });
}

function codeLines(code: string): Paragraph[] {
  const safeCode = code || "";
  return safeCode.split("\n").map(
    (line) => new Paragraph({
      spacing: { line: 240 },
      shading: { type: ShadingType.SOLID, color: "F5F5F5", fill: "F5F5F5" },
      border: {
        left: { style: BorderStyle.SINGLE, size: 6, color: "007ACC" },
      },
      indent: { left: convertInchesToTwip(0.1) },
      children: [new TextRun({ text: line || " ", font: MONO, size: SIZE_CODE })],
    })
  );
}

function caption(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 240 },
    children: [new TextRun({ text, font: FONT, size: SIZE_CAPTION, italics: true })],
  });
}

function pageBreak(): Paragraph {
  return new Paragraph({ children: [new PageBreak()] });
}

function imageParagraph(data: Buffer, width: number, height: number): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 160, after: 60 },
    children: [new ImageRun({ data, transformation: { width, height } })],
  });
}

/** Пустая строка-разделитель */
function gap(before = 200, after = 80): Paragraph {
  return new Paragraph({ spacing: { before, after } });
}

// ─── Title page ───────────────────────────────────────────────────────────────

function buildTitlePage(lab: LabStructure, meta: DocMeta): Paragraph[] {
  return [
    center("МИНИСТЕРСТВО НАУКИ И ВЫСШЕГО ОБРАЗОВАНИЯ РОССИЙСКОЙ ФЕДЕРАЦИИ", { bold: true, spacing: { after: 40 } }),
    center(meta.university, { bold: true, spacing: { after: 80 } }),
    center(meta.department, { spacing: { after: 800 } }),
    center("ЛАБОРАТОРНАЯ РАБОТА", { size: 36, bold: true, spacing: { after: 120 } }),
    center(`№${lab.labNumber}`, { size: 36, bold: true, spacing: { after: 120 } }),
    center(`Тема: ${lab.title}`, { size: 32, bold: true, spacing: { after: 1200 } }),
    right(`Выполнил: ${meta.student}`, { spacing: { before: 0, after: 60 } }),
    right(`Группа: ${meta.group}`, { spacing: { before: 0, after: 60 } }),
    right(`Проверил: ${meta.teacher}`, { spacing: { before: 200, after: 60 } }),
    // Поля для преподавателя
    new Paragraph({ spacing: { before: 400 } }),
    right("Дата выполнения: _______________", { spacing: { before: 80, after: 60 } }),
    right("Оценка: _______________________", { spacing: { before: 0, after: 80 } }),
    new Paragraph({ spacing: { before: 1200 } }),
    center(`${meta.city}, ${new Date().getFullYear()}`, { spacing: { before: 0, after: 0 } }),
    pageBreak(),
  ];
}

// ─── Table of Contents (Placeholder) ──────────────────────────────────────────

function buildTOC(): Paragraph[] {
  return [
    center("СОДЕРЖАНИЕ", { bold: true, size: 28, spacing: { after: 400 } }),
    new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({ text: "Введение ................................................................................................................... 3", font: FONT, size: SIZE_BODY })]
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({ text: "1. Задания .................................................................................................................... 4", font: FONT, size: SIZE_BODY })]
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({ text: "2. Контрольные вопросы ........................................................................................ 8", font: FONT, size: SIZE_BODY })]
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({ text: "3. Вывод .................................................................................................................... 12", font: FONT, size: SIZE_BODY })]
    }),
    pageBreak(),
  ];
}

// ─── Tasks section ────────────────────────────────────────────────────────────

function buildTasksSection(
  lab: LabStructure,
  taskScreenshots: TaskScreenshot[]
): Paragraph[] {
  const result: Paragraph[] = [heading("1. Задания")];
  const screenshotMap = new Map<number, TaskScreenshot>(
    taskScreenshots.map((s) => [s.taskNumber, s])
  );

  let figureNum = 1;
  for (const task of lab.tasks) {
    // Заголовок задания
    result.push(
      new Paragraph({
        spacing: { before: 240, after: 80 },
        children: [
          new TextRun({
            text: `Задание ${task.number}: ${task.title}`,
            font: FONT,
            size: SIZE_BODY,
            bold: true,
          }),
        ],
      }),
      body(task.description, { indent: false }),
    );

    // Если выбран вариант — указываем явно
    if (task.chosenVariant != null) {
      result.push(
        new Paragraph({
          spacing: { before: 60, after: 60 },
          indent: { firstLine: convertInchesToTwip(0.5) },
          children: [new TextRun({
            text: `Я выбрала вариант №${task.chosenVariant}`,
            font: FONT,
            size: SIZE_BODY,
            italics: true,
          })],
        })
      );
    }

    result.push(
      new Paragraph({
        spacing: { before: 80, after: 40 },
        children: [new TextRun({ text: "Решение:", font: FONT, size: SIZE_BODY, italics: true })],
      }),
      ...codeLines(task.code),
    );

    // IDE screenshot
    const sc = screenshotMap.get(task.number);
    const isNetworks = (lab as any).languageId === "networks";

    if (sc) {
      const ideCaption = isNetworks 
        ? `Рисунок ${figureNum++} — Задание ${task.number}: схема и конфигурация оборудования`
        : `Рисунок ${figureNum++} — Задание ${task.number}: код в среде Visual Studio 2022`;
      
      result.push(
        imageParagraph(sc.idePng, 470, 260),
        caption(ideCaption),
      );

      // Console screenshot (только если есть)
      if (sc.consolePng) {
        const consoleCaption = isNetworks
          ? `Рисунок ${figureNum++} — Задание ${task.number}: диагностика и проверка (ping/tracert)`
          : `Рисунок ${figureNum++} — Задание ${task.number}: результат выполнения программы`;
        
        result.push(
          imageParagraph(sc.consolePng, 430, 240),
          caption(consoleCaption),
        );
      }

      // Diagram (Mermaid) screenshot
      if (sc.diagramPng) {
        const diagCaption = isNetworks
          ? `Рисунок ${figureNum++} — Задание ${task.number}: топология локальной сети`
          : `Рисунок ${figureNum++} — Задание ${task.number}: схема алгоритма решения`;
          
        result.push(
          imageParagraph(sc.diagramPng, 500, 300),
          caption(diagCaption),
        );
      }
    }

    // Текстовый вывод
    result.push(
      new Paragraph({
        spacing: { before: 80, after: 40 },
        children: [new TextRun({ text: "Вывод программы:", font: FONT, size: SIZE_BODY, italics: true })],
      }),
      ...codeLines(task.output as any),
      gap(),
    );
  }

  return result;
}

// ─── Control questions ────────────────────────────────────────────────────────

function buildQuestionsSection(lab: LabStructure): Paragraph[] {
  const result: Paragraph[] = [heading("2. Контрольные вопросы")];

  lab.theoryQuestions.forEach((q, i) => {
    result.push(
      new Paragraph({
        spacing: { before: 180, after: 60 },
        children: [new TextRun({ text: `${i + 1}. ${q.question}`, font: FONT, size: SIZE_BODY, bold: true })],
      }),
      body(q.answer, { indent: true }),
    );
  });

  return result;
}

// ─── Conclusion ───────────────────────────────────────────────────────────────

function buildConclusionSection(lab: LabStructure): Paragraph[] {
  return [
    heading("3. Вывод"),
    body(lab.conclusion, { indent: true }),
  ];
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface DocMeta {
  university: string;
  department: string;
  student: string;
  group: string;
  teacher: string;
  city: string;
  year: string;
}

export const DEFAULT_META: DocMeta = {
  university: "Федеральное государственное бюджетное образовательное учреждение",
  department: "Кафедра информационных технологий и вычислительных систем",
  student: "Студент",
  group: "ИВТ-1",
  teacher: "Преподаватель",
  city: "Москва",
  year: new Date().getFullYear().toString(),
};

export async function buildLabReport(
  lab: LabStructure,
  taskScreenshots: TaskScreenshot[],
  meta: DocMeta = DEFAULT_META
): Promise<Buffer> {
  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: FONT, size: SIZE_BODY } },
      },
      paragraphStyles: [
        {
          id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal",
          run: { size: SIZE_BODY, bold: true, font: FONT, color: "000000" },
          paragraph: { spacing: { before: 400, after: 200 } },
        },
        {
          id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal",
          run: { size: SIZE_BODY, bold: true, font: FONT, color: "000000" },
          paragraph: { spacing: { before: 200, after: 120 } },
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(0.79),    // 20mm
            bottom: convertInchesToTwip(0.79), // 20mm
            left: convertInchesToTwip(1.18),   // 30mm
            right: convertInchesToTwip(0.39),  // 10mm
          },
        },
      },
      children: [
        // ── 1. Title page
        ...buildTitlePage(lab, meta),

        // ── 2. TOC
        ...buildTOC(),

        // ── 3. Objective
        heading("Цель работы"),
        body(lab.objective, { indent: true }),
        pageBreak(),

        // ── 3. Tasks (каждое задание со своим скриншотом IDE + консоль)
        ...buildTasksSection(lab, taskScreenshots),
        pageBreak(),

        // ── 4. Control questions (с теоретическими ответами)
        ...buildQuestionsSection(lab),
        pageBreak(),

        // ── 5. Conclusion
        ...buildConclusionSection(lab),
      ],
    }],
  });

  return Packer.toBuffer(doc);
}
