import mermaid from "mermaid";
import { renderSvgToPng } from "./render";

/**
 * Рендерит Mermaid диаграмму в PNG Buffer.
 * Работает ТОЛЬКО в браузере, так как требует DOM для mermaid.render.
 */
export async function renderMermaidToPng(definition: string): Promise<Buffer> {
  // Инициализируем mermaid если нужно
  mermaid.initialize({ startOnLoad: false, theme: "neutral" });

  const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
  
  // Создаем невидимый контейнер если его нет
  let container = document.getElementById("mermaid-render-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "mermaid-render-container";
    container.style.position = "absolute";
    container.style.top = "-9999px";
    container.style.left = "-9999px";
    document.body.appendChild(container);
  }

  // Рендерим SVG
  const { svg } = await mermaid.render(id, definition);
  
  // Конвертируем SVG в PNG через resvg
  const buffer = await renderSvgToPng(svg, 1000);

  // Очистка
  if (container) container.innerHTML = "";

  return buffer;
}
