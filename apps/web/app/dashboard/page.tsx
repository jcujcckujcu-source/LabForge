"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../lib/hooks";
import { getHistory, downloadLab, updateApiToken, redeemPromo } from "../../lib/api";
import { GeneratePanel } from "../../components/GeneratePanel";
import { HistoryItem } from "../../components/HistoryItem";
import Link from "next/link";

export default function DashboardPage() {
  const { user, logout, refreshProfile } = useUser();
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [histError, setHistError] = useState("");
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [newToken, setNewToken] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [busy, setBusy] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getHistory();
      setReports(data.reports);
      setHistError("");
    } catch (err: any) {
      setHistError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("labgen_user");
    if (!stored) {
      router.replace("/login");
      return;
    }
    fetchHistory();
    refreshProfile();
  }, [router, fetchHistory, refreshProfile]);

  const handleUpdateToken = async () => {
    if (!newToken.trim() || busy) return;
    setBusy(true);
    try {
      await updateApiToken(newToken.trim());
      alert("SUCCESS");
      setShowTokenModal(false);
      setNewToken("");
      refreshProfile();
    } catch (err: any) {
      alert(`ERROR: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleRedeemPromo = async () => {
    if (!promoCode.trim() || busy) return;
    setBusy(true);
    try {
      const res = await redeemPromo(promoCode.trim());
      alert(`УСПЕШНО! ДОБАВЛЕНО КРЕДИТОВ: ${res.credits}`);
      setShowPromoModal(false);
      setPromoCode("");
      refreshProfile();
    } catch (err: any) {
      alert(`ОШИБКА: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Topbar */}
      <header className="topbar">
        <div className="nav-container">
          <Link href="/" className="logo">
            <span className="logo-text">LABFORGE</span>
          </Link>
          
          <div className="topbar-actions">
            {user?.referral_code && (
              <div 
                className="ref-badge hide-mobile"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/login?ref=${user.referral_code}`);
                  alert("LINK COPIED");
                }}
              >
                <span className="label">REF:</span>
                <span className="code">{user.referral_code}</span>
              </div>
            )}
            
            <div className="credits-badge">
               {user?.generations_left ?? "0"} CREDITS
            </div>

            <button className="icon-btn" onClick={() => setShowPromoModal(true)}>
               PROMO
            </button>

            <button className="icon-btn" onClick={() => { setNewToken(user?.api_token || ""); setShowTokenModal(true); }}>
               SETTINGS
            </button>

            <button 
              className="logout-btn mini-app-only" 
              onClick={() => (window as any).Telegram?.WebApp.close()}
              style={{ display: 'none' }}
            >
              CLOSE
            </button>

            <button onClick={() => { logout(); router.replace("/login"); }} className="logout-btn hide-mini-app">
              LOG OUT
            </button>
          </div>
        </div>
      </header>
      
      <script dangerouslySetInnerHTML={{ __html: `
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
          document.querySelectorAll('.mini-app-only').forEach(el => el.style.display = 'block');
          document.querySelectorAll('.hide-mini-app').forEach(el => el.style.display = 'none');
        }
      `}} />

      <main className="dashboard-main animate-fade-in">
        <header className="main-header">
           <h1 className="main-title">WORKSPACE</h1>
           <p className="main-subtitle">AI_GENERATOR_V2.0</p>
        </header>

        <GeneratePanel onGenerated={fetchHistory} />
        
        <section className="history-section panel">
          <header className="history-header">
            <h2 className="history-title">HISTORY</h2>
            {reports.length > 0 && <span className="history-count">{reports.length} ITEMS</span>}
          </header>
          
          <div className="history-body">
            {loading ? (
              <div className="loading">FETCHING_DATA...</div>
            ) : histError ? (
              <div className="error">{histError}</div>
            ) : reports.length === 0 ? (
              <div className="empty">NO RECORDS FOUND</div>
            ) : (
              <div className="history-list">
                {reports.map(r => (
                  <HistoryItem key={r.id} report={r} onDownload={downloadLab} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Token Modal */}
      {showTokenModal && (
        <div className="modal-overlay" onClick={() => setShowTokenModal(false)}>
           <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
              <h2 className="modal-title">SETTINGS</h2>
              <p className="modal-subtitle">UPDATE OPENROUTER API TOKEN</p>
              <div className="field-group">
                <label className="field-label">API_TOKEN</label>
                <input type="password" className="field-input" value={newToken} onChange={(e) => setNewToken(e.target.value)} />
              </div>
              <div className="modal-actions">
                 <button className="btn-primary" disabled={busy} onClick={handleUpdateToken}>SAVE</button>
                 <button className="btn-secondary" onClick={() => setShowTokenModal(false)}>CLOSE</button>
              </div>
           </div>
        </div>
      )}

      {/* Promo Modal */}
      {showPromoModal && (
        <div className="modal-overlay" onClick={() => setShowPromoModal(false)}>
           <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
              <h2 className="modal-title">PROMO_CODE</h2>
              <p className="modal-subtitle">ENTER YOUR CODE TO REFILL CREDITS</p>
              <div className="field-group">
                <label className="field-label">CODE</label>
                <input type="text" className="field-input" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder="LAB-XXXX-XXXX" />
              </div>
              <div className="modal-actions">
                 <button className="btn-primary" disabled={busy} onClick={handleRedeemPromo}>REDEEM</button>
                 <button className="btn-secondary" onClick={() => setShowPromoModal(false)}>CLOSE</button>
              </div>
           </div>
        </div>
      )}

      <style jsx>{`
        .dashboard-layout { min-height: 100vh; background: transparent; }
        .topbar { position: sticky; top: 0; z-index: 100; border-bottom: 1px solid #111; background: transparent; backdrop-filter: blur(20px); }
        .nav-container { max-width: 1200px; margin: 0 auto; height: 64px; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; }
        .logo-text { font-weight: 700; letter-spacing: 0.2em; font-size: 14px; color: #fff; }
        
        .topbar-actions { display: flex; align-items: center; gap: 24px; }
        .ref-badge { display: flex; gap: 8px; align-items: center; background: #000; padding: 6px 16px; border: 1px solid #111; cursor: pointer; }
        .ref-badge:hover { border-color: #333; }
        .ref-badge .label { font-size: 10px; color: #222; font-weight: 700; }
        .ref-badge .code { font-size: 11px; color: #fff; font-weight: 700; font-family: var(--mono); }
        
        .credits-badge { padding: 6px 16px; border: 1px solid #111; font-size: 10px; color: #fff; font-weight: 700; letter-spacing: 0.1em; }
        .icon-btn { background: none; border: 1px solid #111; height: 32px; padding: 0 12px; cursor: pointer; color: #333; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; transition: all 0.2s; }
        .icon-btn:hover { border-color: #fff; color: #fff; }
        .logout-btn { font-size: 10px; color: #222; background: none; border: 1px solid #111; padding: 8px 16px; cursor: pointer; transition: all 0.2s; font-weight: 700; letter-spacing: 0.1em; }
        .logout-btn:hover { color: #fff; border-color: #fff; }

        .dashboard-main { max-width: 1000px; margin: 0 auto; padding: 80px 24px; display: flex; flex-direction: column; gap: 60px; }
        .main-title { font-size: 48px; font-weight: 800; letter-spacing: -0.04em; margin-bottom: 8px; color: #fff; }
        .main-subtitle { color: #111; font-size: 12px; font-weight: 700; letter-spacing: 0.4em; }

        .history-section { border: 1px solid #111; background: transparent; }
        .history-header { display: flex; align-items: center; justify-content: space-between; padding: 32px 40px; border-bottom: 1px solid #111; }
        .history-title { font-size: 18px; font-weight: 700; color: #fff; letter-spacing: 0.1em; }
        .history-count { font-size: 11px; color: #222; font-weight: 700; }

        .loading, .empty, .error { padding: 120px 40px; text-align: center; color: #222; font-size: 12px; font-family: var(--mono); letter-spacing: 0.1em; }

        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); display: flex; align-items: center; justify-content: center; z-index: 2000; }
        .modal-content { width: 100%; max-width: 440px; padding: 48px; border: 1px solid #111; background: #000; display: flex; flex-direction: column; gap: 32px; }
        .modal-title { font-size: 20px; font-weight: 700; color: #fff; letter-spacing: 0.1em; }
        .modal-subtitle { font-size: 11px; color: #222; line-height: 1.6; font-weight: 700; letter-spacing: 0.1em; }
        .modal-actions { display: flex; gap: 12px; }
        
        .field-group { display: flex; flex-direction: column; gap: 12px; }
        .field-label { font-size: 10px; font-weight: 700; color: #222; letter-spacing: 0.2em; }
        .field-input { background: #000; border: 1px solid #111; padding: 14px 18px; color: #fff; font-size: 13px; outline: none; font-family: var(--mono); }
        .field-input:focus { border-color: #333; }

        @media (max-width: 768px) {
          .hide-mobile { display: none; }
          .dashboard-main { padding: 40px 20px; gap: 40px; }
          .main-title { font-size: 32px; }
          .topbar-actions { gap: 12px; }
        }
      `}</style>
    </div>
  );
}
