"use client";

import { useState, useEffect, type FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { register, login, setToken } from "../../lib/api";
import Link from "next/link";

type Mode = "login" | "register";
type RegStep = 1 | 2;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("login");
  const [regStep, setRegStep] = useState<RegStep>(1);
  
  const [username, setUsername]   = useState("");
  const [apiToken, setApiToken]   = useState("");
  const [password, setPassword]   = useState("");
  const [refCode, setRefCode]     = useState("");
  
  const [busy, setBusy]           = useState(false);
  const [error, setError]         = useState("");

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setRefCode(ref);
      setMode("register");
    }
    const m = searchParams.get("mode");
    if (m === "register") setMode("register");
  }, [searchParams]);

  const handleNextStep = (e: FormEvent) => {
    e.preventDefault();
    if (username.length < 3 || apiToken.length < 10) {
      setError("CHECK INPUTS");
      return;
    }
    setError("");
    setRegStep(2);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!apiToken.trim() || busy) return;
    setBusy(true);
    setError("");

    try {
      let payload;
      if (mode === "register") {
        payload = await register({
          username: username.trim(),
          apiToken: apiToken.trim(),
          password: password.trim(),
          referralCode: refCode.trim() || undefined,
        });
      } else {
        payload = await login({ 
          apiToken: apiToken.trim() || undefined,
          username: username.trim() || undefined,
          password: password.trim() || undefined
        });
      }
      setToken(payload.token, payload.userId);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <Link href="/" className="auth-back">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter">
           <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        GO BACK
      </Link>
      
      <div className="auth-container">
        <div className="auth-card animate-fade-in">
          <div className="auth-logo">
            <span className="logo-text">LABFORGE</span>
          </div>

          <h1 className="auth-title">
            {mode === "login" ? "ACCESS GRANTED" : regStep === 1 ? "CREATE ACCOUNT" : "VERIFY IDENTITY"}
          </h1>
          <p className="auth-subtitle">
            {mode === "login"
              ? "ENTER YOUR API TOKEN OR LOGIN/PASSWORD"
              : regStep === 1 
                ? "STEP 1: TELEGRAM & API DETAILS" 
                : "STEP 2: SET PASSWORD IN BOT"}
          </p>

          {/* LOGIN MODE */}
          {mode === "login" && (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="field-group">
                <label className="field-label">TELEGRAM_USERNAME</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="@USERNAME"
                  disabled={busy}
                  className="field-input"
                  required
                />
              </div>
              <div className="field-group">
                <label className="field-label">PASSWORD</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={busy}
                  className="field-input"
                  required
                />
              </div>
              {error && <div className="auth-error">{error}</div>}
              <button type="submit" disabled={busy} className="btn-primary" style={{ width: "100%", padding: 18 }}>
                {busy ? "AUTHORIZING..." : "LOG IN"}
              </button>
            </form>
          )}

          {/* REGISTER MODE - STEP 1 */}
          {mode === "register" && regStep === 1 && (
             <form onSubmit={handleNextStep} className="auth-form">
               <div className="field-group">
                 <label className="field-label">TELEGRAM_USERNAME</label>
                 <input
                   type="text"
                   value={username}
                   onChange={(e) => setUsername(e.target.value)}
                   placeholder="@USERNAME"
                   className="field-input"
                   required
                 />
               </div>
               <div className="field-group">
                 <label className="field-label">OPENROUTER_API_TOKEN</label>
                 <input
                   type="password"
                   value={apiToken}
                   onChange={(e) => setApiToken(e.target.value)}
                   placeholder="SK-OR-V1-..."
                   className="field-input"
                   required
                 />
               </div>
               {error && <div className="auth-error">{error}</div>}
               <button type="submit" className="btn-primary" style={{ width: "100%", padding: 18 }}>
                 CONTINUE
               </button>
             </form>
          )}

           {/* REGISTER MODE - STEP 2 */}
           {mode === "register" && regStep === 2 && (
              <form onSubmit={handleSubmit} className="auth-form">
                <div className="field-group">
                  <label className="field-label">TELEGRAM_PASSWORD</label>
                  <div className="otp-container">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="ENTER PASSWORD"
                      disabled={busy}
                      className="field-input"
                      required
                    />
                    <a href="https://t.me/LabForgebot" target="_blank" className="bot-link">OPEN BOT</a>
                  </div>
                  <span className="field-hint">ЗАЙДИТЕ В БОТ @LabForgebot И УСТАНОВИТЕ ПАРОЛЬ (КНОПКА В МЕНЮ)</span>
                </div>
                {error && <div className="auth-error">{error}</div>}
                <div className="modal-actions">
                   <button type="submit" disabled={busy || !password.trim()} className="btn-primary" style={{ flex: 1, padding: 18 }}>
                     {busy ? "VERIFYING..." : "REGISTER"}
                   </button>
                   <button type="button" onClick={() => setRegStep(1)} className="btn-secondary">BACK</button>
                </div>
              </form>
           )}

          <div className="auth-toggle">
            <span>{mode === "login" ? "NO ACCOUNT?" : "ALREADY REGISTERED?"}</span>
            <button
              type="button"
              onClick={() => { 
                setMode(mode === "login" ? "register" : "login"); 
                setRegStep(1);
                setError(""); 
              }}
            >
              {mode === "login" ? "CREATE" : "LOG IN"}
            </button>
          </div>
        </div>

        {/* Guide Panel */}
        <div className="auth-guide hide-mobile">
           <h3 className="guide-title">QUICK START</h3>
           <ol className="guide-list">
              <li>GET YOUR <a href="https://openrouter.ai/keys" target="_blank">API TOKEN</a></li>
              <li>GO TO <a href="https://t.me/LabForgebot" target="_blank">@LabForgebot</a></li>
              <li>SET PASSWORD IN BOT</li>
              <li>COMPLETE REGISTRATION</li>
           </ol>
           <div className="guide-note">
              * СТРОГИЙ МИНИМАЛИЗМ — НИЧЕГО ЛИШНЕГО, ТОЛЬКО РЕЗУЛЬТАТ.
           </div>
        </div>
      </div>

      <style jsx>{`
        .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 32px 16px; position: relative; background: transparent; }
        .auth-back { position: absolute; top: 40px; left: 40px; font-size: 11px; font-weight: 700; color: #222; display: flex; align-items: center; gap: 12px; transition: color 0.2s; letter-spacing: 0.2em; }
        .auth-back:hover { color: #fff; }
        
        .auth-container { display: flex; gap: 60px; align-items: center; max-width: 1000px; width: 100%; }
        .auth-card { flex: 1; padding: 60px; border: 1px solid #111; background: transparent; min-height: 500px; display: flex; flex-direction: column; }
        .auth-logo { margin-bottom: 48px; }
        .logo-text { font-weight: 700; letter-spacing: 0.3em; font-size: 14px; color: #fff; }
        
        .auth-title { font-size: 20px; font-weight: 700; margin-bottom: 8px; color: #fff; letter-spacing: 0.1em; }
        .auth-subtitle { font-size: 11px; color: #333; margin-bottom: 48px; letter-spacing: 0.1em; font-weight: 600; }
        
        .auth-form { display: flex; flex-direction: column; gap: 24px; flex: 1; }
        .field-group { display: flex; flex-direction: column; gap: 12px; }
        .field-label { font-size: 10px; font-weight: 700; color: #222; letter-spacing: 0.2em; }
        .field-hint { font-size: 9px; color: #222; font-weight: 700; }
        
        .otp-container { display: flex; gap: 8px; }
        .bot-link { display: flex; align-items: center; background: #111; border: 1px solid #222; padding: 0 16px; font-size: 10px; font-weight: 700; color: #666; transition: all 0.2s; }
        .bot-link:hover { color: #fff; border-color: #fff; }

        .field-input { flex: 1; background: #000; border: 1px solid #111; padding: 14px 18px; color: #fff; font-size: 13px; outline: none; font-family: var(--mono); }
        .field-input:focus { border-color: #333; }
        
        .modal-actions { display: flex; gap: 12px; }

        .auth-error { padding: 16px; border: 1px solid #200; background: #080000; color: #f44; font-size: 12px; font-family: var(--mono); }

        .auth-toggle { margin-top: auto; padding-top: 48px; display: flex; justify-content: center; gap: 12px; font-size: 10px; color: #222; letter-spacing: 0.1em; font-weight: 700; }
        .auth-toggle button { background: none; border: none; color: #fff; font-weight: 700; cursor: pointer; padding: 0; letter-spacing: 0.1em; text-decoration: underline; }

        .auth-guide { width: 340px; padding: 48px; border-left: 1px solid #111; }
        .guide-title { font-size: 14px; font-weight: 800; color: #fff; margin-bottom: 32px; letter-spacing: 0.1em; }
        .guide-list { list-style: decimal; color: #444; padding-left: 18px; display: flex; flex-direction: column; gap: 16px; }
        .guide-list li { font-size: 12px; font-weight: 600; line-height: 1.6; }
        .guide-list a { color: #fff; text-decoration: underline; }
        .guide-note { margin-top: 48px; font-size: 10px; color: #222; font-weight: 700; line-height: 1.6; }

        @media (max-width: 900px) { .auth-guide { display: none; } .auth-container { justify-content: center; } }
        @media (max-width: 480px) { .auth-card { padding: 40px 24px; border: none; } .auth-back { top: 24px; left: 24px; } }
      `}</style>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="auth-page">LOADING...</div>}>
      <LoginForm />
    </Suspense>
  );
}
