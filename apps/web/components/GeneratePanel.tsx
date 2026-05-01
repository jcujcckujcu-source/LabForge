"use client";

import { useState, useCallback, type FormEvent, memo } from "react";
import { AVAILABLE_MODELS, SUPPORTED_LANGUAGES, type LanguageId } from "@lab-gen/llm-client";
import { downloadLab, generateJson, finalizeLab, type GenerateBody } from "../lib/api";
import { useUser } from "../lib/hooks";
import Mermaid from "./Mermaid";

interface MetaFields {
  university: string; department: string; student: string;
  group: string; teacher: string; city: string;
}

const SUGGESTIONS = [
  "Базовые алгоритмы сортировки",
  "ООП: Наследование и полиморфизм",
  "Проектирование локальной сети офиса",
  "Анализ домашней сети и трафика",
  "Сравнение Wi-Fi 5 и Wi-Fi 6",
  "Настройка VPN для удаленного доступа",
];

export const GeneratePanel = memo(({ onGenerated }: { onGenerated: () => void }) => {
  const { refreshProfile } = useUser();
  const [topic, setTopic]       = useState("");
  const [labNumber, setLabNumber] = useState(1);
  const [lang, setLang]         = useState<LanguageId>("python");
  const [model, setModel]       = useState(AVAILABLE_MODELS[0].id);
  const [meta, setMeta] = useState<MetaFields>({
    university: "", department: "", student: "", group: "", teacher: "", city: "Москва",
  });
  const [status, setStatus]     = useState<"idle" | "generating" | "preview" | "finalizing" | "done" | "error">("idle");
  const [error, setError]       = useState("");
  const [logs, setLogs]         = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<any>(null);

  const busy = status === "generating" || status === "finalizing";

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [...prev.slice(-4), `> ${msg}`]);
  }, []);

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || busy) return;
    
    setStatus("generating");
    setError("");
    setLogs(["INITIALIZING_AI..."]);

    const body: GenerateBody = {
      topic: topic.trim(),
      labNumber,
      language: lang,
      model,
      meta: Object.fromEntries(Object.entries(meta).filter(([, v]) => v.trim())) as GenerateBody["meta"],
    };

    try {
      const data = await generateJson(body, (msg) => addLog(msg));
      setPreviewData(data);
      setStatus("preview");
      addLog("STRUCTURE_READY");
    } catch (err: any) {
      let msg = err.message || String(err);
      
      // Красивый вывод ошибок валидации Zod
      if (err.details && typeof err.details === "object") {
        try {
          const detailStr = Object.entries(err.details)
            .map(([field, info]: [string, any]) => {
              const errs = info._errors || [];
              return `${field}: ${errs.join(", ") || "invalid"}`;
            })
            .join("; ");
          msg = `${msg} (${detailStr})`;
        } catch (e) {
          msg = `${msg} (validation error)`;
        }
      }

      if (msg.includes("401") && msg.includes("User not found")) {
        setError("OpenRouter: Ошибка ключа или баланса.");
        addLog("ERROR: CHECK_API_KEY");
      } else {
        setError(msg);
        addLog(`ERROR: ${msg}`);
      }
      setStatus("error");
      addLog("GENERATION_FAILED");
    }
  };

  const handleFinalize = async () => {
    if (!previewData || status === "finalizing") return;
    
    setStatus("finalizing");
    setError("");
    
    try {
      const metaValues = Object.fromEntries(Object.entries(meta).filter(([, v]) => v.trim())) as GenerateBody["meta"];
      const result = await finalizeLab(previewData, metaValues, (msg) => addLog(msg));
      
      setStatus("done");
      setPreviewData(null);
      setTopic("");
      onGenerated();
      setTimeout(() => refreshProfile(), 1000);
      
      addLog("SUCCESS:_FILE_READY");
      await downloadLab(result.reportId);
    } catch (err: any) {
      setError(err.message || String(err));
      setStatus("error");
    }
  };

  return (
    <div className="panel" style={{ padding: 48, border: "1px solid #222" }}>
      <form onSubmit={handleGenerate} style={{ display: "flex", flexDirection: "column", gap: 40 }}>
        
        <div className="topic-grid">
          <div className="field-group">
            <label className="field-label">TOPIC</label>
            <input 
              type="text" 
              value={topic} 
              onChange={(e) => setTopic(e.target.value)}
              placeholder="ENTER SUBJECT"
              className="field-input"
              disabled={busy}
              required
            />
          </div>
          <div className="field-group number-input">
            <label className="field-label">ID</label>
            <input 
              type="number" 
              value={labNumber} 
              onChange={(e) => setLabNumber(Number(e.target.value))}
              className="field-input"
              disabled={busy}
              min={1}
            />
          </div>
        </div>

        {!topic && (
          <div className="suggestions-list">
            {SUGGESTIONS.map(s => (
              <button 
                key={s} 
                type="button" 
                onClick={() => setTopic(s)}
                className="suggestion-chip"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="settings-grid">
           <div className="field-group">
              <label className="field-label">LANGUAGE</label>
              <div className="lang-selector">
                {SUPPORTED_LANGUAGES.map(l => (
                  <button 
                    key={l.id} 
                    type="button" 
                    onClick={() => setLang(l.id as LanguageId)}
                    className={`lang-btn ${lang === l.id ? "active" : ""}`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
           </div>
           <div className="field-group">
              <label className="field-label">ENGINE</label>
              <select 
                className="field-input" 
                value={model} 
                onChange={(e) => setModel(e.target.value as any)}
                disabled={busy}
              >
                {AVAILABLE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
           </div>
        </div>

        <button 
          type="submit" 
          disabled={busy || !topic.trim()} 
          className="btn-primary"
        >
          {status === "generating" ? "EXECUTING..." : "GENERATE_REPORT"}
        </button>
      </form>

      <details className="meta-details">
        <summary className="meta-summary">METADATA_SETTINGS</summary>
        <div className="meta-grid">
           {Object.keys(meta).map(key => (
             <div key={key} className="field-group">
                <label className="field-label-sm">{key}</label>
                <input 
                  type="text"
                  placeholder={key}
                  value={meta[key as keyof MetaFields]}
                  onChange={(e) => setMeta({...meta, [key]: e.target.value})}
                  className="field-input-sm"
                />
             </div>
           ))}
        </div>
      </details>

      <div className="status-area">
        {status === "preview" && previewData && (
          <div className="preview-container">
            <div className="preview-header">
               <h3 className="preview-title">PREVIEW: {previewData.title}</h3>
               <span className="task-badge">{previewData.tasks.length} TASKS</span>
            </div>
            
            <div className="preview-list">
              {previewData.tasks.map((task: any, i: number) => (
                <div key={i} className="preview-item">
                  <div className="item-num">T_{task.number}: {task.title}</div>
                  {task.diagram && <Mermaid chart={task.diagram} />}
                  <pre className="item-code">{task.code.slice(0, 150)}...</pre>
                </div>
              ))}
            </div>

            <div className="preview-actions">
               <button onClick={handleFinalize} className="btn-primary">EXPORT_TO_DOCX</button>
               <button onClick={() => setStatus("idle")} className="btn-secondary">ABORT</button>
            </div>
          </div>
        )}

        {(busy || logs.length > 0) && (
          <div className="logs-container">
            {logs.map((log, i) => (
              <div key={i} className={`log-line ${i === logs.length - 1 ? "active" : ""}`}>
                {log}{i === logs.length - 1 && busy && <span className="blink">_</span>}
              </div>
            ))}
          </div>
        )}

        {status === "done" && <div className="status-message success">DONE:_FILE_DOWNLOADED</div>}
        {status === "error" && <div className="status-message error">{error}</div>}
      </div>

      <style jsx>{`
        .topic-grid { display: grid; grid-template-columns: 1fr 100px; gap: 20px; }
        .suggestions-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: -16px; }
        .suggestion-chip { 
          padding: 6px 12px; background: #000; border: 1px solid #222; 
          font-size: 10px; color: #444; cursor: pointer; transition: all 0.2s; font-weight: 700;
        }
        .suggestion-chip:hover { border-color: #fff; color: #fff; }
        
        .settings-grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 32px; }
        .lang-selector { display: flex; gap: 4px; }
        .lang-btn { 
          flex: 1; padding: 12px 4px; font-size: 10px; font-weight: 700;
          background: #000; color: #333; border: 1px solid #222; cursor: pointer;
        }
        .lang-btn.active { background: #fff; color: #000; border-color: #fff; }
        
        .meta-details { margin-top: 40px; border-top: 1px solid #222; padding-top: 24px; }
        .meta-summary { font-size: 10px; color: #333; cursor: pointer; font-weight: 700; margin-bottom: 24px; letter-spacing: 0.2em; }
        .meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
        
        .field-group { display: flex; flex-direction: column; gap: 12px; }
        .field-label { font-size: 10px; font-weight: 700; color: #333; letter-spacing: 0.2em; }
        .field-label-sm { font-size: 9px; font-weight: 700; color: #333; text-transform: uppercase; }
        .field-input, .field-input-sm { 
          background: #000; border: 1px solid #222; 
          padding: 14px 18px; color: #fff; font-size: 13px; outline: none; font-family: var(--mono);
        }
        .field-input:focus, .field-input-sm:focus { border-color: #fff; }
        
        .status-area { margin-top: 40px; display: flex; flex-direction: column; gap: 24px; }
        .preview-container { padding: 40px; border: 1px solid #333; background: #000; }
        .preview-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
        .preview-title { font-size: 16px; font-weight: 700; color: #fff; letter-spacing: 0.1em; }
        .task-badge { font-size: 10px; background: #fff; color: #000; padding: 4px 12px; font-weight: 700; }
        
        .preview-list { max-height: 300px; overflow-y: auto; display: flex; flex-direction: column; gap: 1px; background: #222; }
        .preview-item { padding: 24px; background: #000; }
        .item-num { font-size: 11px; font-weight: 700; color: #666; margin-bottom: 12px; }
        .item-code { font-size: 12px; color: #444; background: #000; padding: 16px; border: 1px solid #111; overflow-x: auto; font-family: var(--mono); }
        
        .preview-actions { display: flex; gap: 12px; margin-top: 32px; }
        .preview-actions button { flex: 1; }

        .logs-container { padding: 32px; background: #000; border: 1px solid #111; font-family: var(--mono); font-size: 11px; line-height: 2; }
        .log-line { color: #222; letter-spacing: 0.1em; }
        .log-line.active { color: #fff; }

        .status-message { padding: 24px; border: 1px solid #222; font-size: 12px; text-align: center; font-weight: 700; letter-spacing: 0.1em; font-family: var(--mono); }
        .status-message.success { background: #000; color: #fff; border-color: #333; }
        .status-message.error { background: #100; color: #f00; border-color: #400; }

        @media (max-width: 768px) {
          .topic-grid, .settings-grid { grid-template-columns: 1fr; }
          .preview-actions { flex-direction: column; }
        }
      `}</style>
    </div>
  );
});

GeneratePanel.displayName = "GeneratePanel";
