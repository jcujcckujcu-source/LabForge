import { highlightCSharp } from "./highlight";
import { buildIdeElement } from "./ide-template";
import { buildConsoleElement } from "./console-template";
import { renderElementToPng } from "./render";

export interface Screenshots {
  idePng: Buffer;
  consolePng: Buffer;
}

export interface TaskScreenshot {
  taskNumber: number;
  idePng: Buffer;
  consolePng: Buffer | null; // null если hasConsoleOutput === false
}

/** Старый API — один иде + один консоль для обратной совместимости */
export async function generateScreenshots(
  code: string,
  consoleOutput: string,
  fontData: ArrayBuffer
): Promise<Screenshots> {
  const tokenLines = await highlightCSharp(code);

  const ideElement = buildIdeElement({
    fileName: "Program.cs",
    tokenLines,
  });

  const consoleElement = buildConsoleElement({
    outputText: consoleOutput,
  });

  const [idePng, consolePng] = await Promise.all([
    renderElementToPng(ideElement, 1200, 650, fontData),
    renderElementToPng(consoleElement, 900, 500, fontData),
  ]);

  return { idePng, consolePng };
}

/**
 * Новый API: генерирует скриншот для каждого задания.
 * IDE — всегда; консоль — только если hasConsoleOutput === true.
 */
export async function generateTaskScreenshots(
  tasks: Array<{
    number: number;
    code: string;
    output: string;
    hasConsoleOutput: boolean;
  }>,
  fontData: ArrayBuffer
): Promise<TaskScreenshot[]> {
  const results: TaskScreenshot[] = [];

  for (const task of tasks) {
    const tokenLines = await highlightCSharp(task.code);
    const ideElement = buildIdeElement({
      fileName: `Task${task.number}.cs`,
      tokenLines,
    });

    const idePng = await renderElementToPng(ideElement, 1200, 650, fontData);

    let consolePng: Buffer | null = null;
    if (task.hasConsoleOutput && task.output.trim()) {
      const consoleElement = buildConsoleElement({ outputText: task.output });
      consolePng = await renderElementToPng(consoleElement, 900, 500, fontData);
    }

    results.push({ taskNumber: task.number, idePng, consolePng });
  }

  return results;
}
