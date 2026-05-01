import { highlightCode } from "./highlight";
import { buildIdeElement } from "./ide-template";
import { buildConsoleElement } from "./console-template";
import { renderElementToPng, renderSvgToPng } from "./render";
import { renderMermaidToPng } from "./mermaid-render";

export interface Screenshots {
  idePng: Buffer;
  consolePng: Buffer;
}

export interface TaskScreenshot {
  taskNumber: number;
  idePng: Buffer;
  consolePng: Buffer | null; // null если hasConsoleOutput === false
  diagramPng: Buffer | null; // null если нет диаграммы
}

/** Старый API — один иде + один консоль для обратной совместимости */
export async function generateScreenshots(
  code: string,
  consoleOutput: string,
  fontData: ArrayBuffer,
  extension = "cs"
): Promise<Screenshots> {
  const fileName = `Program.${extension}`;
  const tokenLines = await highlightCode(code, fileName);

  const ideElement = buildIdeElement({
    fileName,
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
    diagram?: string;
  }>,
  fontData: ArrayBuffer,
  extension = "cs"
): Promise<TaskScreenshot[]> {
  const results: TaskScreenshot[] = [];

  for (const task of tasks) {
    const fileName = extension === "txt" ? `Network_Config_${task.number}.conf` : `Task${task.number}.${extension}`;
    const tokenLines = await highlightCode(task.code, fileName);
    const ideElement = buildIdeElement({
      fileName,
      tokenLines,
    });

    const idePng = await renderElementToPng(ideElement, 1200, 650, fontData);

    let consolePng: Buffer | null = null;
    const outputText = task.output || "";
    if (task.hasConsoleOutput && outputText.trim()) {
      const consoleElement = buildConsoleElement({ outputText });
      consolePng = await renderElementToPng(consoleElement, 900, 500, fontData);
    }

    let diagramPng: Buffer | null = null;
    if (task.diagram && task.diagram.trim()) {
      try {
        diagramPng = await renderMermaidToPng(task.diagram);
      } catch (e) {
        console.error("Failed to render diagram:", e);
      }
    }

    results.push({ taskNumber: task.number, idePng, consolePng, diagramPng });
  }

  return results;
}
