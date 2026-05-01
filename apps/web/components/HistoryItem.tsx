"use client";

import { useState, memo } from "react";
import { type LabReport } from "../lib/api";

export const HistoryItem = memo(({ report, onDownload }: { report: LabReport; onDownload: (id: string) => void }) => {
  const [loading, setLoading] = useState(false);
  const date = new Date(report.created_at).toLocaleDateString("ru-RU", { 
    day: "2-digit", month: "short", year: "numeric", 
    hour: "2-digit", minute: "2-digit" 
  });

  return (
    <div className="history-item">
      <div className="item-content">
        <div className="item-main">
          <span className="item-id">ID_{report.lab_number}</span>
          <h3 className="item-topic">{report.topic}</h3>
        </div>
        <div className="item-meta">
          <span>{date}</span>
        </div>
      </div>
      <button
        onClick={async () => { 
          setLoading(true); 
          try { await onDownload(report.id); } 
          finally { setLoading(false); } 
        }}
        disabled={loading}
        className="item-btn"
      >
        {loading ? "..." : "DOWNLOAD_DOCX"}
      </button>

      <style jsx>{`
        .history-item { 
          display: flex; align-items: center; justify-content: space-between; 
          padding: 24px 40px; border-bottom: 1px solid #111; 
          transition: background 0.1s; 
        }
        .history-item:hover { background: #080808; }
        
        .item-content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
        .item-main { display: flex; align-items: center; gap: 16px; }
        .item-id { font-family: var(--mono); font-size: 10px; color: #333; font-weight: 700; letter-spacing: 0.1em; }
        .item-topic { 
          font-size: 14px; color: #fff; font-weight: 700; 
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; 
          letter-spacing: 0.05em; text-transform: uppercase;
        }
        
        .item-meta { font-size: 10px; color: #222; font-weight: 700; letter-spacing: 0.1em; font-family: var(--mono); }

        .item-btn {
          background: #000;
          color: #444;
          border: 1px solid #222;
          padding: 10px 20px;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.1em;
          margin-left: 24px;
        }
        .item-btn:hover:not(:disabled) {
          background: #fff;
          color: #000;
          border-color: #fff;
        }
        .item-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        @media (max-width: 640px) {
          .history-item { flex-direction: column; align-items: flex-start; gap: 20px; padding: 24px; }
          .item-btn { margin-left: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
});
HistoryItem.displayName = "HistoryItem";
