import { useState, useRef, useEffect } from "react";
import axios from "axios";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const API = "http://localhost:8000";
const api = axios.create({ baseURL: API });

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// ─── DESIGN SYSTEM ────────────────────────────────────────────────────────────
const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Azeret+Mono:wght@300;400;500;600&family=Outfit:wght@300;400;500;600&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      /* Palette */
      --ink:        #07070A;
      --ink1:       #0D0D12;
      --ink2:       #131318;
      --ink3:       #1A1A22;
      --ink4:       #22222C;
      --line:       #272730;
      --line2:      #32323E;

      /* Copper accent system */
      --cu:         #C17F3A;
      --cu-hi:      #D4934A;
      --cu-lo:      #8A5A28;
      --cu-tint:    rgba(193,127,58,0.09);
      --cu-tint2:   rgba(193,127,58,0.05);
      --cu-glow:    rgba(193,127,58,0.22);

      /* Semantic */
      --mint:       #00C9A7;
      --mint-tint:  rgba(0,201,167,0.1);
      --rose:       #E05C6A;
      --rose-tint:  rgba(224,92,106,0.1);
      --sky:        #5B9CF6;
      --sky-tint:   rgba(91,156,246,0.1);

      /* Text */
      --t1:  #EEEAE2;
      --t2:  #8C8C9E;
      --t3:  #46465A;
      --t4:  #2C2C3A;

      /* Type */
      --serif: 'Libre Baskerville', Georgia, serif;
      --mono:  'Azeret Mono', 'Courier New', monospace;
      --body:  'Outfit', sans-serif;
    }

    html, body, #root { height: 100%; }
    body {
      background: var(--ink);
      color: var(--t1);
      font-family: var(--body);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Noise texture overlay */
    body::after {
      content: '';
      position: fixed; inset: 0; pointer-events: none; z-index: 9998;
      opacity: 0.028;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
      background-size: 200px;
    }

    ::-webkit-scrollbar { width: 2px; height: 2px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--line2); border-radius: 1px; }

    /* ── Keyframes ── */
    @keyframes fadeUp   { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
    @keyframes slideIn  { from { opacity:0; transform:translateX(-10px); } to { opacity:1; transform:translateX(0); } }
    @keyframes spin     { to   { transform:rotate(360deg); } }
    @keyframes pulse    { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
    @keyframes shimmer  {
      0%   { background-position: -400px 0; }
      100% { background-position:  400px 0; }
    }
    @keyframes breathe  {
      0%,100% { box-shadow: 0 0 0 0 var(--cu-glow); }
      50%      { box-shadow: 0 0 0 6px rgba(193,127,58,0); }
    }

    .fade-up  { animation: fadeUp  0.45s cubic-bezier(0.16,1,0.3,1) both; }
    .fade-in  { animation: fadeIn  0.3s ease both; }
    .slide-in { animation: slideIn 0.35s cubic-bezier(0.16,1,0.3,1) both; }

    /* ── Buttons ── */
    .btn {
      font-family: var(--t5);
      font-size: 10px;
      font-weight: 500;
      letter-spacing: .1em;
      text-transform: uppercase;
      border: none;
      cursor: pointer;
      transition: all .18s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    }
    .btn:active { transform: scale(0.96); }
    .btn:disabled { opacity: .3; cursor: not-allowed; pointer-events: none; }

    .btn-copper {
      background: linear-gradient(135deg, var(--cu) 0%, var(--cu-hi) 100%);
      color: #0A0808;
      padding: 9px 20px;
      border-radius: 3px;
      font-weight: 600;
      box-shadow: 0 1px 0 rgba(255,255,255,0.08) inset, 0 4px 16px rgba(193,127,58,0.2);
    }
    .btn-copper:hover {
      box-shadow: 0 1px 0 rgba(255,255,255,0.12) inset, 0 6px 24px rgba(193,127,58,0.35);
      transform: translateY(-1px);
    }

    .btn-outline {
      background: transparent;
      color: var(--t2);
      padding: 8px 14px;
      border-radius: 3px;
      border: 1px solid var(--line2);
    }
    .btn-outline:hover { background: var(--ink3); color: var(--t1); border-color: var(--line2); }

    .btn-ghost {
      background: transparent;
      color: var(--t3);
      padding: 5px 6px;
      border-radius: 3px;
      border: 1px solid transparent;
    }
    .btn-ghost:hover { background: var(--ink3); color: var(--t2); border-color: var(--line); }

    /* ── Inputs ── */
    input, textarea {
      font-family: var(--body);
      font-size: 13px;
      background: var(--ink2);
      border: 1px solid var(--line);
      color: var(--t1);
      border-radius: 3px;
      transition: border-color .15s, box-shadow .15s;
    }
    input:focus, textarea:focus {
      outline: none;
      border-color: var(--cu-lo);
      box-shadow: 0 0 0 3px var(--cu-tint);
    }
    input::placeholder, textarea::placeholder { color: var(--t3); font-size: 12.5px; }

    /* ── Confidence badge ── */
    .conf-high { color: var(--mint);  background: var(--mint-tint);  }
    .conf-med  { color: var(--cu-hi); background: var(--cu-tint);    }
    .conf-low  { color: var(--rose);  background: var(--rose-tint);  }
    .conf-na   { color: var(--t3);    background: transparent;       }

    /* ── Rule ── */
    .rule { height:1px; background: var(--line); flex-shrink:0; }

    /* ── Mono label ── */
    .mlabel {
      font-family: var(--mono);
      font-size: 9px;
      letter-spacing: .15em;
      text-transform: uppercase;
      color: var(--t3);
    }

    /* ── Copper dot ── */
    .live {
      width: 5px; height: 5px; border-radius: 50%;
      background: var(--mint);
      animation: breathe 2.5s ease-in-out infinite;
    }

    /* ── Skeleton shimmer ── */
    .shimmer {
      background: linear-gradient(90deg, var(--ink3) 25%, var(--ink4) 50%, var(--ink3) 75%);
      background-size: 400px 100%;
      animation: shimmer 1.6s infinite linear;
    }
  `}</style>
);

// ─── SVG ICONS ────────────────────────────────────────────────────────────────
const Icon = ({ n, s = 14, c = "currentColor", sw = 1.6 }) => {
  const paths = {
    lock:    <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
    mail:    <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
    file:    <><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></>,
    check:   <polyline points="20 6 9 17 4 12"/>,
    x:       <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    right:   <polyline points="9 18 15 12 9 6"/>,
    down:    <polyline points="6 9 12 15 18 9"/>,
    send:    <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
    refresh: <><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></>,
    eye:     <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    dl:      <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    search:  <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    edit2:   <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    list:    <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
    star:    <><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></>,
    out:     <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    up:      <><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></>,
    plus:    <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    trash:   <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></>,
    warn:    <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
    inbox:   <><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></>,
    zap:     <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
    layers:  <><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>,
  };
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {paths[n]}
    </svg>
  );
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const confClass = (c) => c === 0 ? "conf-na" : c >= 0.85 ? "conf-high" : c >= 0.7 ? "conf-med" : "conf-low";
const confLabel = (c) => c === 0 ? "—" : c >= 0.85 ? "HIGH" : c >= 0.7 ? "MED" : "LOW";
const confColor = (c) => c === 0 ? "var(--t3)" : c >= 0.85 ? "var(--mint)" : c >= 0.7 ? "var(--cu-hi)" : "var(--rose)";

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const LoginPage = ({ onLogin }) => {
  const [mode, setMode]     = useState("login");
  const [email, setEmail]   = useState("");
  const [pw, setPw]         = useState("");
  const [busy, setBusy]     = useState(false);
  const [err, setErr]       = useState("");

  const handle = async () => {
    if (!email || !pw) { setErr("Both fields are required."); return; }
    setBusy(true); setErr("");
    try {
      const { data } = await api.post(`/auth/${mode}`, { email, password: pw });
      localStorage.setItem("token", data.access_token);
      onLogin({ email: data.email, user_id: data.user_id, name: data.email.split("@")[0] });
    } catch (e) {
      setErr(e.response?.data?.detail || "Authentication failed.");
    } finally { setBusy(false); }
  };

  return (
    <div style={{
      minHeight:"100vh", background:"var(--ink)",
      display:"flex", alignItems:"stretch",
    }}>
      {/* Left decorative panel */}
      <div style={{
        width:"42%", background:"var(--ink1)",
        borderRight:"1px solid var(--line)",
        display:"flex", flexDirection:"column",
        justifyContent:"space-between",
        padding:"48px 52px",
        position:"relative", overflow:"hidden",
      }}>
        {/* Grid pattern */}
        <div style={{
          position:"absolute", inset:0, opacity:.04,
          backgroundImage:`
            linear-gradient(var(--line) 1px,transparent 1px),
            linear-gradient(90deg,var(--line) 1px,transparent 1px)`,
          backgroundSize:"40px 40px",
        }}/>
        {/* Copper radial */}
        <div style={{
          position:"absolute", bottom:"-10%", right:"-10%",
          width:400, height:400, borderRadius:"50%",
          background:"radial-gradient(circle, rgba(193,127,58,0.08) 0%, transparent 65%)",
          pointerEvents:"none",
        }}/>
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:64 }}>
            <div style={{
              width:36, height:36,
              background:"linear-gradient(135deg,var(--cu),var(--cu-hi))",
              borderRadius:4,
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:"0 4px 20px rgba(193,127,58,0.35)",
            }}>
              <Icon n="layers" s={18} c="#060608" sw={2}/>
            </div>
            <span style={{ fontFamily:"var(--serif)", fontSize:22, fontWeight:700, color:"var(--t1)" }}>
              QuestFill
            </span>
          </div>
          <h2 style={{
            fontFamily:"var(--serif)", fontSize:34, fontWeight:400,
            color:"var(--t1)", lineHeight:1.25, marginBottom:20,
            letterSpacing:"-0.01em",
          }}>
            AI-powered<br/>
            <em style={{ color:"var(--cu)" }}>questionnaire</em><br/>
            completion.
          </h2>
          <p style={{ fontFamily:"var(--body)", fontSize:14, color:"var(--t2)", lineHeight:1.75, maxWidth:320 }}>
            Upload reference documents and questionnaires. Let the RAG pipeline find, extract, and cite answers automatically.
          </p>
        </div>
        <div style={{ position:"relative", zIndex:1 }}>
          {[
            ["Vector Search", "Qdrant semantic retrieval"],
            ["LLM Generation", "Gemini 2.0 Flash"],
            ["Auto Citations", "Page-level attribution"],
          ].map(([a, b]) => (
            <div key={a} style={{
              display:"flex", alignItems:"center", gap:12,
              padding:"10px 0",
              borderTop:"1px solid var(--line)",
            }}>
              <div style={{
                width:6, height:6, borderRadius:"50%",
                background:"var(--cu)", flexShrink:0,
                boxShadow:"0 0 8px var(--cu-glow)",
              }}/>
              <div>
                <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--t1)", letterSpacing:".08em" }}>{a}</div>
                <div style={{ fontFamily:"var(--body)", fontSize:11.5, color:"var(--t3)", marginTop:1 }}>{b}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div style={{
        flex:1, display:"flex", alignItems:"center", justifyContent:"center",
        padding:"48px 32px",
      }}>
        <div className="fade-up" style={{ width:"100%", maxWidth:380 }}>
          <div style={{ marginBottom:36 }}>
            <h3 style={{ fontFamily:"var(--serif)", fontSize:26, fontWeight:400, color:"var(--t1)", marginBottom:6 }}>
              {mode === "login" ? "Welcome back" : "Create account"}
            </h3>
            <p style={{ fontFamily:"var(--body)", fontSize:13.5, color:"var(--t2)" }}>
              {mode === "login" ? "Sign in to your workspace" : "Start your free workspace"}
            </p>
          </div>

          {/* Mode toggle */}
          <div style={{
            display:"flex", marginBottom:28,
            background:"var(--ink2)", borderRadius:4, padding:3,
            border:"1px solid var(--line)",
          }}>
            {[["login","Sign In"],["signup","Sign Up"]].map(([m,l]) => (
              <button key={m} onClick={()=>{ setMode(m); setErr(""); }} className="btn" style={{
                flex:1, justifyContent:"center", padding:"8px",
                background: mode===m ? "var(--ink4)" : "transparent",
                color: mode===m ? "var(--t1)" : "var(--t3)",
                borderRadius:2,
                border: mode===m ? "1px solid var(--line2)" : "1px solid transparent",
                fontSize:10, letterSpacing:".1em",
                transition:"all .2s cubic-bezier(0.16,1,0.3,1)",
              }}>{l}</button>
            ))}
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {[
              { lbl:"Email Address", icon:"mail", type:"email",    val:email, set:setEmail,  ph:"you@company.com" },
              { lbl:"Password",      icon:"lock", type:"password", val:pw,    set:setPw,     ph:"••••••••••" },
            ].map(f => (
              <div key={f.lbl}>
                <label style={{
                  display:"block", marginBottom:6,
                  fontFamily:"var(--mono)", fontSize:"9px", color:"var(--t3)",
                  letterSpacing:".14em", textTransform:"uppercase",
                  fontFamily:"var(--mono)", fontSize:"9px",
                }}>{f.lbl}</label>
                <div style={{ position:"relative" }}>
                  <span style={{
                    position:"absolute", left:12, top:"50%",
                    transform:"translateY(-50%)", color:"var(--t3)",
                    pointerEvents:"none",
                  }}>
                    <Icon n={f.icon} s={13}/>
                  </span>
                  <input
                    type={f.type} value={f.val}
                    onChange={e=>f.set(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&handle()}
                    placeholder={f.ph}
                    style={{ width:"100%", padding:"11px 12px 11px 37px", borderRadius:3 }}
                  />
                </div>
              </div>
            ))}

            {err && (
              <div style={{
                display:"flex", alignItems:"center", gap:8,
                padding:"9px 12px",
                background:"var(--rose-tint)",
                border:"1px solid rgba(224,92,106,0.25)",
                borderRadius:3,
                fontFamily:"var(--mono)", fontSize:10.5, color:"var(--rose)",
                letterSpacing:".04em",
              }}>
                <Icon n="warn" s={12} c="var(--rose)"/> {err}
              </div>
            )}

            <button
              className="btn btn-copper"
              onClick={handle}
              disabled={busy}
              style={{ width:"100%", justifyContent:"center", padding:"12px 20px", marginTop:4, fontSize:11 }}
            >
              {busy
                ? <><span style={{ animation:"spin 1s linear infinite", display:"inline-block" }}>◌</span>&nbsp;Please wait…</>
                : mode==="login" ? "Sign In →" : "Create Account →"
              }
            </button>
          </div>

          <p style={{
            textAlign:"center", marginTop:24,
            fontFamily:"var(--mono)", fontSize:9.5, color:"var(--t4)",
            letterSpacing:".1em", textTransform:"uppercase",
          }}>
            Supabase Auth · TLS 1.3 · Zero PII Logging
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── TOPBAR ───────────────────────────────────────────────────────────────────
const TopBar = ({ user, activeQ, onLogout, onExport, selectedCount, onImprove, generating }) => (
  <div style={{
    height:52, background:"var(--ink1)",
    borderBottom:"1px solid var(--line)",
    display:"flex", alignItems:"center", justifyContent:"space-between",
    padding:"0 18px", flexShrink:0,
    boxShadow:"0 1px 0 var(--line)",
  }}>
    {/* Left */}
    <div style={{ display:"flex", alignItems:"center", gap:20 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div style={{
          width:28, height:28,
          background:"linear-gradient(135deg,var(--cu),var(--cu-hi))",
          borderRadius:4,
          display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:"0 2px 10px rgba(193,127,58,0.3)",
        }}>
          <Icon n="layers" s={14} c="#060608" sw={2}/>
        </div>
        <span style={{ fontFamily:"var(--serif)", fontSize:17, fontWeight:700, color:"var(--t1)", letterSpacing:"-0.01em" }}>
          QuestFill
        </span>
      </div>

      {activeQ && (
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ color:"var(--line2)", fontSize:16 }}>›</span>
          <span style={{
            fontFamily:"var(--body)", fontSize:13, color:"var(--t2)",
            fontWeight:500, maxWidth:220,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
          }}>
            {activeQ.name}
          </span>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div className="live"/>
            <span style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--mint)", letterSpacing:".12em" }}>LIVE</span>
          </div>
        </div>
      )}
    </div>

    {/* Right */}
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      {generating && (
        <div style={{
          display:"flex", alignItems:"center", gap:7,
          fontFamily:"var(--mono)", fontSize:10, color:"var(--cu)",
          padding:"5px 12px",
          background:"var(--cu-tint)",
          border:"1px solid rgba(193,127,58,0.2)",
          borderRadius:3,
          letterSpacing:".08em",
        }}>
          <span style={{ animation:"spin 0.9s linear infinite", display:"inline-block" }}>◌</span>
          GENERATING
        </div>
      )}
      {selectedCount > 0 && (
        <button className="btn btn-outline" onClick={onImprove} style={{ gap:5, padding:"7px 14px" }}>
          <Icon n="star" s={11}/> Improve {selectedCount}
        </button>
      )}
      {activeQ && (
        <button className="btn btn-copper" onClick={onExport} style={{ gap:6, padding:"7px 16px" }}>
          <Icon n="dl" s={11}/> Export
        </button>
      )}
      <div style={{ width:1, height:18, background:"var(--line)", margin:"0 4px" }}/>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <div style={{
          width:28, height:28, borderRadius:"50%",
          background:"var(--ink3)", border:"1px solid var(--line2)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontFamily:"var(--mono)", fontSize:11, color:"var(--cu)", fontWeight:600,
        }}>
          {user.name[0].toUpperCase()}
        </div>
        <span style={{ fontFamily:"var(--body)", fontSize:13, color:"var(--t2)", fontWeight:500 }}>{user.name}</span>
        <button className="btn btn-ghost" onClick={onLogout} title="Sign out" style={{ padding:"5px 6px" }}>
          <Icon n="out" s={13}/>
        </button>
      </div>
    </div>
  </div>
);

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const Sidebar = ({ docs, questionnaires, activeQId, onSelectQ, onUploadDoc, onUploadQ, onDeleteQ }) => {
  const [docsOpen, setDocsOpen] = useState(true);
  const [qOpen, setQOpen]       = useState(true);

  const SectionHead = ({ label, count, open, toggle }) => (
    <button onClick={toggle} style={{
      width:"100%", display:"flex", alignItems:"center",
      justifyContent:"space-between",
      padding:"7px 14px",
      background:"none", border:"none", cursor:"pointer",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span className="mlabel" style={{ fontSize:"12px" }}>{label}</span>
        {count > 0 && (
          <span style={{
            fontFamily:"var(--mono)", fontSize:"12px",
            color:"var(--t3)", background:"var(--ink3)",
            padding:"1px 5px", borderRadius:2,
            border:"1px solid var(--line)",
          }}>{count}</span>
        )}
      </div>
      <span style={{
        color:"var(--t4)",
        transform: open ? "rotate(0)" : "rotate(-90deg)",
        transition:"transform .2s cubic-bezier(0.16,1,0.3,1)",
        display:"flex",
      }}>
        <Icon n="down" s={11}/>
      </span>
    </button>
  );

  return (
    <div style={{
      width:230, background:"var(--ink1)",
      borderRight:"1px solid var(--line)",
      display:"flex", flexDirection:"column",
      flexShrink:0, overflow:"hidden",
    }}>
      <div style={{ flex:1, overflowY:"auto", paddingTop:8, paddingBottom:20 }}>

        {/* Documents */}
        <SectionHead label="References" count={docs.length} open={docsOpen} toggle={()=>setDocsOpen(v=>!v)}/>
        {docsOpen && (
          <div style={{ paddingBottom:8 }}>
            {docs.length === 0 ? (
              <p style={{ padding:"2px 20px 10px", fontFamily:"var(--mono)", fontSize:12, color:"var(--t4)", fontStyle:"italic" }}>
                No documents
              </p>
            ) : docs.map(d => (
              <div key={d.id} style={{
                display:"flex", alignItems:"center", gap:9,
                padding:"5px 14px 5px 20px",
              }}>
                <div style={{
                  width:20, height:20, flexShrink:0, borderRadius:3,
                  background:"var(--cu-tint)", border:"1px solid rgba(193,127,58,0.15)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  <Icon n="file" s={10} c="var(--cu)"/>
                </div>
                <span style={{
                  fontFamily:"var(--body)", fontSize:11.5, color :"var(--t5)",
                  fontWeight:500, overflow:"hidden", textOverflow:"ellipsis",
                  whiteSpace:"nowrap", flex:1,
                }}>{d.file_name}</span>
              </div>
            ))}
            <div style={{ padding:"6px 14px 0 20px" }}>
              <button className="btn btn-outline" style={{ fontSize:12, padding:"5px 10px", gap:4, width:"100%", justifyContent:"center" }} onClick={onUploadDoc}>
                <Icon n="up" s={9}/> Upload
              </button>
            </div>
          </div>
        )}

        <div className="rule" style={{ margin:"8px 14px" }}/>

        {/* Questionnaires */}
        <SectionHead label="Questionnaires" count={questionnaires.length} open={qOpen} toggle={()=>setQOpen(v=>!v)}/>
        {qOpen && (
          <div style={{ paddingBottom:8 }}>
            {questionnaires.length === 0 ? (
              <p style={{ padding:"2px 20px 10px", fontFamily:"var(--mono)", fontSize:12, color:"var(--t4)", fontStyle:"italic" }}>
                No questionnaires
              </p>
            ) : questionnaires.map(q => {
              const active = activeQId === q.id;
              return (
                <div key={q.id} style={{
                  margin:"1px 8px",
                  borderRadius:3,
                  background: active ? "var(--cu-tint)" : "transparent",
                  border: active ? "1px solid rgba(193,127,58,0.18)" : "1px solid transparent",
                  transition:"all .15s ease",
                }}
                  onMouseEnter={e=>{ if(!active) e.currentTarget.style.background="var(--ink3)"; }}
                  onMouseLeave={e=>{ if(!active) e.currentTarget.style.background="transparent"; }}
                >
                  <div style={{ display:"flex", alignItems:"center", padding:"8px 10px" }}>
                    <div onClick={()=>onSelectQ(q)} style={{
                      flex:1, display:"flex", alignItems:"center",
                      gap:9, cursor:"pointer", minWidth:0,
                    }}>
                      <Icon n="list" s={12} c={active ? "var(--cu)" : "var(--t3)"}/>
                      <div style={{ minWidth:0 }}>
                        <div style={{
                          fontFamily:"var(--body)", fontSize:12.5,
                          color: active ? "var(--cu-hi)" : "var(--t2)",
                          fontWeight: active ? 600 : 400,
                          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                        }}>{q.name}</div>
                        <div style={{ fontFamily:"var(--mono)", fontSize:12, color:"var(--t3)", marginTop:1 }}>
                          {q.question_count ?? "—"} questions
                        </div>
                      </div>
                    </div>
                    <button
                      className="btn btn-ghost"
                      onClick={e=>{ e.stopPropagation(); onDeleteQ(q.id); }}
                      style={{ opacity:0, padding:"3px", transition:"opacity .15s", color:"var(--rose)" }}
                      onMouseEnter={e=>e.currentTarget.style.opacity="1"}
                      onMouseLeave={e=>e.currentTarget.style.opacity="0"}
                    >
                      <Icon n="trash" s={12} c="var(--rose)"/>
                    </button>
                  </div>
                </div>
              );
            })}
            <div style={{ padding:"8px 8px 0" }}>
              <button className="btn btn-outline" style={{ fontSize:12, padding:"5px 10px", gap:4, width:"100%", justifyContent:"center" }} onClick={onUploadQ}>
                <Icon n="up" s={9}/> Upload
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── COVERAGE BAR ─────────────────────────────────────────────────────────────
const CoverageBar = ({ questions, answers }) => {
  const total    = questions.length;
  const answered = questions.filter(q => answers[q.id]?.confidence > 0).length;
  const pct      = total ? Math.round(answered / total * 100) : 0;

  return (
    <div style={{
      display:"flex", alignItems:"center", gap:22,
      padding:"8px 20px",
      background:"var(--ink1)", borderBottom:"1px solid var(--line)",
      flexShrink:0,
    }}>
      <span className="mlabel">Coverage</span>
      <div style={{ flex:1, maxWidth:160, height:2, background:"var(--ink3)", borderRadius:2 }}>
        <div style={{
          width:`${pct}%`, height:"100%", borderRadius:2,
          background:"linear-gradient(90deg,var(--mint),#34D399)",
          transition:"width .8s cubic-bezier(0.16,1,0.3,1)",
          boxShadow:"0 0 10px rgba(0,201,167,0.35)",
        }}/>
      </div>
      <span style={{ fontFamily:"var(--mono)", fontSize:13, fontWeight:600, color:"var(--mint)" }}>{pct}%</span>
      <div style={{ width:1, height:14, background:"var(--line)" }}/>
      {[["Total",total,"var(--t2)"],["Found",answered,"var(--mint)"],["Missing",total-answered,"var(--rose)"]].map(([l,v,c]) => (
        <div key={l} style={{ display:"flex", alignItems:"baseline", gap:5 }}>
          <span style={{ fontFamily:"var(--mono)", fontSize:16, fontWeight:600, color:c }}>{v}</span>
          <span className="mlabel" style={{ fontSize:"8px" }}>{l}</span>
        </div>
      ))}
    </div>
  );
};

// ─── ADD QUESTION ROW ─────────────────────────────────────────────────────────
const AddQuestionRow = ({ onAdd, loading }) => {
  const [val, setVal] = useState("");
  const ref = useRef();

  const submit = () => {
    const t = val.trim(); if (!t) return;
    onAdd(t); setVal(""); ref.current?.focus();
  };

  return (
    <div style={{
      display:"flex", alignItems:"center",
      borderBottom:"1px solid var(--line)",
      background:"rgba(193,127,58,0.025)",
      borderLeft:"2px solid var(--cu-lo)",
    }}>
      <div style={{ width:44, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <Icon n="plus" s={13} c="var(--cu-lo)"/>
      </div>
      <div style={{ flex:1, padding:"10px 14px 10px 0" }}>
        <input
          ref={ref}
          value={val}
          onChange={e=>setVal(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter") submit(); if(e.key==="Escape") setVal(""); }}
          placeholder="Type a question and press Enter…"
          style={{ width:"100%", padding:"8px 12px", borderRadius:3, border:"1px dashed var(--line2)" }}
        />
      </div>
      <div style={{ width:68, display:"flex", justifyContent:"center", flexShrink:0 }}>
        <button
          onClick={submit} disabled={!val.trim()||loading}
          className="btn"
          style={{
            fontFamily:"var(--mono)", fontSize:9, color:"var(--cu)",
            padding:"5px 10px", letterSpacing:".1em",
            background:"var(--cu-tint)", border:"1px solid rgba(193,127,58,0.2)", borderRadius:2,
          }}
        >
          {loading ? "◌" : "ADD"}
        </button>
      </div>
    </div>
  );
};

// ─── QUESTION ROW ─────────────────────────────────────────────────────────────
const QuestionRow = ({ q, answer, selected, onSelect, onSeeMore, onDelete, idx, generated }) => {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing]   = useState(false);
  const [editText, setEditText] = useState(answer?.answer_text || "");
  const notFound = !answer || answer.confidence === 0;

  useEffect(() => { if (answer?.answer_text) setEditText(answer.answer_text); }, [answer]);

  const saveEdit = async () => {
    try { await api.put(`/answers/${answer.id}`, { answer_text: editText }); setEditing(false); }
    catch { setEditing(false); }
  };

  return (
    <div
      className="slide-in"
      style={{
        borderBottom:"1px solid var(--line)",
        background: selected ? "rgba(193,127,58,0.03)" : "transparent",
        animationDelay:`${idx * 18}ms`,
        transition:"background .15s ease",
      }}
    >
      <div style={{ display:"flex", alignItems:"stretch" }}>
        {/* Checkbox */}
        <div style={{ width:44, display:"flex", alignItems:"flex-start", justifyContent:"center", paddingTop:17, flexShrink:0 }}>
          <div
            onClick={() => onSelect(q.id)}
            style={{
              width:15, height:15, borderRadius:2,
              border: selected ? "2px solid var(--cu)" : "2px solid var(--line2)",
              background: selected ? "var(--cu)" : "transparent",
              cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
              transition:"all .15s",
              boxShadow: selected ? "0 0 10px var(--cu-glow)" : "none",
              flexShrink:0,
            }}
          >
            {selected && <Icon n="check" s={9} c="#0A0808" sw={2.5}/>}
          </div>
        </div>

        {/* Index */}
        <div style={{ width:34, paddingTop:16, flexShrink:0 }}>
          <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--t3)", fontWeight:500 }}>
            {String(idx + 1).padStart(2, "0")}
          </span>
        </div>

        {/* Main content */}
        <div style={{ flex:1, padding:"13px 14px 14px 0" }}>
          <div style={{
            fontFamily:"var(--body)", fontSize:13.5, color:"var(--t1)",
            lineHeight:1.6, fontWeight:500,
            marginBottom: generated ? 11 : 0,
          }}>
            {q.question_text}
          </div>

          {generated && (
            editing ? (
              <div>
                <textarea
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  style={{
                    width:"100%", padding:"10px 12px",
                    fontSize:13, lineHeight:1.65, minHeight:80,
                    resize:"vertical", borderRadius:3,
                  }}
                />
                <div style={{ display:"flex", gap:7, marginTop:8 }}>
                  <button className="btn btn-copper" style={{ fontSize:9.5, padding:"6px 14px" }} onClick={saveEdit}>Save</button>
                  <button className="btn btn-outline" style={{ fontSize:9.5, padding:"5px 12px" }} onClick={() => { setEditing(false); setEditText(answer?.answer_text || ""); }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{
                background: notFound ? "rgba(224,92,106,0.04)" : "var(--ink2)",
                border:`1px solid ${notFound ? "rgba(224,92,106,0.18)" : "var(--line)"}`,
                borderRadius:4, padding:"11px 13px",
              }}>
                <p style={{
                  fontFamily:"var(--body)", fontSize:13, lineHeight:1.7,
                  color: notFound ? "var(--t3)" : "var(--t1)",
                  fontStyle: notFound ? "italic" : "normal",
                }}>
                  {editText || answer?.answer_text || "—"}
                </p>

                {answer?.citation && (
                  <div style={{
                    display:"flex", alignItems:"center", gap:7, marginTop:10,
                    padding:"5px 10px",
                    background:"var(--ink3)", borderRadius:2,
                    border:"1px solid var(--line)", width:"fit-content",
                  }}>
                    <Icon n="file" s={10} c="var(--t3)"/>
                    <span style={{ fontFamily:"var(--mono)", fontSize:9.5, color:"var(--t2)" }}>{answer.citation}</span>
                  </div>
                )}

                {expanded && answer?.evidence && (
                  <div style={{
                    marginTop:11, padding:"10px 13px",
                    background:"var(--ink3)", borderRadius:3,
                    borderLeft:"2px solid var(--cu-lo)",
                  }}>
                    <div className="mlabel" style={{ marginBottom:6 }}>Evidence Snippet</div>
                    <p style={{
                      fontFamily:"var(--mono)", fontSize:10.5,
                      color:"var(--t2)", lineHeight:1.75, fontStyle:"italic",
                    }}>
                      "{answer.evidence}"
                    </p>
                  </div>
                )}

                <div style={{ display:"flex", alignItems:"center", gap:7, marginTop:10 }}>
                  {answer?.evidence && (
                    <button className="btn btn-ghost" style={{ fontSize:9, gap:4, color:"var(--t2)", border:"1px solid var(--line)", padding:"4px 9px" }}
                      onClick={() => setExpanded(v => !v)}>
                      <Icon n="eye" s={10}/> {expanded ? "Hide" : "Evidence"}
                    </button>
                  )}
                  {answer?.citation && (
                    <button className="btn btn-ghost"
                      style={{ fontSize:9, gap:4, color:"var(--sky)", border:"1px solid rgba(91,156,246,0.2)", padding:"4px 9px", background:"var(--sky-tint)" }}
                      onClick={() => onSeeMore(answer)}>
                      <Icon n="right" s={10}/> Source
                    </button>
                  )}
                  {!notFound && (
                    <button className="btn btn-ghost" style={{ fontSize:9, gap:4, color:"var(--t2)", border:"1px solid var(--line)", padding:"4px 9px" }}
                      onClick={() => setEditing(true)}>
                      <Icon n="edit2" s={10}/> Edit
                    </button>
                  )}
                </div>
              </div>
            )
          )}
        </div>

        {/* Confidence */}
        <div style={{
          width:72, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"flex-start",
          paddingTop:15, gap:5, flexShrink:0,
        }}>
          {generated && answer && (
            <>
              <span style={{
                fontFamily:"var(--mono)", fontSize:15, fontWeight:600,
                color: confColor(answer.confidence),
              }}>
                {answer.confidence === 0 ? "—" : Math.round(answer.confidence * 100)}
              </span>
              <span style={{
                fontFamily:"var(--mono)", fontSize:8.5, letterSpacing:".1em",
                padding:"2px 6px", borderRadius:2,
                fontWeight:500, textTransform:"uppercase",
              }} className={confClass(answer.confidence)}>
                {confLabel(answer.confidence)}
              </span>
            </>
          )}
          {!generated && (
            <button className="btn btn-ghost" onClick={() => onDelete(q.id)}>
              <Icon n="trash" s={12} c="var(--t3)"/>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── PDF VIEWER ───────────────────────────────────────────────────────────────
const PDFViewer = ({ answer, onClose }) => {
  const [url, setUrl]     = useState(null);
  const [loading, setL]   = useState(true);
  const [error, setE]     = useState(false);
  const [height, setH]    = useState(320);
  const startY            = useRef(null);
  const startH            = useRef(null);

  const filename = answer?.citation?.split(" page ")[0]?.trim();

  useEffect(() => {
    if (!filename) { setL(false); setE(true); return; }
    api.get(`/documents/file/${encodeURIComponent(filename)}`)
      .then(({ data }) => { setUrl(data.url); setL(false); })
      .catch(() => { setE(true); setL(false); });
  }, [filename]);

  const onMouseDown = (e) => {
    startY.current = e.clientY; startH.current = height;
    const onMove = mv => setH(Math.max(160, Math.min(700, startH.current + (startY.current - mv.clientY))));
    const onUp   = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div className="fade-in" style={{
      height, background:"var(--ink1)",
      borderTop:"1px solid var(--line)",
      display:"flex", flexDirection:"column", flexShrink:0,
    }}>
      <div onMouseDown={onMouseDown} style={{
        height:6, flexShrink:0, cursor:"ns-resize",
        background:"var(--ink2)", borderBottom:"1px solid var(--line)",
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        <div style={{ width:28, height:2, borderRadius:1, background:"var(--line2)" }}/>
      </div>
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"6px 14px", borderBottom:"1px solid var(--line)", flexShrink:0,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
          <Icon n="file" s={12} c="var(--cu)"/>
          <span style={{ fontFamily:"var(--mono)", fontSize:10.5, color:"var(--t2)" }}>{answer.citation}</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span className="mlabel" style={{ fontSize:"8px" }}>drag to resize</span>
          <button className="btn btn-ghost" onClick={onClose}><Icon n="x" s={13}/></button>
        </div>
      </div>
      <div style={{ flex:1, overflow:"hidden", position:"relative" }}>
        {loading && (
          <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",gap:10 }}>
            <span style={{ animation:"spin 1s linear infinite",display:"inline-block",color:"var(--t3)",fontSize:16 }}>◌</span>
            <span style={{ fontFamily:"var(--mono)",fontSize:11,color:"var(--t3)" }}>Loading…</span>
          </div>
        )}
        {error && !loading && (
          <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8 }}>
            <Icon n="warn" s={22} c="var(--t3)"/>
            <span style={{ fontFamily:"var(--mono)",fontSize:11,color:"var(--t3)" }}>Could not load document</span>
          </div>
        )}
        {url && !loading && (
          <iframe src={url} title={filename} style={{ width:"100%",height:"100%",border:"none",background:"#fff" }}/>
        )}
      </div>
    </div>
  );
};

// ─── ASK BOX ─────────────────────────────────────────────────────────────────
const AskBox = () => {
  const [val, setVal]     = useState("");
  const [busy, setBusy]   = useState(false);
  const [res, setRes]     = useState(null);

  const ask = async () => {
    if (!val.trim()) return;
    setBusy(true); setRes(null);
    try {
      const { data } = await api.post("/answers/ask", { question: val });
      setRes(data);
    } catch { setRes({ answer_text:"Could not reach server.", citation:null }); }
    finally { setBusy(false); }
  };

  return (
    <div style={{
      padding:"10px 18px",
      background:"var(--ink1)", borderBottom:"1px solid var(--line)",
      flexShrink:0,
    }}>
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        <div style={{ position:"relative", flex:1 }}>
          <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:"var(--t3)", pointerEvents:"none" }}>
            <Icon n="search" s={12}/>
          </span>
          <input
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => e.key==="Enter" && ask()}
            placeholder="Ask anything against your reference documents…"
            style={{ width:"100%", padding:"9px 12px 9px 34px", borderRadius:3 }}
          />
        </div>
        <button className="btn btn-copper" onClick={ask} disabled={busy || !val.trim()} style={{ padding:"9px 16px", gap:6 }}>
          {busy ? "◌" : <><Icon n="send" s={11}/> Ask</>}
        </button>
      </div>
      {res && (
        <div className="fade-in" style={{
          marginTop:9, padding:"10px 13px",
          background:"var(--ink2)", borderRadius:3,
          border:"1px solid var(--line)",
          boxShadow:"0 4px 16px rgba(0,0,0,0.25)",
        }}>
          <p style={{ fontFamily:"var(--body)", fontSize:13, color:"var(--t1)", lineHeight:1.65 }}>
            {res.answer_text || res.answer}
          </p>
          {res.citation && (
            <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:7 }}>
              <Icon n="file" s={10} c="var(--t3)"/>
              <span style={{ fontFamily:"var(--mono)", fontSize:9.5, color:"var(--t3)" }}>{res.citation}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── UPLOAD MODAL ─────────────────────────────────────────────────────────────
const UploadModal = ({ type, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState("");
  const ref             = useRef();

  const accept   = type === "doc" ? ".pdf,.txt" : ".pdf,.xlsx,.xls,.csv";
  const endpoint = type === "doc" ? "/documents/upload" : "/questionnaires/upload";

  const upload = async () => {
    if (!file) return;
    setBusy(true); setErr("");
    const form = new FormData();
    form.append("file", file);
    try {
      const { data } = await api.post(endpoint, form, { headers:{ "Content-Type":"multipart/form-data" } });
      onSuccess(data);
    } catch(e) {
      setErr(e.response?.data?.detail || "Upload failed.");
    } finally { setBusy(false); }
  };

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:1000,
      background:"rgba(4,4,6,0.88)",
      display:"flex", alignItems:"center", justifyContent:"center",
      backdropFilter:"blur(6px)",
    }} onClick={onClose}>
      <div className="fade-up" style={{
        background:"var(--ink1)", border:"1px solid var(--line)",
        borderRadius:6, padding:"28px 28px 24px", width:400,
        boxShadow:"0 48px 100px rgba(0,0,0,0.7), 0 0 0 0.5px rgba(255,255,255,0.03) inset",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:22 }}>
          <div>
            <h3 style={{ fontFamily:"var(--serif)", fontSize:20, fontWeight:400, color:"var(--t1)" }}>
              Upload {type === "doc" ? "Reference" : "Questionnaire"}
            </h3>
            <p className="mlabel" style={{ marginTop:5, fontSize:"9px" }}>
              {accept.replaceAll(".", "")} accepted
            </p>
          </div>
          <button className="btn btn-ghost" onClick={onClose}><Icon n="x" s={15}/></button>
        </div>

        <div
          onClick={() => ref.current.click()}
          style={{
            border: file ? "1.5px solid rgba(193,127,58,0.4)" : "1.5px dashed var(--line2)",
            borderRadius:4, padding:"32px 20px",
            textAlign:"center", cursor:"pointer", marginBottom:18,
            background: file ? "var(--cu-tint2)" : "var(--ink2)",
            transition:"all .2s ease",
          }}
          onMouseEnter={e => { if(!file) e.currentTarget.style.borderColor="var(--line2)"; }}
          onMouseLeave={e => { if(!file) e.currentTarget.style.borderColor="var(--line2)"; }}
        >
          <Icon n="up" s={28} c={file ? "var(--cu)" : "var(--t3)"}/>
          <p style={{ fontFamily:"var(--body)", fontSize:13.5, color:file?"var(--cu)":"var(--t2)", marginTop:10, fontWeight:file?500:400 }}>
            {file ? file.name : "Click to select a file"}
          </p>
          {!file && <p className="mlabel" style={{ marginTop:5, fontSize:"9px" }}>or drag and drop</p>}
          <input ref={ref} type="file" accept={accept} style={{ display:"none" }}
            onChange={e => setFile(e.target.files[0] || null)}/>
        </div>

        {err && (
          <div style={{
            display:"flex", alignItems:"center", gap:8, marginBottom:14,
            padding:"9px 12px", background:"var(--rose-tint)",
            border:"1px solid rgba(224,92,106,0.2)", borderRadius:3,
            fontFamily:"var(--mono)", fontSize:10.5, color:"var(--rose)",
          }}>
            <Icon n="warn" s={12} c="var(--rose)"/> {err}
          </div>
        )}

        <button className="btn btn-copper" onClick={upload} disabled={!file || busy}
          style={{ width:"100%", justifyContent:"center", padding:"12px 18px", fontSize:11 }}>
          {busy
            ? <><span style={{ animation:"spin 1s linear infinite", display:"inline-block" }}>◌</span>&nbsp;Uploading…</>
            : <><Icon n="up" s={12}/> Upload {type === "doc" ? "Document" : "Questionnaire"}</>
          }
        </button>
      </div>
    </div>
  );
};

// ─── EXPORT MODAL ─────────────────────────────────────────────────────────────
const ExportModal = ({ qId, onClose }) => {
  const [fmt, setFmt]   = useState("pdf");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const doExport = async () => {
    setBusy(true);
    try {
      const resp = await api.post("/export/", { questionnaire_id:qId, format:fmt }, { responseType:"blob" });
      const url  = URL.createObjectURL(resp.data);
      const a    = document.createElement("a");
      a.href = url; a.download = `questionnaire.${fmt}`; a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch { setDone(true); }
    finally { setBusy(false); }
  };

  const fmts = [
    { id:"pdf",  label:"PDF",   sub:"Formatted print-ready report" },
    { id:"docx", label:"Word",  sub:"Editable .docx document"       },
    { id:"xlsx", label:"Excel", sub:"Spreadsheet with all columns"  },
  ];

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:1000,
      background:"rgba(4,4,6,0.88)",
      display:"flex", alignItems:"center", justifyContent:"center",
      backdropFilter:"blur(6px)",
    }} onClick={onClose}>
      <div className="fade-up" style={{
        background:"var(--ink1)", border:"1px solid var(--line)",
        borderRadius:6, padding:"28px", width:380,
        boxShadow:"0 48px 100px rgba(0,0,0,0.7)",
      }} onClick={e => e.stopPropagation()}>
        {!done ? (
          <>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:22 }}>
              <div>
                <h3 style={{ fontFamily:"var(--serif)", fontSize:20, fontWeight:400, color:"var(--t1)" }}>Export Report</h3>
                <p className="mlabel" style={{ marginTop:5, fontSize:"9px" }}>Select output format</p>
              </div>
              <button className="btn btn-ghost" onClick={onClose}><Icon n="x" s={15}/></button>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:7, marginBottom:22 }}>
              {fmts.map(f => (
                <button key={f.id} onClick={() => setFmt(f.id)} style={{
                  display:"flex", alignItems:"center", gap:14,
                  padding:"11px 14px",
                  background: fmt===f.id ? "var(--cu-tint)" : "var(--ink2)",
                  border:`1px solid ${fmt===f.id ? "rgba(193,127,58,0.25)" : "var(--line)"}`,
                  borderRadius:3, cursor:"pointer",
                  transition:"all .15s ease", textAlign:"left", width:"100%",
                }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"var(--mono)", fontSize:11, letterSpacing:".08em", color:fmt===f.id?"var(--cu-hi)":"var(--t1)", fontWeight:500 }}>{f.label}</div>
                    <div style={{ fontFamily:"var(--body)", fontSize:11.5, color:"var(--t3)", marginTop:2 }}>{f.sub}</div>
                  </div>
                  {fmt === f.id && <Icon n="check" s={14} c="var(--cu)"/>}
                </button>
              ))}
            </div>

            <button className="btn btn-copper" onClick={doExport} disabled={busy}
              style={{ width:"100%", justifyContent:"center", padding:"12px 18px", fontSize:11 }}>
              {busy
                ? <><span style={{ animation:"spin 1s linear infinite", display:"inline-block" }}>◌</span>&nbsp;Generating…</>
                : <><Icon n="dl" s={12}/> Export as {fmt.toUpperCase()}</>
              }
            </button>
          </>
        ) : (
          <div style={{ textAlign:"center", padding:"8px 0" }}>
            <div style={{
              width:50, height:50, borderRadius:"50%",
              background:"var(--mint-tint)", border:"1px solid rgba(0,201,167,0.3)",
              display:"flex", alignItems:"center", justifyContent:"center",
              margin:"0 auto 18px",
              boxShadow:"0 0 24px rgba(0,201,167,0.15)",
            }}>
              <Icon n="check" s={22} c="var(--mint)" sw={2}/>
            </div>
            <h3 style={{ fontFamily:"var(--serif)", fontSize:20, marginBottom:8, color:"var(--t1)" }}>Download Started</h3>
            <p style={{ fontFamily:"var(--body)", fontSize:13, color:"var(--t2)", marginBottom:22, lineHeight:1.65 }}>
              Your file should be downloading now.
            </p>
            <button className="btn btn-outline" style={{ width:"100%", justifyContent:"center" }} onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
const EmptyState = ({ onUpload }) => (
  <div style={{
    flex:1, display:"flex",
    flexDirection:"column", alignItems:"center", justifyContent:"center",
    gap:20, padding:48,
    background:`radial-gradient(ellipse 55% 45% at 50% 50%, rgba(193,127,58,0.04) 0%, transparent 70%)`,
  }}>
    {/* Decorative ring */}
    <div style={{ position:"relative" }}>
      <div style={{
        width:80, height:80, borderRadius:"50%",
        border:"1px solid var(--line2)",
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        <div style={{
          width:56, height:56, borderRadius:"50%",
          background:"var(--ink2)", border:"1px solid var(--line)",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <Icon n="inbox" s={24} c="var(--t3)"/>
        </div>
      </div>
      <div style={{
        position:"absolute", top:-4, right:-4,
        width:20, height:20, borderRadius:"50%",
        background:"var(--cu)", border:"2px solid var(--ink)",
        display:"flex", alignItems:"center", justifyContent:"center",
        boxShadow:"0 0 16px var(--cu-glow)",
      }}>
        <Icon n="zap" s={10} c="#0A0808" sw={2}/>
      </div>
    </div>

    <div style={{ textAlign:"center", maxWidth:340 }}>
      <h3 style={{
        fontFamily:"var(--serif)", fontSize:22, fontWeight:400,
        color:"var(--t1)", fontStyle:"italic", marginBottom:10,
      }}>
        No questionnaire selected
      </h3>
      <p style={{ fontFamily:"var(--body)", fontSize:13.5, color:"var(--t2)", lineHeight:1.75 }}>
        Upload a questionnaire — PDF, Excel, or CSV — and the AI will automatically parse questions and generate cited answers from your reference documents.
      </p>
    </div>

    <button className="btn btn-copper" onClick={onUpload} style={{ marginTop:6, padding:"10px 24px", fontSize:11 }}>
      <Icon n="up" s={12}/> Upload Questionnaire
    </button>

    <div style={{ display:"flex", gap:24, marginTop:8 }}>
      {["PDF","XLSX","CSV"].map(f => (
        <span key={f} style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--t4)", letterSpacing:".14em" }}>{f}</span>
      ))}
    </div>
  </div>
);

// ─── GENERATING OVERLAY ───────────────────────────────────────────────────────
const GeneratingOverlay = ({ progress }) => {
  const steps = ["Embedding questions","Searching Qdrant","Generating with Gemini","Attaching citations"];
  const step  = Math.floor(progress / 25);

  return (
    <div style={{
      flex:1, display:"flex",
      flexDirection:"column", alignItems:"center", justifyContent:"center",
      gap:28,
      background:`radial-gradient(ellipse 50% 40% at 50% 50%, rgba(193,127,58,0.04) 0%, transparent 70%)`,
    }}>
      <div style={{ width:240 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <span className="mlabel">Running Pipeline</span>
          <span style={{ fontFamily:"var(--mono)", fontSize:12, fontWeight:600, color:"var(--cu)" }}>{progress}%</span>
        </div>
        <div style={{ height:2, background:"var(--ink3)", borderRadius:1 }}>
          <div style={{
            height:"100%", borderRadius:1,
            width:`${progress}%`,
            background:"linear-gradient(90deg,var(--cu),var(--cu-hi))",
            transition:"width .35s cubic-bezier(0.16,1,0.3,1)",
            boxShadow:"0 0 10px var(--cu-glow)",
          }}/>
        </div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:10, alignItems:"flex-start" }}>
        {steps.map((s, i) => {
          const done   = i < step;
          const active = i === step && progress < 100;
          return (
            <div key={i} style={{
              display:"flex", alignItems:"center", gap:10,
              fontFamily:"var(--mono)", fontSize:10.5,
              color: done ? "var(--mint)" : active ? "var(--cu)" : "var(--t4)",
              letterSpacing:".06em",
              transition:"color .3s ease",
            }}>
              <div style={{
                width:18, height:18, borderRadius:3, flexShrink:0,
                background: done ? "var(--mint-tint)" : active ? "var(--cu-tint)" : "var(--ink3)",
                border: done ? "1px solid rgba(0,201,167,0.3)" : active ? "1px solid rgba(193,127,58,0.3)" : "1px solid var(--line)",
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                {done
                  ? <Icon n="check" s={10} c="var(--mint)" sw={2.5}/>
                  : active
                    ? <span style={{ animation:"spin 0.9s linear infinite", display:"inline-block", fontSize:11 }}>◌</span>
                    : null
                }
              </div>
              {s}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
const Dashboard = ({ user, onLogout }) => {
  const [docs, setDocs]               = useState([]);
  const [questionnaires, setQs]       = useState([]);
  const [activeQ, setActiveQ]         = useState(null);
  const [questions, setQuestions]     = useState([]);
  const [answers, setAnswers]         = useState({});
  const [selected, setSelected]       = useState([]);
  const [generated, setGenerated]     = useState(false);
  const [generating, setGenerating]   = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [pdfAnswer, setPdfAnswer]     = useState(null);
  const [showExport, setShowExport]   = useState(false);
  const [modal, setModal]             = useState(null);
  const [search, setSearch]           = useState("");
  const [addingQ, setAddingQ]         = useState(false);

  useEffect(() => { loadDocs(); loadQs(); }, []);

  const loadDocs      = async () => { try { const {data}=await api.get("/documents/"); setDocs(data); } catch {} };
  const loadQs        = async () => { try { const {data}=await api.get("/questionnaires/"); setQs(data); } catch {} };
  const loadQuestions = async qId => { try { const {data}=await api.get(`/questionnaires/${qId}/questions`); setQuestions(data); } catch {} };

  const selectQ = async (q) => {
    setActiveQ(q); setAnswers({}); setSelected([]); setPdfAnswer(null); setSearch("");
    await loadQuestions(q.id);
    try {
      const { data } = await api.get(`/answers/${q.id}`);
      if (data && Object.keys(data).length > 0) { setAnswers(data); setGenerated(true); }
      else setGenerated(false);
    } catch { setGenerated(false); }
  };

  const handleDocUploaded = () => { loadDocs(); setModal(null); };
  const handleQUploaded   = (data) => {
    const newQ = { id:data.questionnaire_id, name:data.name, question_count:data.question_count };
    setQs(prev => [newQ, ...prev]);
    setActiveQ(newQ); setQuestions(data.questions);
    setGenerated(false); setAnswers({}); setSelected([]);
    setModal(null);
  };

  const handleAddQuestion = async (text) => {
    if (!activeQ) return;
    setAddingQ(true);
    try { const {data}=await api.post(`/questionnaires/${activeQ.id}/questions`,{question_text:text}); setQuestions(prev=>[...prev,data]); }
    catch {} finally { setAddingQ(false); }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!activeQ) return;
    try { await api.delete(`/questionnaires/${activeQ.id}/questions/${qId}`); setQuestions(prev=>prev.filter(q=>q.id!==qId)); }
    catch {}
  };

  const handleGenerate = async () => {
    if (!activeQ) return;
    setGenerating(true); setGenProgress(0);
    const tick = setInterval(() => setGenProgress(p => Math.min(p + 3, 90)), 150);
    try {
      const {data} = await api.post("/answers/generate", { questionnaire_id:activeQ.id });
      clearInterval(tick); setGenProgress(100);
      const map = {};
      for (const a of data.answers) map[a.question_id] = a;
      setAnswers(map); setGenerated(true);
    } catch { clearInterval(tick); }
    finally { setGenerating(false); }
  };

  const handleImprove = async () => {
    if (!activeQ) return;
    setGenerating(true);
    try {
      const {data} = await api.post("/answers/improve", { question_ids:selected, questionnaire_id:activeQ.id });
      const imp = { ...answers };
      for (const a of data.improved) imp[a.question_id] = a;
      setAnswers(imp); setSelected([]);
    } catch {} finally { setGenerating(false); }
  };

  const filteredQ = questions.filter(q => q.question_text.toLowerCase().includes(search.toLowerCase()));

  const handleDeleteQuestionnaire = async (qId) => {
    if (!window.confirm("Delete this questionnaire and all its answers?")) return;
    try {
      await api.delete(`/questionnaires/${qId}`);
      setQs(prev => prev.filter(q => q.id !== qId));
      if (activeQ?.id === qId) { setActiveQ(null); setQuestions([]); setAnswers({}); setSelected([]); setGenerated(false); }
    } catch {}
  };

  const handleBulkDeleteQuestions = async () => {
    if (!activeQ || !selected.length) return;
    if (!window.confirm(`Delete ${selected.length} question(s) and their answers?`)) return;
    try {
      await api.delete(`/questionnaires/${activeQ.id}/questions`, { data:{ question_ids:selected } });
      setQuestions(prev => prev.filter(q => !selected.includes(q.id)));
      const upd = { ...answers };
      selected.forEach(id => delete upd[id]);
      setAnswers(upd); setSelected([]);
    } catch {}
  };

  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column", background:"var(--ink)", overflow:"hidden" }}>
      <TopBar
        user={user} activeQ={activeQ}
        onLogout={() => { localStorage.removeItem("token"); onLogout(); }}
        onExport={() => setShowExport(true)}
        selectedCount={selected.length}
        onImprove={handleImprove}
        generating={generating}
      />

      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
        <Sidebar
          docs={docs} questionnaires={questionnaires} activeQId={activeQ?.id}
          onSelectQ={selectQ}
          onUploadDoc={() => setModal("doc")}
          onUploadQ={() => setModal("q")}
          onDeleteQ={handleDeleteQuestionnaire}
        />

        {/* Main panel */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>
          {generated && <CoverageBar questions={questions} answers={answers}/>}
          <AskBox/>

          {/* Toolbar */}
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"7px 18px",
            background:"var(--ink1)", borderBottom:"1px solid var(--line)",
            flexShrink:0,
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", color:"var(--t3)", pointerEvents:"none" }}>
                  <Icon n="search" s={11}/>
                </span>
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Filter questions…"
                  style={{ width:196, padding:"6px 10px 6px 28px", fontSize:12.5, borderRadius:3 }}
                />
              </div>
              {selected.length > 0 && (
                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <button className="btn btn-outline" style={{ fontSize:9, padding:"4px 10px" }} onClick={() => setSelected([])}>Clear</button>
                  <button onClick={handleBulkDeleteQuestions} className="btn" style={{
                    fontSize:9, padding:"4px 10px", gap:5,
                    color:"var(--rose)", border:"1px solid rgba(224,92,106,0.25)",
                    background:"var(--rose-tint)", borderRadius:3,
                    letterSpacing:".1em", cursor:"pointer",
                    display:"inline-flex", alignItems:"center",
                  }}>
                    <Icon n="trash" s={10} c="var(--rose)"/> Delete {selected.length}
                  </button>
                </div>
              )}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              {activeQ && (
                <span className="mlabel">{filteredQ.length} questions</span>
              )}
              {activeQ && !generated && !generating && (
                <button className="btn btn-copper" onClick={handleGenerate} style={{ padding:"7px 16px", fontSize:10 }}>
                  <Icon n="zap" s={11}/> Generate Answers
                </button>
              )}
              {activeQ && generated && (
                <button className="btn btn-outline" onClick={handleGenerate} style={{ fontSize:9.5, padding:"6px 12px", gap:5 }}>
                  <Icon n="refresh" s={11}/> Regenerate All
                </button>
              )}
            </div>
          </div>

          {/* Column headers */}
          {activeQ && questions.length > 0 && (
            <div style={{
              display:"flex", background:"var(--ink2)",
              borderBottom:"1px solid var(--line)",
              padding:"4px 0", flexShrink:0,
            }}>
              <div style={{ width:44 }}/>
              <div style={{ width:34 }}/>
              <div style={{ flex:1, paddingRight:14 }}>
                <span className="mlabel" style={{ fontSize:"8px" }}>
                  {generated ? "Question / Answer" : "Question"}
                </span>
              </div>
              <div style={{ width:72, textAlign:"center" }}>
                {generated && <span className="mlabel" style={{ fontSize:"8px" }}>Conf.</span>}
              </div>
            </div>
          )}

          {/* Scrollable list — uses flex:1 so empty state fills properly */}
          <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column" }}>
            {!activeQ && (
              <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", width:"100%", height:"100%" }}>
                <EmptyState onUpload={() => setModal("q")}/>
              </div>
            )}
            {activeQ && generating && <GeneratingOverlay progress={genProgress}/>}

            {activeQ && !generating && filteredQ.map((q, i) => (
              <QuestionRow
                key={q.id} q={q} idx={i}
                answer={answers[q.id]}
                selected={selected.includes(q.id)}
                generated={generated}
                onSelect={id => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])}
                onSeeMore={setPdfAnswer}
                onDelete={handleDeleteQuestion}
              />
            ))}

            {activeQ && !generating && !generated && (
              <AddQuestionRow onAdd={handleAddQuestion} loading={addingQ}/>
            )}
            {activeQ && !generating && generated && (
              <div style={{ borderBottom:"1px solid var(--line)" }}>
                <AddQuestionRow onAdd={handleAddQuestion} loading={addingQ}/>
              </div>
            )}
          </div>

          {pdfAnswer && <PDFViewer answer={pdfAnswer} onClose={() => setPdfAnswer(null)}/>}
        </div>
      </div>

      {modal && (
        <UploadModal
          type={modal}
          onClose={() => setModal(null)}
          onSuccess={modal === "doc" ? handleDocUploaded : handleQUploaded}
        />
      )}
      {showExport && activeQ && <ExportModal qId={activeQ.id} onClose={() => setShowExport(false)}/>}
    </div>
  );
};

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const p = JSON.parse(atob(token.split(".")[1]));
      return { email:p.email||"user", name:(p.email||"user").split("@")[0], user_id:p.sub };
    } catch { return null; }
  });

  return (
    <>
      <Styles/>
      {!user
        ? <LoginPage onLogin={setUser}/>
        : <Dashboard user={user} onLogout={() => setUser(null)}/>
      }
    </>
  );
}
