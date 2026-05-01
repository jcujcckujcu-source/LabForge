"use client";

import { useEffect, useRef } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: true,
  theme: "dark",
  securityLevel: "loose",
  fontFamily: "var(--mono)",
});

export default function Mermaid({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && chart) {
      ref.current.removeAttribute("data-processed");
      mermaid.contentLoaded();
    }
  }, [chart]);

  if (!chart) return null;

  return (
    <div className="mermaid-wrapper">
      <div ref={ref} className="mermaid">
        {chart}
      </div>
      <style jsx>{`
        .mermaid-wrapper {
          background: #000;
          padding: 24px;
          border: 1px solid #111;
          margin: 16px 0;
          overflow-x: auto;
          display: flex;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}
