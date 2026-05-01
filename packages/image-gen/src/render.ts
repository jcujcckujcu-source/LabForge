import satori from "satori";
import { initWasm, Resvg } from "@resvg/resvg-wasm";
import type React from "react";

// ─── WASM & Font Initialization ──────────────────────────────────────────────

let _wasmInitialized = false;

export async function initializeResvg(wasmModule: WebAssembly.Module | BufferSource) {
  if (_wasmInitialized) return;
  await initWasm(wasmModule);
  _wasmInitialized = true;
}

// ─── Render ──────────────────────────────────────────────────────────────────

export async function renderElementToPng(
  element: React.ReactElement,
  width: number,
  height: number,
  fontData: ArrayBuffer
): Promise<Buffer> {
  const svg = await satori(element, {
    width,
    height,
    fonts: [
      {
        name: "monospace",
        data: fontData,
        weight: 400,
        style: "normal",
      },
    ],
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
  });

  const pngData = resvg.render();
  return Buffer.from(pngData.asPng());
}

export async function renderSvgToPng(
  svg: string,
  width: number
): Promise<Buffer> {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
  });

  const pngData = resvg.render();
  return Buffer.from(pngData.asPng());
}
